package com.keystone.backend.dto;

public class WorkOrderAssignmentRequest {

    private Long assignedTo;

    public WorkOrderAssignmentRequest() {
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }
}