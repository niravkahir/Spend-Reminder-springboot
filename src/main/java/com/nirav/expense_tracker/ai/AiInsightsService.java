package com.nirav.expense_tracker.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.nirav.expense_tracker.entity.Expense;
import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.repository.ExpenseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiInsightsService {
    private static final Logger log = LoggerFactory.getLogger(AiInsightsService.class);
    private final ExpenseRepository expenseRepository;
    private final RestTemplate restTemplate;

    @Value("${app.time-zone:Asia/Kolkata}") private String timeZone;
    @Value("${app.gemini.api-key:}") private String apiKey;
    @Value("${app.gemini.model:gemini-2.5-flash}") private String model;
    @Value("${app.gemini.base-url}") private String baseUrl;

    public AiInsightsService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(8000);
        this.restTemplate = new RestTemplate(factory);
    }

    public Map<String, Object> predictNextMonth(User user) {
        YearMonth current = YearMonth.now(ZoneId.of(timeZone));
        YearMonth firstMonth = current.minusMonths(6);
        List<Expense> history = loadExpenses(user, firstMonth.atDay(1), current.minusMonths(1).atEndOfMonth());
        Map<YearMonth, Double> monthlyTotals = new TreeMap<>();
        Map<String, Map<YearMonth, Double>> categoryByMonth = new TreeMap<>();
        for (int i = 0; i < 6; i++) monthlyTotals.put(firstMonth.plusMonths(i), 0.0);
        for (Expense expense : history) {
            YearMonth month = YearMonth.from(expense.getDate());
            monthlyTotals.merge(month, expense.getAmount(), Double::sum);
            String category = expense.getCategory().getName();
            categoryByMonth.computeIfAbsent(category, key -> new TreeMap<>()).merge(month, expense.getAmount(), Double::sum);
        }

        List<YearMonth> lastThree = List.of(current.minusMonths(3), current.minusMonths(2), current.minusMonths(1));
        double predictedTotal = lastThree.stream().mapToDouble(m -> monthlyTotals.getOrDefault(m, 0.0)).average().orElse(0.0);
        Map<String, Double> predictedCategories = new TreeMap<>();
        for (Map.Entry<String, Map<YearMonth, Double>> entry : categoryByMonth.entrySet()) {
            double average = lastThree.stream().mapToDouble(m -> entry.getValue().getOrDefault(m, 0.0)).average().orElse(0.0);
            if (average > 0) predictedCategories.put(entry.getKey(), round(average));
        }

        double latest = monthlyTotals.getOrDefault(current.minusMonths(1), 0.0);
        double previous = monthlyTotals.getOrDefault(current.minusMonths(2), 0.0);
        double change = previous == 0 ? 0 : ((latest - previous) / previous) * 100.0;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("forecastMonth", current.toString());
        result.put("predictedTotal", round(predictedTotal));
        result.put("categoryPredictions", predictedCategories);
        result.put("monthlyHistory", monthlyTotals.entrySet().stream().map(e -> Map.of("month", e.getKey().toString(), "total", round(e.getValue()))).collect(Collectors.toList()));
        result.put("latestMonthChangePercent", round(change));
        result.put("trend", change > 2 ? "INCREASING" : change < -2 ? "DECREASING" : "STABLE");
        result.put("method", "Average of the last three completed calendar months; category forecasts use the same method.");
        result.put("monthsWithData", monthlyTotals.values().stream().filter(v -> v > 0).count());
        return result;
    }

    public Map<String, Object> adviseBudget(User user, double monthlyBudget) {
        if (!Double.isFinite(monthlyBudget) || monthlyBudget <= 0) throw new IllegalArgumentException("Monthly budget must be greater than zero");
        YearMonth current = YearMonth.now(ZoneId.of(timeZone));
        List<Expense> history = loadExpenses(user, current.minusMonths(6).atDay(1), current.minusMonths(1).atEndOfMonth());
        Map<String, Double> byCategory = history.stream().collect(Collectors.groupingBy(e -> e.getCategory().getName(), TreeMap::new, Collectors.summingDouble(Expense::getAmount)));
        double historicalTotal = byCategory.values().stream().mapToDouble(Double::doubleValue).sum();
        List<String> allCategories = byCategory.isEmpty() ? List.of("Food", "Travel", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "Other") : new ArrayList<>(byCategory.keySet());
        double denominator = historicalTotal > 0 ? historicalTotal : allCategories.size();
        double savingsTarget = round(monthlyBudget * 0.10);
        Map<String, Double> limits = new LinkedHashMap<>();
        for (String category : allCategories) {
            double weight = historicalTotal > 0 ? byCategory.getOrDefault(category, 0.0) / denominator : 1.0 / denominator;
            limits.put(category, round((monthlyBudget - savingsTarget) * weight));
        }
        List<String> reduce = byCategory.entrySet().stream().sorted(Map.Entry.<String, Double>comparingByValue().reversed()).limit(3).map(Map.Entry::getKey).collect(Collectors.toList());
        List<String> suggestions = new ArrayList<>();
        suggestions.add("Set aside about " + savingsTarget + " before discretionary spending (10% of the budget).");
        if (!reduce.isEmpty()) suggestions.add("Review " + String.join(", ", reduce) + " first; these are your highest-spend categories in the available history.");
        suggestions.add("Track spending weekly and adjust category limits rather than waiting until month-end.");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("monthlyBudget", round(monthlyBudget));
        result.put("suggestedSavings", savingsTarget);
        result.put("spendableBudget", round(monthlyBudget - savingsTarget));
        result.put("categoryLimits", limits);
        result.put("categoriesToReview", reduce);
        result.put("recommendations", suggestions);
        result.put("historicalCategorySpend", byCategory);
        result.put("aiEnhanced", false);
        result.put("advisorNote", "The allocation is calculated from your previous six completed months. With no history, an equal category split is used.");

        String aiText = askGemini("You are a cautious personal budgeting assistant. Based only on this user's summarized category spending and proposed budget, give 3 concise practical suggestions. Do not claim guaranteed savings or invent transaction facts. Budget: " + monthlyBudget + ". Historical category totals: " + byCategory + ". Suggested category limits: " + limits + ".");
        if (aiText != null) {
            result.put("aiEnhanced", true);
            result.put("aiRecommendations", aiText);
        }
        return result;
    }

    private List<Expense> loadExpenses(User user, java.time.LocalDate start, java.time.LocalDate end) {
        return expenseRepository.findByUserAndDateBetween(user, start, end);
    }

    private String askGemini(String prompt) {
        if (apiKey == null || apiKey.isBlank()) return null;
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            String url = baseUrl + "/" + model + ":generateContent";
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, request, JsonNode.class);
            JsonNode textNode = response.getBody() == null ? null : response.getBody().path("candidates").path(0).path("content").path("parts").path(0).path("text");
            return textNode == null || textNode.isMissingNode() ? null : textNode.asText();
        } catch (RestClientException ex) {
            log.warn("Gemini advisor unavailable; returning deterministic budget advice: {}", ex.getMessage());
            return null;
        }
    }

    private double round(double value) { return Math.round(value * 100.0) / 100.0; }
}
