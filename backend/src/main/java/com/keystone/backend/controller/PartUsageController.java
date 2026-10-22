package com.keystone.backend.controller;

import com.keystone.backend.entity.PartUsage;
import com.keystone.backend.service.PartUsageService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/part-usage")
@CrossOrigin(origins = "http://localhost:5173")
public class PartUsageController {

    private final PartUsageService partUsageService;

    public PartUsageController(PartUsageService partUsageService) {
        this.partUsageService = partUsageService;
    }

    @PostMapping
    public PartUsage createPartUsage(
            @RequestBody PartUsage partUsage,
            @AuthenticationPrincipal Jwt jwt) {

        return partUsageService.createPartUsage(
                partUsage,
                getRole(jwt),
                getUserId(jwt)
        );
    }

    @GetMapping("/work-order/{workOrderId}")
    public List<PartUsage> getPartUsageForWorkOrder(
            @PathVariable Long workOrderId,
            @AuthenticationPrincipal Jwt jwt) {

        return partUsageService.getPartUsageForWorkOrder(
                workOrderId,
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