package com.nirav.expense_tracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    private String role = "USER";

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Expense> expenses = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Budget> budgets = new ArrayList<>();

    public User() {}

    public User(String username, String name, String email, String password, String role) {
        this.username = username;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
    public List<Expense> getExpenses() { return expenses; }
    public List<Budget> getBudgets() { return budgets; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(String role) { this.role = role; }
    public void setExpenses(List<Expense> expenses) { this.expenses = expenses; }
    public void setBudgets(List<Budget> budgets) { this.budgets = budgets; }
}