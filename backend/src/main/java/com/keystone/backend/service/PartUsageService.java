package com.keystone.backend.service;

import com.keystone.backend.entity.Part;
import com.keystone.backend.entity.PartUsage;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.repository.PartUsageRepository;
import com.keystone.backend.repository.PartRepository;
import com.keystone.backend.repository.WorkOrderRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PartUsageService {

    private final PartUsageRepository partUsageRepository;
    private final PartRepository partRepository;
    private final WorkOrderRepository workOrderRepository;
    private final EntityManager entityManager;

    public PartUsageService(
            PartUsageRepository partUsageRepository,
            PartRepository partRepository,
            WorkOrderRepository workOrderRepository,
            EntityManager entityManager) {

        this.partUsageRepository = partUsageRepository;
        this.partRepository = partRepository;
        this.workOrderRepository = workOrderRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public PartUsage createPartUsage(
            PartUsage usage,
            String role,
            Long actorId) {

        requireRole(role, "TECHNICIAN");

        if (usage.getWorkOrderId() == null || usage.getPartId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Work order ID and part ID are required"
            );
        }

        Integer quantity = usage.getQtyUsed();

        if (quantity == null || quantity <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity used must be greater than zero"
            );
        }

        WorkOrder workOrder = workOrderRepository
                .findById(usage.getWorkOrderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Work order not found"
                ));

        if (actorId == null || !actorId.equals(workOrder.getAssignedTo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only log parts for work orders assigned to you"
            );
        }

        if ("CLOSED".equals(workOrder.getStatus())
                || "CANCELLED".equals(workOrder.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Parts cannot be logged for a closed or cancelled work order"
            );
        }

        // Lock this part's database row while checking and reducing stock.
        Part part = entityManager.find(
                Part.class,
                usage.getPartId(),
                LockModeType.PESSIMISTIC_WRITE
        );

        if (part == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Part not found"
            );
        }

        if (part.getStockQty() < quantity) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Insufficient stock available"
            );
        }

        part.setStockQty(part.getStockQty() - quantity);
        partRepository.save(part);

        // Both saves take place within this transaction.
        // If either fails, the stock deduction rolls back as well.
        return partUsageRepository.save(usage);
    }

    @Transactional(readOnly = true)
    public List<PartUsage> getPartUsageForWorkOrder(
            Long workOrderId,
            String role,
            Long actorId) {

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Work order not found"
                ));

        boolean staffCanView = "DISPATCHER".equals(role)
                || "MANAGER".equals(role);

        boolean assignedTechnicianCanView =
                "TECHNICIAN".equals(role)
                        && actorId != null
                        && actorId.equals(workOrder.getAssignedTo());

        if (!staffCanView && !assignedTechnicianCanView) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot view parts used on this work order"
            );
        }

        return partUsageRepository.findByWorkOrderId(workOrderId);
    }

    private void requireRole(String actualRole, String... allowedRoles) {
        for (String allowedRole : allowedRoles) {
            if (allowedRole.equals(actualRole)) {
                return;
            }
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Your role cannot perform this parts action"
        );
    }
}