
package com.nirav.expense_tracker.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirav.expense_tracker.entity.Expense;
import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.repository.ExpenseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiInsightsService {

    private static final Logger log =
            LoggerFactory.getLogger(AiInsightsService.class);

    private static final int HISTORY_MONTHS = 3;

    private final ExpenseRepository expenseRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.time-zone:Asia/Kolkata}")
    private String timeZone;

    @Value("${app.groq.api-key:}")
    private String apiKey;

    @Value("${app.groq.model:openai/gpt-oss-120b}")
    private String model;

    @Value("${app.groq.base-url:https://api.groq.com/openai/v1}")
    private String baseUrl;

    public AiInsightsService(
            ExpenseRepository expenseRepository
    ) {
        this.expenseRepository = expenseRepository;
        this.objectMapper = new ObjectMapper();

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(5000);
        factory.setReadTimeout(30000);

        this.restTemplate = new RestTemplate(factory);
    }

    public Map<String, Object> predictNextMonth(User user) {

        YearMonth currentMonth =
                YearMonth.now(ZoneId.of(timeZone));

        YearMonth forecastMonth =
                currentMonth.plusMonths(1);

        YearMonth startMonth =
                currentMonth.minusMonths(HISTORY_MONTHS);

        YearMonth endMonth =
                currentMonth.minusMonths(1);

        List<Expense> expenses =
                expenseRepository.findByUserAndDateBetween(
                        user,
                        startMonth.atDay(1),
                        endMonth.atEndOfMonth()
                );

        List<Map<String, Object>> monthlyHistory =
                buildMonthlyHistory(
                        expenses,
                        startMonth,
                        endMonth
                );

        Map<String, Double> categoryTotals =
                buildCategoryTotals(expenses);

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put(
                "forecastMonth",
                forecastMonth.toString()
        );

        result.put(
                "usingDemoData",
                false
        );

        result.put(
                "historyMonths",
                monthlyHistory.size()
        );

        result.put(
                "monthlyHistory",
                monthlyHistory
        );

        if (expenses.isEmpty()) {

            result.put("available", false);

            result.put(
                    "message",
                    "No expenses found in the previous three completed months. "
                            + "Add your expenses to generate an AI prediction."
            );

            return result;
        }

        if (apiKey == null || apiKey.isBlank()) {

            result.put("available", false);

            result.put(
                    "message",
                    "AI prediction is currently unavailable. "
                            + "Please try again later."
            );

            return result;
        }

        String prompt = buildPredictionPrompt(
                forecastMonth,
                monthlyHistory,
                categoryTotals
        );

        JsonNode aiResponse = askGroq(prompt);

        if (aiResponse == null) {

            result.put("available", false);

            result.put(
                    "message",
                    "AI could not generate a prediction right now. "
                            + "Please try again later."
            );

            return result;
        }

        result.put("available", true);
        result.put("prediction", aiResponse);

        return result;
    }

    private List<Map<String, Object>> buildMonthlyHistory(
            List<Expense> expenses,
            YearMonth startMonth,
            YearMonth endMonth
    ) {

        Map<YearMonth, Double> totals =
                new TreeMap<>();

        for (Expense expense : expenses) {

            YearMonth month =
                    YearMonth.from(expense.getDate());

            totals.merge(
                    month,
                    expense.getAmount(),
                    Double::sum
            );
        }

        List<Map<String, Object>> history =
                new ArrayList<>();

        for (
                YearMonth month = startMonth;
                !month.isAfter(endMonth);
                month = month.plusMonths(1)
        ) {

            Map<String, Object> monthData =
                    new LinkedHashMap<>();

            monthData.put(
                    "month",
                    month.toString()
            );

            monthData.put(
                    "total",
                    round(totals.getOrDefault(month, 0.0))
            );

            history.add(monthData);
        }

        return history;
    }

    private Map<String, Double> buildCategoryTotals(
            List<Expense> expenses
    ) {

        return expenses.stream()
                .collect(
                        Collectors.groupingBy(
                                expense ->
                                        expense.getCategory().getName(),
                                TreeMap::new,
                                Collectors.summingDouble(
                                        Expense::getAmount
                                )
                        )
                );
    }

    private String buildPredictionPrompt(
            YearMonth forecastMonth,
            List<Map<String, Object>> monthlyHistory,
            Map<String, Double> categoryTotals
    ) {

        return """
                You are an intelligent personal expense
                forecasting assistant.

                Analyze the supplied REAL historical expense data
                and predict the user's expenses for the
                specified upcoming month.

                FORECAST MONTH:
                %s

                MONTHLY EXPENSE HISTORY:
                %s

                CATEGORY-WISE EXPENSE TOTALS:
                %s

                INSTRUCTIONS:

                1. Predict the total expenses for the forecast month.

                2. Predict spending for each category.

                3. Identify whether spending is increasing,
                   decreasing, or stable.

                4. Explain the prediction using observed patterns
                   in the provided historical data.

                5. Provide three short, practical recommendations.

                6. Do not invent transactions or claim certainty.

                7. The historical data contains exactly three
                   completed calendar months.
                   Do not assume any other historical data exists.

                8. Category predictions should approximately
                   add up to the predicted total.

                9. Analyze trends across all three months.
                   Do not simply repeat the latest month's
                   expense total as the prediction.

                10. If the historical data is insufficient or
                    inconsistent, reflect that in the reasoning
                    and confidence level.

                11. Return ONLY valid JSON.
                    Do not include Markdown or code fences.

                REQUIRED JSON FORMAT:

                {
                  "predictedTotal": 10000,
                  "trend": "STABLE",
                  "trendPercentage": 2.5,
                  "categoryPredictions": {
                    "Food": 3000,
                    "Travel": 1500,
                    "Bills": 2500
                  },
                  "reasoning": "Explain the forecast briefly.",
                  "recommendations": [
                    "Recommendation one",
                    "Recommendation two",
                    "Recommendation three"
                  ],
                  "confidence": "LOW"
                }

                ALLOWED TREND VALUES:

                INCREASING
                DECREASING
                STABLE

                ALLOWED CONFIDENCE VALUES:

                LOW
                MEDIUM
                HIGH

                Important:
                Confidence must reflect the amount and
                consistency of the provided historical data.
                """.formatted(
                forecastMonth,
                monthlyHistory,
                categoryTotals
        );
    }

    private JsonNode askGroq(String prompt) {

        try {

            Map<String, Object> body =
                    new LinkedHashMap<>();

            body.put("model", model);

            body.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content",
                            "You are a personal expense forecasting assistant. "
                                    + "Return only valid JSON without Markdown."
                    ),
                    Map.of(
                            "role", "user",
                            "content", prompt
                    )
            ));

            body.put("temperature", 0.2);
            body.put("max_tokens", 2048);

            body.put(
                    "response_format",
                    Map.of("type", "json_object")
            );

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.APPLICATION_JSON
            );

            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(body, headers);

            String url =
                    baseUrl + "/chat/completions";

            log.info(
                    "Sending AI prediction request. Model: {}",
                    model
            );

            ResponseEntity<JsonNode> response =
                    restTemplate.postForEntity(
                            url,
                            request,
                            JsonNode.class
                    );

            JsonNode responseBody =
                    response.getBody();

            if (responseBody == null) {

                log.error("AI provider returned an empty response body.");

                return null;
            }

            JsonNode textNode =
                    responseBody
                            .path("choices")
                            .path(0)
                            .path("message")
                            .path("content");

            if (textNode.isMissingNode()
                    || textNode.isNull()
                    || textNode.asText().isBlank()) {

                log.error(
                        "AI provider returned empty content: {}",
                        responseBody
                );

                return null;
            }

            String generatedText =
                    textNode.asText().trim();

            if (generatedText.startsWith("```")) {

                generatedText = generatedText
                        .replaceAll("^```(?:json)?\\s*", "")
                        .replaceAll("\\s*```$", "")
                        .trim();
            }

            return objectMapper.readTree(generatedText);

        } catch (org.springframework.web.client.HttpStatusCodeException exception) {

            log.error("========== AI API ERROR ==========");
            log.error(
                    "HTTP Status: {}",
                    exception.getStatusCode()
            );
            log.error(
                    "Response Body: {}",
                    exception.getResponseBodyAsString()
            );
            log.error("=================================");

            return null;

        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {

            log.error(
                    "AI returned invalid JSON: {}",
                    exception.getOriginalMessage()
            );

            return null;

        } catch (Exception exception) {

            log.error(
                    "Unexpected AI integration error: {}",
                    exception.getMessage(),
                    exception
            );

            return null;
        }
    }

    private double round(double value) {

        return Math.round(
                value * 100.0
        ) / 100.0;
    }
}