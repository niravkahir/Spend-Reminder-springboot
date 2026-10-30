package com.nirav.expense_tracker.controller;

import com.nirav.expense_tracker.dto.LoginRequest;
import com.nirav.expense_tracker.dto.RegisterRequest;
import com.nirav.expense_tracker.dto.response.ApiResponse;
import com.nirav.expense_tracker.dto.response.JwtResponse;
import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.security.JwtUtils;
import com.nirav.expense_tracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // Set authentication in context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user details
            User user = userService.findByUsername(loginRequest.getUsername());

            // Generate JWT token
            String token = jwtUtils.generateTokenWithRole(user.getUsername(), user.getRole());

            // Create response
            JwtResponse jwtResponse = new JwtResponse(
                    token,
                    user.getUsername(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole()
            );

            return ResponseEntity.ok(ApiResponse.success("Login successful", jwtResponse));

        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Invalid username or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", user));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        // Since we're using JWT, logout is handled client-side
        // Just return success message
        return ResponseEntity.ok(ApiResponse.success("Logout successful. Please remove your token on client side."));
    }
}