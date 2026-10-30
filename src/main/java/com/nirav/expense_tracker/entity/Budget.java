package com.nirav.expense_tracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "budgets", uniqueConstraints = @UniqueConstraint(name = "uk_budget_user_month", columnNames = {"user_id", "month"}))
public class Budget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double monthlyLimit;

    @Column(nullable = false, length = 7)
    private String month;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    public Budget() {}
    public Budget(Double monthlyLimit, String month, User user) {
        this.monthlyLimit = monthlyLimit;
        this.month = month;
        this.user = user;
    }
    public Long getId() { return id; }
    public Double getMonthlyLimit() { return monthlyLimit; }
    public String getMonth() { return month; }
    public User getUser() { return user; }
    public void setId(Long id) { this.id = id; }
    public void setMonthlyLimit(Double monthlyLimit) { this.monthlyLimit = monthlyLimit; }
    public void setMonth(String month) { this.month = month; }
    public void setUser(User user) { this.user = user; }
}
