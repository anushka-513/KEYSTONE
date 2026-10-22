
package com.keystone.backend.dto;

import com.keystone.backend.entity.WorkOrder;
import java.time.OffsetDateTime;

public class CustomerWorkOrderResponse {

    private Long id;
    private Long siteId;
    private String code;
    private String title;
    private String description;
    private String priority;
    private String status;
    private OffsetDateTime slaDueAt;

    public CustomerWorkOrderResponse() {
    }

    public CustomerWorkOrderResponse(WorkOrder order) {
        this.id = order.getId();
        this.siteId = order.getSiteId();
        this.code = order.getCode();
        this.title = order.getTitle();
        this.description = order.getDescription();
        this.priority = order.getPriority();
        this.status = order.getStatus();
        this.slaDueAt = order.getSlaDueAt();
    }

    public Long getId() {
        return id;
    }

    public Long getSiteId() {
        return siteId;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getPriority() {
        return priority;
    }

    public String getStatus() {
        return status;
    }

    public OffsetDateTime getSlaDueAt() {
        return slaDueAt;
    }
}
