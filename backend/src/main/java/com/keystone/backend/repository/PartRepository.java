package com.keystone.backend.repository;

import com.keystone.backend.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PartRepository extends JpaRepository<Part, Long> {

    Optional<Part> findBySku(String sku);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Part p
        SET p.stockQty = p.stockQty - :quantity
        WHERE p.id = :partId
          AND p.stockQty >= :quantity
        """)
    int deductStockIfAvailable(
            @Param("partId") Long partId,
            @Param("quantity") Integer quantity
    );
}