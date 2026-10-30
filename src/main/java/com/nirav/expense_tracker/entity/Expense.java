package com.nirav.expense_tracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private LocalDate date;

    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    public Expense() {}

    public Expense(Double amount, LocalDate date, String description, User user, Category category) {
        this.amount = amount;
        this.date = date;
        this.description = description;
        this.user = user;
        this.category = category;
    }

    // Getters
    public Long getId() { return id; }
    public Double getAmount() { return amount; }
    public LocalDate getDate() { return date; }
    public String getDescription() { return description; }
    public User getUser() { return user; }
    public Category getCategory() { return category; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setAmount(Double amount) { this.amount = amount; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setDescription(String description) { this.description = description; }
    public void setUser(User user) { this.user = user; }
    public void setCategory(Category category) { this.category = category; }
}