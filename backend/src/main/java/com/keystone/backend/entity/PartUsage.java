package com.keystone.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "part_usage")
public class PartUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "work_order_id", nullable = false)
    private Long workOrderId;

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "qty_used", nullable = false)
    private Integer qtyUsed;

    public PartUsage() {
    }

    public Long getId() {
        return id;
    }

    public Long getWorkOrderId() {
        return workOrderId;
    }

    public void setWorkOrderId(Long workOrderId) {
        this.workOrderId = workOrderId;
    }

    public Long getPartId() {
        return partId;
    }

    public void setPartId(Long partId) {
        this.partId = partId;
    }

    public Integer getQtyUsed() {
        return qtyUsed;
    }

    public void setQtyUsed(Integer qtyUsed) {
        this.qtyUsed = qtyUsed;
    }
}