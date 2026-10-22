package com.keystone.backend.service;

import com.keystone.backend.dto.DashboardSummaryResponse;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.entity.WorkOrderStatusHistory;
import com.keystone.backend.repository.WorkOrderRepository;
import com.keystone.backend.repository.WorkOrderStatusHistoryRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;

    public DashboardService(
            WorkOrderRepository workOrderRepository,
            WorkOrderStatusHistoryRepository historyRepository) {

        this.workOrderRepository = workOrderRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(String role, Long userId) {

        List<WorkOrder> allOrders = workOrderRepository.findAll();
        List<WorkOrder> visibleOrders;

        if ("MANAGER".equals(role) || "DISPATCHER".equals(role)) {
            visibleOrders = allOrders;
        } else if ("TECHNICIAN".equals(role)) {
            visibleOrders = allOrders.stream()
                    .filter(order -> userId != null
                            && userId.equals(order.getAssignedTo()))
                    .toList();
        } else {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your role cannot access dashboard reports"
            );
        }

        OffsetDateTime now = OffsetDateTime.now();

        long total = visibleOrders.size();
        long newCount = countByStatus(visibleOrders, "NEW");
        long assignedCount = countByStatus(visibleOrders, "ASSIGNED");
        long inProgressCount = countByStatus(visibleOrders, "IN_PROGRESS");
        long completedCount = countByStatus(visibleOrders, "COMPLETED");
        long closedCount = countByStatus(visibleOrders, "CLOSED");

        Map<Long, OffsetDateTime> completedAt = new LinkedHashMap<>();

        for (WorkOrderStatusHistory history : historyRepository.findAll()) {
            if ("COMPLETED".equals(history.getToStatus())
                    && history.getWorkOrderId() != null
                    && history.getChangedAt() != null) {

                completedAt.putIfAbsent(
                        history.getWorkOrderId(),
                        history.getChangedAt()
                );
            }
        }

        long overdueCount = 0;
        long breachedCount = 0;
        long eligibleForSla = 0;
        long completedWithinSla = 0;

        Map<String, Long> technicianBreakdown = new LinkedHashMap<>();
        Map<String, Long> siteBreakdown = new LinkedHashMap<>();

        for (WorkOrder order : visibleOrders) {

            String status = order.getStatus();
            OffsetDateTime due = order.getSlaDueAt();
            OffsetDateTime completion = completedAt.get(order.getId());

            if (due != null) {
                boolean isTerminal = "COMPLETED".equals(status)
                        || "CLOSED".equals(status)
                        || "CANCELLED".equals(status);

                if (!isTerminal && due.isBefore(now)) {
                    overdueCount++;
                    breachedCount++;
                } else if (completion != null && completion.isAfter(due)) {
                    breachedCount++;
                }

                if (completion != null
                        && ("COMPLETED".equals(status)
                        || "CLOSED".equals(status))) {

                    eligibleForSla++;

                    if (!completion.isAfter(due)) {
                        completedWithinSla++;
                    }
                }
            }

            Long technicianId = order.getAssignedTo();
            String technicianKey = technicianId == null
                    ? "Unassigned"
                    : "Technician #" + technicianId;

            technicianBreakdown.merge(technicianKey, 1L, Long::sum);

            Long siteId = order.getSiteId();
            String siteKey = siteId == null
                    ? "Unknown site"
                    : "Site #" + siteId;

            siteBreakdown.merge(siteKey, 1L, Long::sum);
        }

        double compliance = eligibleForSla == 0
                ? 0.0
                : Math.round(
                (completedWithinSla * 1000.0) / eligibleForSla
        ) / 10.0;

        DashboardSummaryResponse response =
                new DashboardSummaryResponse(
                        total,
                        newCount,
                        assignedCount,
                        inProgressCount,
                        completedCount,
                        closedCount
                );

        response.setOverdueWorkOrders(overdueCount);
        response.setSlaBreachedWorkOrders(breachedCount);
        response.setSlaCompliancePercentage(compliance);
        response.setTechnicianBreakdown(technicianBreakdown);
        response.setSiteBreakdown(siteBreakdown);

        return response;
    }

    private long countByStatus(List<WorkOrder> orders, String status) {
        return orders.stream()
                .filter(order -> status.equals(order.getStatus()))
                .count();
    }
}