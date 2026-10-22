package com.keystone.backend.dto;

public class LoginResponse {

    private String token;
    private String name;
    private String role;

    public LoginResponse() {
    }

    public LoginResponse(String token, String name, String role) {
        this.token = token;
        this.name = name;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }
}