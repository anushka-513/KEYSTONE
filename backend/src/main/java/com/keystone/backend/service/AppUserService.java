
package com.keystone.backend.service;

import com.keystone.backend.dto.TechnicianResponse;
import com.keystone.backend.entity.AppUser;
import com.keystone.backend.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AppUserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AppUserService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AppUser> getAllUsers() {
        return appUserRepository.findAll();
    }

    public Optional<AppUser> getUserById(Long id) {
        return appUserRepository.findById(id);
    }

    public Optional<AppUser> getUserByEmail(String email) {
        return appUserRepository.findByEmail(email);
    }

    public AppUser createUser(AppUser user) {
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }

        if (user.getRole() == null || user.getRole().isBlank()) {
            throw new IllegalArgumentException("Role is required.");
        }

        if (appUserRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists.");
        }

        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPasswordHash(encodedPassword);

        // Do not retain the raw password in the entity after hashing.
        user.setPassword(null);

        user.setRole(user.getRole().trim().toUpperCase(Locale.ROOT));

        return appUserRepository.save(user);
    }

    public void deleteUser(Long id) {
        appUserRepository.deleteById(id);
    }

    public List<TechnicianResponse> getTechnicians() {
        return appUserRepository.findByRoleIgnoreCase("TECHNICIAN")
                .stream()
                .map(TechnicianResponse::from)
                .collect(Collectors.toList());
    }
}
