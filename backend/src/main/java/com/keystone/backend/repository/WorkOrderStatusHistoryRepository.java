package com.keystone.backend.repository;

import com.keystone.backend.entity.WorkOrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkOrderStatusHistoryRepository
        extends JpaRepository<WorkOrderStatusHistory, Long> {

    List<WorkOrderStatusHistory> findByWorkOrderIdOrderByChangedAtAsc(Long workOrderId);
}