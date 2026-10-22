package com.keystone.backend.service;

import com.keystone.backend.dto.CustomerRequestCreateRequest;
import com.keystone.backend.dto.CustomerStatusHistoryResponse;
import com.keystone.backend.dto.CustomerWorkOrderResponse;
import com.keystone.backend.entity.AppUser;
import com.keystone.backend.entity.Site;
import com.keystone.backend.entity.WorkOrder;
import com.keystone.backend.entity.WorkOrderStatusHistory;
import com.keystone.backend.repository.AppUserRepository;
import com.keystone.backend.repository.SiteRepository;
import com.keystone.backend.repository.WorkOrderRepository;
import com.keystone.backend.repository.WorkOrderStatusHistoryRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerPortalService {

    private final AppUserRepository appUserRepository;
    private final SiteRepository siteRepository;
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;

    public CustomerPortalService(
            AppUserRepository appUserRepository,
            SiteRepository siteRepository,
            WorkOrderRepository workOrderRepository,
            WorkOrderStatusHistoryRepository historyRepository) {

        this.appUserRepository = appUserRepository;
        this.siteRepository = siteRepository;
        this.workOrderRepository = workOrderRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional(readOnly = true)
    public List<Site> getMySites(String role, Long userId) {
        AppUser customer = getCustomerAccount(role, userId);
        return siteRepository.findByCustomerId(customer.getCustomerId());
    }

    @Transactional(readOnly = true)
    public List<CustomerWorkOrderResponse> getMyWorkOrders(
            String role, Long userId) {

        AppUser customer = getCustomerAccount(role, userId);
        Long customerId = customer.getCustomerId();

        return workOrderRepository.findAll()
                .stream()
                .filter(order -> customerId.equals(order.getCustomerId()))
                .map(CustomerWorkOrderResponse::new)
                .toList();
    }

    @Transactional
    public CustomerWorkOrderResponse createRequest(
            CustomerRequestCreateRequest request,
            String role,
            Long userId) {

        AppUser customer = getCustomerAccount(role, userId);

        if (request.getSiteId() == null
                || request.getTitle() == null
                || request.getTitle().isBlank()
                || request.getDescription() == null
                || request.getDescription().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Site, title, and description are required"
            );
        }

        if (request.getTitle().length() > 200) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Title cannot exceed 200 characters"
            );
        }

        if (request.getDescription().length() > 5000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Description cannot exceed 5000 characters"
            );
        }

        Long customerId = customer.getCustomerId();

        boolean ownsSite = siteRepository
                .findByCustomerId(customerId)
                .stream()
                .map(Site::getId)
                .anyMatch(request.getSiteId()::equals);

        if (!ownsSite) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Site not found for this customer"
            );
        }

        OffsetDateTime now = OffsetDateTime.now();

        WorkOrder order = new WorkOrder();
        order.setCustomerId(customerId);
        order.setSiteId(request.getSiteId());
        order.setAssignedTo(null);
        order.setCode("WO-" + UUID.randomUUID()
                .toString().substring(0, 8).toUpperCase());
        order.setTitle(request.getTitle().trim());
        order.setDescription(request.getDescription().trim());

        // Customer requests enter the pipeline for staff triage.
        // MEDIUM priority currently receives a 24-hour initial SLA.
        order.setPriority("MEDIUM");
        order.setStatus("NEW");
        order.setSlaDueAt(now.plusHours(24));

        WorkOrder saved = workOrderRepository.save(order);

        return new CustomerWorkOrderResponse(saved);
    }

    @Transactional(readOnly = true)
    public CustomerWorkOrderResponse getMyWorkOrder(
            Long workOrderId,
            String role,
            Long userId) {

        AppUser customer = getCustomerAccount(role, userId);

        WorkOrder order = workOrderRepository.findById(workOrderId)
                .filter(item ->
                        customer.getCustomerId().equals(item.getCustomerId()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Work order not found"
                ));

        return new CustomerWorkOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<CustomerStatusHistoryResponse> getMyWorkOrderHistory(
            Long workOrderId,
            String role,
            Long userId) {

        AppUser customer = getCustomerAccount(role, userId);

        workOrderRepository.findById(workOrderId)
                .filter(order ->
                        customer.getCustomerId().equals(order.getCustomerId()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Work order not found"
                ));

        return historyRepository.findAll()
                .stream()
                .filter(history ->
                        workOrderId.equals(history.getWorkOrderId()))
                .sorted(Comparator.comparing(
                        WorkOrderStatusHistory::getChangedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .map(CustomerStatusHistoryResponse::new)
                .toList();
    }

    private AppUser getCustomerAccount(String role, Long userId) {
        if (!"CUSTOMER".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This endpoint is only for customer accounts"
            );
        }

        AppUser customer = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"
                ));

        if (customer.getCustomerId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This customer login is not linked to a customer record"
            );
        }

        return customer;
    }
}