
package com.keystone.backend.controller;

import com.keystone.backend.dto.TechnicianResponse;
import com.keystone.backend.entity.AppUser;
import com.keystone.backend.service.AppUserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class AppUserController {

    private final AppUserService appUserService;

    public AppUserController(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    // Only MANAGER can view all users
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            JwtAuthenticationToken authentication) {

        if (!hasRole(authentication, "MANAGER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(appUserService.getAllUsers());
    }

    // Only MANAGER can view an individual user
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id,
            JwtAuthenticationToken authentication) {

        if (!hasRole(authentication, "MANAGER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return appUserService.getUserById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Only MANAGER can create users
    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestBody AppUser user,
            JwtAuthenticationToken authentication) {

        if (!hasRole(authentication, "MANAGER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appUserService.createUser(user));
    }

    // Only MANAGER can delete users
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            JwtAuthenticationToken authentication) {

        if (!hasRole(authentication, "MANAGER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // DISPATCHER and MANAGER can view technicians
    @GetMapping("/technicians")
    public ResponseEntity<?> getTechnicians(
            JwtAuthenticationToken authentication) {

        if (!hasRole(authentication, "DISPATCHER", "MANAGER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<TechnicianResponse> technicians =
                appUserService.getTechnicians();

        return ResponseEntity.ok(technicians);
    }

    // Reads the role directly from the verified JWT
    private boolean hasRole(
            JwtAuthenticationToken authentication,
            String... allowedRoles) {

        String role = authentication.getToken()
                .getClaimAsString("role");

        if (role == null || role.isBlank()) {
            return false;
        }

        role = role.toUpperCase(Locale.ROOT);

        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        for (String allowedRole : allowedRoles) {
            if (role.equalsIgnoreCase(allowedRole)) {
                return true;
            }
        }

        return false;
    }
}
