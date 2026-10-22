package com.keystone.backend.controller;

import com.keystone.backend.dto.LoginRequest;
import com.keystone.backend.dto.LoginResponse;
import com.keystone.backend.entity.AppUser;
import com.keystone.backend.repository.AppUserRepository;
import com.keystone.backend.service.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://keystone-frontend-f1nw.onrender.com"
})
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

        String email = request.getEmail();

        AppUser user = appUserRepository
                .findByEmail(email)
                .orElse(null);

        // Temporary debugging: never print the password or hash.
        System.out.println("LOGIN EMAIL: [" + email + "]");
        System.out.println("USER FOUND: " + (user != null));

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        String storedHash = user.getPasswordHash();

        boolean passwordMatches =
                storedHash != null
                        && !storedHash.isBlank()
                        && request.getPassword() != null
                        && passwordEncoder.matches(
                        request.getPassword(),
                        storedHash
                );

        System.out.println("ROLE: " + user.getRole());
        System.out.println("HASH EXISTS: "
                + (storedHash != null && !storedHash.isBlank()));
        System.out.println("PASSWORD MATCHES: " + passwordMatches);

        if (!passwordMatches) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
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