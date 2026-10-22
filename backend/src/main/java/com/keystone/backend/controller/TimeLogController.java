package com.keystone.backend.controller;

import com.keystone.backend.entity.TimeLog;
import com.keystone.backend.service.TimeLogService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/time-logs")
@CrossOrigin(origins = "http://localhost:5173")
public class TimeLogController {

    private final TimeLogService timeLogService;

    public TimeLogController(TimeLogService timeLogService) {
        this.timeLogService = timeLogService;
    }

    @PostMapping
    public TimeLog createTimeLog(
            @RequestBody TimeLog timeLog,
            @AuthenticationPrincipal Jwt jwt) {

        return timeLogService.createTimeLog(
                timeLog,
                getRole(jwt),
                getUserId(jwt)
        );
    }

    @GetMapping("/work-order/{workOrderId}")
    public List<TimeLog> getTimeLogsForWorkOrder(
            @PathVariable Long workOrderId,
            @AuthenticationPrincipal Jwt jwt) {

        return timeLogService.getTimeLogsForWorkOrder(
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