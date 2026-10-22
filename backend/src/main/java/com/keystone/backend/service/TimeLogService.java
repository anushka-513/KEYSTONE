package com.keystone.backend.service;

import com.keystone.backend.entity.TimeLog;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.repository.TimeLogRepository;
import com.keystone.backend.repository.WorkOrderRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final WorkOrderRepository workOrderRepository;

    public TimeLogService(
            TimeLogRepository timeLogRepository,
            WorkOrderRepository workOrderRepository) {
        this.timeLogRepository = timeLogRepository;
        this.workOrderRepository = workOrderRepository;
    }

    @Transactional
    public TimeLog createTimeLog(
            TimeLog timeLog,
            String actorRole,
            Long actorId) {

        if (!"TECHNICIAN".equals(actorRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only technicians can log work time"
            );
        }

        if (timeLog.getWorkOrderId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Work order ID is required"
            );
        }

        if (timeLog.getMinutes() == null || timeLog.getMinutes() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Minutes must be greater than zero"
            );
        }

        WorkOrder workOrder = workOrderRepository
                .findById(timeLog.getWorkOrderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Work order not found"
                ));

        if (actorId == null
                || !actorId.equals(workOrder.getAssignedTo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only log time for your assigned work orders"
            );
        }

        if ("CLOSED".equals(workOrder.getStatus())
                || "CANCELLED".equals(workOrder.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Time cannot be logged on a closed or cancelled work order"
            );
        }

        // Never trust the technician ID supplied in the request body.
        // Use the authenticated user's ID from the JWT.
        timeLog.setTechnicianId(actorId);

        return timeLogRepository.save(timeLog);
    }

    @Transactional(readOnly = true)
    public List<TimeLog> getTimeLogsForWorkOrder(
            Long workOrderId,
            String actorRole,
            Long actorId) {

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Work order not found"
                ));

        boolean canViewAll = "DISPATCHER".equals(actorRole)
                || "MANAGER".equals(actorRole);

        boolean isAssignedTechnician = "TECHNICIAN".equals(actorRole)
                && actorId != null
                && actorId.equals(workOrder.getAssignedTo());

        if (!canViewAll && !isAssignedTechnician) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot view time logs for this work order"
            );
        }

        return timeLogRepository.findByWorkOrderId(workOrderId);
    }
}