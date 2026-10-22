package com.keystone.backend.controller;

import com.keystone.backend.dto.CustomerRequestCreateRequest;
import com.keystone.backend.dto.CustomerStatusHistoryResponse;
import com.keystone.backend.dto.CustomerWorkOrderResponse;
import com.keystone.backend.entity.Site;
import com.keystone.backend.service.CustomerPortalService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/customer-portal")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerPortalController {

    private final CustomerPortalService customerPortalService;

    public CustomerPortalController(
            CustomerPortalService customerPortalService) {
        this.customerPortalService = customerPortalService;
    }

    @GetMapping("/sites")
    public List<Site> getMySites(@AuthenticationPrincipal Jwt jwt) {
        return customerPortalService.getMySites(
                getRole(jwt), getUserId(jwt));
    }

    @GetMapping("/work-orders")
    public List<CustomerWorkOrderResponse> getMyWorkOrders(
            @AuthenticationPrincipal Jwt jwt) {
        return customerPortalService.getMyWorkOrders(
                getRole(jwt), getUserId(jwt));
    }

    @PostMapping("/requests")
    public ResponseEntity<CustomerWorkOrderResponse> createRequest(
            @RequestBody CustomerRequestCreateRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        CustomerWorkOrderResponse created =
                customerPortalService.createRequest(
                        request, getRole(jwt), getUserId(jwt));

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/work-orders/{id}")
    public CustomerWorkOrderResponse getMyWorkOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return customerPortalService.getMyWorkOrder(
                id, getRole(jwt), getUserId(jwt));
    }

    @GetMapping("/work-orders/{id}/history")
    public List<CustomerStatusHistoryResponse> getMyWorkOrderHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return customerPortalService.getMyWorkOrderHistory(
                id, getRole(jwt), getUserId(jwt));
    }

    private String getRole(Jwt jwt) {
        String role = jwt.getClaimAsString("role");

        if (role == null || role.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User role missing from token");
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
                "User ID missing from token");
    }
}