package com.keystone.backend.controller;

import com.keystone.backend.dto.DashboardSummaryResponse;
import com.keystone.backend.service.DashboardService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary(
            @AuthenticationPrincipal Jwt jwt) {

        return dashboardService.getSummary(
                getRole(jwt),
                getUserId(jwt)
        );
    }

    private String getRole(Jwt jwt) {
        String role = jwt.getClaimAsString("role");

        if (role == null || role.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User role missing from token"
            );
        }

        return role;
    }

    private Long getUserId(Jwt jwt) {
        Object claim = jwt.getClaim("userId");

        if (claim instanceof Number number) {
            return number.longValue();
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "User ID missing from token"
        );
    }
}