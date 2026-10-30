package com.nirav.expense_tracker.service;

import com.nirav.expense_tracker.entity.Budget;
import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.exception.ResourceNotFoundException;
import com.nirav.expense_tracker.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;

@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseService expenseService;

    @Value("${app.time-zone:Asia/Kolkata}")
    private String timeZone;

    public Budget setBudget(Double monthlyLimit, User user) {
        if (monthlyLimit == null || monthlyLimit <= 0) {
            throw new IllegalArgumentException("Monthly limit must be greater than 0");
        }

        String currentMonth = YearMonth.now(ZoneId.of(timeZone)).toString();

        Budget budget = budgetRepository.findByUserAndMonth(user, currentMonth)
                .orElse(new Budget());

        budget.setMonthlyLimit(monthlyLimit);
        budget.setMonth(currentMonth);
        budget.setUser(user);

        return budgetRepository.save(budget);
    }

    public Budget getUserBudget(User user) {
        String currentMonth = YearMonth.now(ZoneId.of(timeZone)).toString();
        return budgetRepository.findByUserAndMonth(user, currentMonth)
                .orElse(null);
    }

    public String checkBudgetStatus(User user) {
        Budget budget = getUserBudget(user);
        if (budget == null) {
            return "No budget set for this month";
        }

        YearMonth budgetMonth = YearMonth.parse(budget.getMonth());
        Double totalExpenses = expenseService.getTotalExpenses(user, budgetMonth.atDay(1), budgetMonth.atEndOfMonth());
        double remaining = budget.getMonthlyLimit() - totalExpenses;

        if (remaining < 0) {
            return String.format("Budget exceeded! Limit: %.2f, Spent: %.2f, Over budget: %.2f",
                    budget.getMonthlyLimit(), totalExpenses, Math.abs(remaining));
        } else if (remaining < budget.getMonthlyLimit() * 0.2) {
            return String.format("Warning: Only %.2f remaining of your %.2f budget",
                    remaining, budget.getMonthlyLimit());
        } else {
            return String.format("On track! Spent: %.2f of %.2f budget. Remaining: %.2f",
                    totalExpenses, budget.getMonthlyLimit(), remaining);
        }
    }
}