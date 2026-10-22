package com.keystone.backend.controller;

import com.keystone.backend.entity.Part;
import com.keystone.backend.service.PartService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
@CrossOrigin(origins = "http://localhost:5173")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @GetMapping
    public List<Part> getAllParts(@AuthenticationPrincipal Jwt jwt) {
        return partService.getAllParts(getRole(jwt));
    }

    @GetMapping("/{id}")
    public Part getPartById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return partService.getPartById(id, getRole(jwt));
    }

    @PostMapping
    public Part createPart(
            @RequestBody Part part,
            @AuthenticationPrincipal Jwt jwt) {
        return partService.createPart(part, getRole(jwt));
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
}