package com.keystone.backend.service;

import com.keystone.backend.entity.Site;
import com.keystone.backend.repository.SiteRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class SiteService {

    private final SiteRepository siteRepository;

    public SiteService(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public List<Site> getAllSites(String role) {
        requireStaffReadAccess(role);
        return siteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Site> getSiteById(Long id, String role) {
        requireStaffReadAccess(role);
        return siteRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesByCustomer(Long customerId, String role) {
        requireStaffReadAccess(role);
        return siteRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Site createSite(Site site, String role) {
        requireDispatcherOrManager(role);
        return siteRepository.save(site);
    }

    private void requireStaffReadAccess(String role) {
        if (!"DISPATCHER".equals(role)
                && !"MANAGER".equals(role)
                && !"TECHNICIAN".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your role cannot access site records"
            );
        }
    }

    private void requireDispatcherOrManager(String role) {
        if (!"DISPATCHER".equals(role) && !"MANAGER".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only dispatchers and managers can create sites"
            );
        }
    }
}