package com.keystone.backend.service;

import com.keystone.backend.entity.AppUser;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.entity.WorkOrderStatusHistory;
import com.keystone.backend.repository.AppUserRepository;
import com.keystone.backend.repository.WorkOrderRepository;
import com.keystone.backend.repository.WorkOrderStatusHistoryRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class WorkOrderService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "NEW", "ASSIGNED", "IN_PROGRESS", "ON_HOLD",
            "COMPLETED", "CLOSED", "CANCELLED"
    );

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final AppUserRepository appUserRepository;

    public WorkOrderService(
            WorkOrderRepository workOrderRepository,
            WorkOrderStatusHistoryRepository historyRepository,
            AppUserRepository appUserRepository) {
        this.workOrderRepository = workOrderRepository;
        this.historyRepository = historyRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkOrder> getAllWorkOrders(String role, Long userId) {
        if (hasRole(role, "DISPATCHER", "MANAGER")) {
            return workOrderRepository.findAll();
        }

        if ("TECHNICIAN".equals(role)) {
            return workOrderRepository.findAll()
                    .stream()
                    .filter(order -> userId.equals(order.getAssignedTo()))
                    .toList();
        }

        throw forbidden("You cannot access the general work-order list");
    }

    @Transactional(readOnly = true)
    public Optional<WorkOrder> getWorkOrderById(
            Long id, String role, Long userId) {

        if (hasRole(role, "DISPATCHER", "MANAGER")) {
            return workOrderRepository.findById(id);
        }

        if ("TECHNICIAN".equals(role)) {
            return workOrderRepository.findById(id)
                    .filter(order -> userId.equals(order.getAssignedTo()));
        }

        throw forbidden("You cannot access this work order");
    }

    @Transactional
    public WorkOrder createWorkOrder(
            WorkOrder order, String role, Long actorId) {

        requireDispatcherOrManager(role);

        Long technicianId = order.getAssignedTo();

        order.setAssignedTo(null);
        order.setStatus("NEW");

        WorkOrder created = workOrderRepository.save(order);

        if (technicianId != null) {
            return assignTechnician(
                    created.getId(), technicianId, role, actorId);
        }

        return created;
    }

    @Transactional
    public WorkOrder updateWorkOrder(
            Long id, WorkOrder updated, String role) {

        requireDispatcherOrManager(role);

        WorkOrder existing = workOrderRepository.findById(id)
                .orElseThrow(() -> notFound("Work order not found"));

        if (isTerminal(existing.getStatus())) {
            throw conflict("Closed or cancelled work orders cannot be edited");
        }

        existing.setCustomerId(updated.getCustomerId());
        existing.setSiteId(updated.getSiteId());
        existing.setCode(updated.getCode());
        existing.setTitle(updated.getTitle());
        existing.setPriority(updated.getPriority());
        existing.setSlaDueAt(updated.getSlaDueAt());

        return workOrderRepository.save(existing);
    }

    @Transactional
    public WorkOrder assignTechnician(
            Long id, Long technicianId, String role, Long actorId) {

        requireDispatcherOrManager(role);

        if (technicianId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Technician ID is required");
        }

        AppUser technician = appUserRepository.findById(technicianId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Technician does not exist"));

        if (!"TECHNICIAN".equals(technician.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The selected user is not a technician");
        }

        WorkOrder order = workOrderRepository.findById(id)
                .orElseThrow(() -> notFound("Work order not found"));

        String oldStatus = order.getStatus();

        if (isTerminal(oldStatus) || "COMPLETED".equals(oldStatus)) {
            throw conflict("This work order cannot be reassigned");
        }

        order.setAssignedTo(technicianId);

        boolean statusChanged = "NEW".equals(oldStatus);

        if (statusChanged) {
            order.setStatus("ASSIGNED");
        }

        WorkOrder saved = workOrderRepository.save(order);

        if (statusChanged) {
            saveStatusHistory(saved.getId(), oldStatus, "ASSIGNED", actorId);
        }

        return saved;
    }

    @Transactional
    public WorkOrder updateStatus(
            Long id, String newStatus, String role, Long actorId) {

        if (newStatus == null || !VALID_STATUSES.contains(newStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Unknown work-order status");
        }

        WorkOrder order = workOrderRepository.findById(id)
                .orElseThrow(() -> notFound("Work order not found"));

        String oldStatus = order.getStatus();

        switch (newStatus) {
            case "ASSIGNED" -> {
                requireDispatcherOrManager(role);
                if (order.getAssignedTo() == null) {
                    throw conflict("Assign a technician first");
                }
            }
            case "IN_PROGRESS", "ON_HOLD", "COMPLETED" ->
                    requireAssignedTechnician(order, role, actorId);

            case "CLOSED" -> requireRole(role, "MANAGER");

            case "CANCELLED" -> requireDispatcherOrManager(role);

            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This status cannot be requested directly");
        }

        if (oldStatus.equals(newStatus)) {
            return order;
        }

        if (!isValidTransition(oldStatus, newStatus)) {
            throw conflict(
                    "Invalid status transition: "
                            + oldStatus + " -> " + newStatus);
        }

        order.setStatus(newStatus);
        WorkOrder saved = workOrderRepository.save(order);

        saveStatusHistory(saved.getId(), oldStatus, newStatus, actorId);

        return saved;
    }

    @Transactional
    public void deleteWorkOrder(Long id, String role) {
        requireRole(role, "MANAGER");

        WorkOrder order = workOrderRepository.findById(id)
                .orElseThrow(() -> notFound("Work order not found"));

        if (!"NEW".equals(order.getStatus())) {
            throw conflict(
                    "Only NEW work orders can be deleted. Cancel other work orders.");
        }

        workOrderRepository.delete(order);
    }

    private void saveStatusHistory(
            Long orderId, String from, String to, Long actorId) {

        WorkOrderStatusHistory history = new WorkOrderStatusHistory();
        history.setWorkOrderId(orderId);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedBy(actorId);
        history.setChangedAt(OffsetDateTime.now());

        historyRepository.save(history);
    }

    private boolean isValidTransition(String from, String to) {
        return switch (from) {
            case "NEW" -> to.equals("ASSIGNED") || to.equals("CANCELLED");
            case "ASSIGNED" -> to.equals("IN_PROGRESS") || to.equals("CANCELLED");
            case "IN_PROGRESS" ->
                    to.equals("ON_HOLD")
                            || to.equals("COMPLETED")
                            || to.equals("CANCELLED");
            case "ON_HOLD" ->
                    to.equals("IN_PROGRESS") || to.equals("CANCELLED");
            case "COMPLETED" -> to.equals("CLOSED");
            case "CLOSED", "CANCELLED" -> false;
            default -> false;
        };
    }

    private boolean isTerminal(String status) {
        return "CLOSED".equals(status) || "CANCELLED".equals(status);
    }

    private void requireAssignedTechnician(
            WorkOrder order, String role, Long userId) {

        requireRole(role, "TECHNICIAN");

        if (userId == null || !userId.equals(order.getAssignedTo())) {
            throw forbidden(
                    "Only the assigned technician can perform this action");
        }
    }

    private void requireDispatcherOrManager(String role) {
        requireRole(role, "DISPATCHER", "MANAGER");
    }

    private void requireRole(String actualRole, String... allowedRoles) {
        if (!hasRole(actualRole, allowedRoles)) {
            throw forbidden("Your role cannot perform this action");
        }
    }

    private boolean hasRole(String actualRole, String... allowedRoles) {
        return Arrays.asList(allowedRoles).contains(actualRole);
    }

    private ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}