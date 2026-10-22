package com.keystone.backend.dto;

import com.keystone.backend.entity.WorkOrderStatusHistory;
import java.time.OffsetDateTime;

public class CustomerStatusHistoryResponse {

    private String fromStatus;
    private String toStatus;
    private OffsetDateTime changedAt;

    public CustomerStatusHistoryResponse() {
    }

    public CustomerStatusHistoryResponse(WorkOrderStatusHistory history) {
        this.fromStatus = history.getFromStatus();
        this.toStatus = history.getToStatus();
        this.changedAt = history.getChangedAt();
    }

    public String getFromStatus() {
        return fromStatus;
    }

    public String getToStatus() {
        return toStatus;
    }

    public OffsetDateTime getChangedAt() {
        return changedAt;
    }
}