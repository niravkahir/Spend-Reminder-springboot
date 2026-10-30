package com.nirav.expense_tracker.service;

import com.nirav.expense_tracker.dto.RegisterRequest;
import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.exception.DuplicateResourceException;
import com.nirav.expense_tracker.exception.ResourceNotFoundException;
import com.nirav.expense_tracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("User", "username", request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        // Public registration must never grant privileged roles. Admin promotion is admin-only.

        User user = new User();
        user.setUsername(request.getUsername());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");

        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(Long userId) {
        User user = findById(userId);
        userRepository.delete(user);
    }

    public User updateUserRole(Long userId, String role) {
        User user = findById(userId);

        if (!role.equals("USER") && !role.equals("ADMIN")) {
            throw new RuntimeException("Invalid role. Must be USER or ADMIN");
        }

        user.setRole(role);
        return userRepository.save(user);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }
}