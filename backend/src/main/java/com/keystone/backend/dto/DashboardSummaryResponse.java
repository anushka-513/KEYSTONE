package com.keystone.backend.dto;

import java.util.LinkedHashMap;
import java.util.Map;

public class DashboardSummaryResponse {

    private long totalWorkOrders;
    private long newWorkOrders;
    private long assignedWorkOrders;
    private long inProgressWorkOrders;
    private long completedWorkOrders;
    private long closedWorkOrders;
    private long overdueWorkOrders;
    private long slaBreachedWorkOrders;
    private double slaCompliancePercentage;

    private Map<String, Long> technicianBreakdown = new LinkedHashMap<>();
    private Map<String, Long> siteBreakdown = new LinkedHashMap<>();

    public DashboardSummaryResponse() {
    }

    public DashboardSummaryResponse(
            long totalWorkOrders,
            long newWorkOrders,
            long assignedWorkOrders,
            long inProgressWorkOrders,
            long completedWorkOrders,
            long closedWorkOrders) {

        this.totalWorkOrders = totalWorkOrders;
        this.newWorkOrders = newWorkOrders;
        this.assignedWorkOrders = assignedWorkOrders;
        this.inProgressWorkOrders = inProgressWorkOrders;
        this.completedWorkOrders = completedWorkOrders;
        this.closedWorkOrders = closedWorkOrders;
    }

    public long getTotalWorkOrders() {
        return totalWorkOrders;
    }

    public long getNewWorkOrders() {
        return newWorkOrders;
    }

    public long getAssignedWorkOrders() {
        return assignedWorkOrders;
    }

    public long getInProgressWorkOrders() {
        return inProgressWorkOrders;
    }

    public long getCompletedWorkOrders() {
        return completedWorkOrders;
    }

    public long getClosedWorkOrders() {
        return closedWorkOrders;
    }

    public long getOverdueWorkOrders() {
        return overdueWorkOrders;
    }

    public void setOverdueWorkOrders(long overdueWorkOrders) {
        this.overdueWorkOrders = overdueWorkOrders;
    }

    public long getSlaBreachedWorkOrders() {
        return slaBreachedWorkOrders;
    }

    public void setSlaBreachedWorkOrders(long slaBreachedWorkOrders) {
        this.slaBreachedWorkOrders = slaBreachedWorkOrders;
    }

    public double getSlaCompliancePercentage() {
        return slaCompliancePercentage;
    }

    public void setSlaCompliancePercentage(double slaCompliancePercentage) {
        this.slaCompliancePercentage = slaCompliancePercentage;
    }

    public Map<String, Long> getTechnicianBreakdown() {
        return technicianBreakdown;
    }

    public void setTechnicianBreakdown(
            Map<String, Long> technicianBreakdown) {
        this.technicianBreakdown = technicianBreakdown;
    }

    public Map<String, Long> getSiteBreakdown() {
        return siteBreakdown;
    }

    public void setSiteBreakdown(Map<String, Long> siteBreakdown) {
        this.siteBreakdown = siteBreakdown;
    }
}