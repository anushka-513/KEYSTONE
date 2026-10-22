package com.keystone.backend.controller;

import com.keystone.backend.entity.Site;
import com.keystone.backend.service.SiteService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
@CrossOrigin(origins = "http://localhost:5173")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping
    public List<Site> getAllSites(@AuthenticationPrincipal Jwt jwt) {
        return siteService.getAllSites(getRole(jwt));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Site> getSiteById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return siteService.getSiteById(id, getRole(jwt))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public List<Site> getSitesByCustomer(
            @PathVariable Long customerId,
            @AuthenticationPrincipal Jwt jwt) {

        return siteService.getSitesByCustomer(customerId, getRole(jwt));
    }

    @PostMapping
    public Site createSite(
            @RequestBody Site site,
            @AuthenticationPrincipal Jwt jwt) {

        return siteService.createSite(site, getRole(jwt));
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