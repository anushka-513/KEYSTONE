package com.keystone.backend.controller;

import com.keystone.backend.dto.WorkOrderAssignmentRequest;
import com.keystone.backend.dto.WorkOrderStatusUpdateRequest;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.service.WorkOrderService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
@CrossOrigin(origins = "http://localhost:5173")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @GetMapping
    public List<WorkOrder> getAllWorkOrders(
            @AuthenticationPrincipal Jwt jwt) {

        return workOrderService.getAllWorkOrders(
                getRole(jwt),
                getUserId(jwt)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> getWorkOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return workOrderService.getWorkOrderById(
                        id,
                        getRole(jwt),
                        getUserId(jwt)
                )
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public WorkOrder updateStatus(
            @PathVariable Long id,
            @RequestBody WorkOrderStatusUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        return workOrderService.updateStatus(
                id,
                request.getStatus(),
                getRole(jwt),
                getUserId(jwt)
        );
    }

    @PatchMapping("/{id}/assign")
    public WorkOrder assignTechnician(
            @PathVariable Long id,
            @RequestBody WorkOrderAssignmentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        return workOrderService.assignTechnician(
                id,
                request.getAssignedTo(),
                getRole(jwt),
                getUserId(jwt)
        );
    }

    @PostMapping
    public WorkOrder createWorkOrder(
            @RequestBody WorkOrder workOrder,
            @AuthenticationPrincipal Jwt jwt) {

        return workOrderService.createWorkOrder(
                workOrder,
                getRole(jwt),
                getUserId(jwt)
        );
    }

    @PutMapping("/{id}")
    public WorkOrder updateWorkOrder(
            @PathVariable Long id,
            @RequestBody WorkOrder workOrder,
            @AuthenticationPrincipal Jwt jwt) {

        return workOrderService.updateWorkOrder(
                id,
                workOrder,
                getRole(jwt)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        workOrderService.deleteWorkOrder(
                id,
                getRole(jwt)
        );

        return ResponseEntity.noContent().build();
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