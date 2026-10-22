package com.keystone.backend.service;

import com.keystone.backend.entity.Part;
import com.keystone.backend.repository.PartRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PartService {

    private final PartRepository partRepository;

    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    @Transactional(readOnly = true)
    public List<Part> getAllParts(String role) {
        requireInventoryAccess(role);
        return partRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Part getPartById(Long id, String role) {
        requireInventoryAccess(role);

        return partRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Part not found"
                ));
    }

    @Transactional
    public Part createPart(Part part, String role) {
        requireRole(role, "MANAGER");

        if (part.getStockQty() == null || part.getStockQty() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stock quantity must be zero or greater"
            );
        }

        if (part.getName() == null || part.getName().isBlank()
                || part.getSku() == null || part.getSku().isBlank()
                || part.getUnitCost() == null
                || part.getUnitCost().signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Part name, SKU, valid unit cost and stock quantity are required"
            );
        }

        return partRepository.save(part);
    }

    private void requireInventoryAccess(String role) {
        requireRole(role, "DISPATCHER", "MANAGER", "TECHNICIAN");
    }

    private void requireRole(String actualRole, String... allowedRoles) {
        for (String allowedRole : allowedRoles) {
            if (allowedRole.equals(actualRole)) {
                return;
            }
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Your role cannot perform this inventory action"
        );
    }
}