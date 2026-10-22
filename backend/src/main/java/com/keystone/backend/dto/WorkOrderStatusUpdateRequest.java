package com.keystone.backend.dto;

public class WorkOrderStatusUpdateRequest {

    private String status;

    public WorkOrderStatusUpdateRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}