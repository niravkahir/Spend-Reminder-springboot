
package com.nirav.expense_tracker.controller;

import com.nirav.expense_tracker.ai.AiInsightsService;
import com.nirav.expense_tracker.dto.response.ApiResponse;
import com.nirav.expense_tracker.entity.User;
import com.nirav.expense_tracker.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiInsightsController {

    private final AiInsightsService aiInsightsService;
    private final UserService userService;

    public AiInsightsController(
            AiInsightsService aiInsightsService,
            UserService userService
    ) {
        this.aiInsightsService = aiInsightsService;
        this.userService = userService;
    }

    private User currentUser() {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userService.findByUsername(username);
    }

    @GetMapping("/prediction")
    public ResponseEntity<ApiResponse<Map<String, Object>>> prediction() {

        User user = currentUser();

        Map<String, Object> prediction =
                aiInsightsService.predictNextMonth(user);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Expense prediction generated",
                        prediction
                )
        );
    }
}
