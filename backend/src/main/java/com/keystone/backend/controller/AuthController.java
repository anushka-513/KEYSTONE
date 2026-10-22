package com.keystone.backend.controller;

import com.keystone.backend.dto.LoginRequest;
import com.keystone.backend.dto.LoginResponse;
import com.keystone.backend.entity.AppUser;
import com.keystone.backend.repository.AppUserRepository;
import com.keystone.backend.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AppUserRepository appUserRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder) {

        this.appUserRepository = appUserRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request) {

        AppUser user = appUserRepository
                .findByEmail(request.getEmail())
                .orElse(null);

        if (user == null ||
                !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPasswordHash())) {

            return ResponseEntity.status(401).build();
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        LoginResponse response = new LoginResponse(
                token,
                user.getName(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }
}