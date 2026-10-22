package com.keystone.backend.repository;

import com.keystone.backend.entity.PartUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartUsageRepository extends JpaRepository<PartUsage, Long> {

    List<PartUsage> findByWorkOrderId(Long workOrderId);
}