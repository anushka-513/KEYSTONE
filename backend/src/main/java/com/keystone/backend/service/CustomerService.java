package com.keystone.backend.service;

import com.keystone.backend.entity.Customer;
import com.keystone.backend.repository.CustomerRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers(String role) {
        requireStaffReadAccess(role);
        return customerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Customer> getCustomerById(Long id, String role) {
        requireStaffReadAccess(role);
        return customerRepository.findById(id);
    }

    @Transactional
    public Customer createCustomer(Customer customer, String role) {
        requireDispatcherOrManager(role);
        return customerRepository.save(customer);
    }

    private void requireStaffReadAccess(String role) {
        if (!"DISPATCHER".equals(role)
                && !"MANAGER".equals(role)
                && !"TECHNICIAN".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your role cannot access customer records"
            );
        }
    }

    private void requireDispatcherOrManager(String role) {
        if (!"DISPATCHER".equals(role) && !"MANAGER".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only dispatchers and managers can create customers"
            );
        }
    }
}