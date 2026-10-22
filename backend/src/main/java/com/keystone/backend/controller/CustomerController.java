package com.keystone.backend.controller;

import com.keystone.backend.entity.Customer;
import com.keystone.backend.service.CustomerService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public List<Customer> getAllCustomers(
            @AuthenticationPrincipal Jwt jwt) {
        return customerService.getAllCustomers(getRole(jwt));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return customerService.getCustomerById(id, getRole(jwt))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Customer createCustomer(
            @RequestBody Customer customer,
            @AuthenticationPrincipal Jwt jwt) {

        return customerService.createCustomer(customer, getRole(jwt));
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