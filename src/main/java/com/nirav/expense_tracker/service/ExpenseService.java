package com.nirav.expense_tracker.service;

import com.nirav.expense_tracker.dto.CategoryWiseExpense;
import com.nirav.expense_tracker.dto.ExpenseDTO;
import com.nirav.expense_tracker.entity.Category;
import com.nirav.expense_tracker.entity.Expense;
import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.exception.ResourceNotFoundException;
import com.nirav.expense_tracker.exception.UnauthorizedAccessException;
import com.nirav.expense_tracker.repository.CategoryRepository;
import com.nirav.expense_tracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Expense addExpense(ExpenseDTO expenseDTO, User user) {
        Category category = categoryRepository.findById(expenseDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", expenseDTO.getCategoryId()));

        Expense expense = new Expense();
        expense.setAmount(expenseDTO.getAmount());
        expense.setDate(expenseDTO.getDate());
        expense.setDescription(expenseDTO.getDescription());
        expense.setUser(user);
        expense.setCategory(category);

        return expenseRepository.save(expense);
    }

    // OLD: Get all expenses (no pagination)
    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUser(user);
    }

    // NEW: Get paginated expenses
    public Page<Expense> getUserExpensesPaginated(User user, int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        return expenseRepository.findByUser(user, pageable);
    }

    // NEW: Get paginated expenses by date range
    public Page<Expense> getExpensesByDateRangePaginated(User user, LocalDate start, LocalDate end,
                                                         int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        return expenseRepository.findByUserAndDateBetween(user, start, end, pageable);
    }

    public Expense updateExpense(Long id, ExpenseDTO expenseDTO, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", id));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You can only update your own expenses", user.getUsername());
        }

        Category category = categoryRepository.findById(expenseDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", expenseDTO.getCategoryId()));

        expense.setAmount(expenseDTO.getAmount());
        expense.setDate(expenseDTO.getDate());
        expense.setDescription(expenseDTO.getDescription());
        expense.setCategory(category);

        return expenseRepository.save(expense);
    }

    public void deleteExpense(Long id, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", id));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You can only delete your own expenses", user.getUsername());
        }

        expenseRepository.delete(expense);
    }

    public Double getTotalExpenses(User user) {
        List<Expense> expenses = expenseRepository.findByUser(user);
        if (expenses == null || expenses.isEmpty()) {
            return 0.0;
        }
        return expenses.stream().mapToDouble(Expense::getAmount).sum();
    }

    public Double getTotalExpenses(User user, LocalDate start, LocalDate end) {
        return expenseRepository.findByUserAndDateBetween(user, start, end).stream()
                .mapToDouble(Expense::getAmount).sum();
    }

    public List<CategoryWiseExpense> getCategoryWiseExpenses(User user) {
        List<Object[]> results = expenseRepository.getCategoryWiseExpenses(user);
        return results.stream()
                .map(obj -> new CategoryWiseExpense((String) obj[0], (Double) obj[1]))
                .collect(Collectors.toList());
    }

    // OLD: Get expenses by date range
    public List<Expense> getExpensesByDateRange(User user, LocalDate start, LocalDate end) {
        return expenseRepository.findByUserAndDateBetween(user, start, end);
    }
}