package com.keystone.backend.repository;

import com.keystone.backend.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    long countByStatus(String status);
}