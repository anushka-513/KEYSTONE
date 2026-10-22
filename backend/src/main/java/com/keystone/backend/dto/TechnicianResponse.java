package com.keystone.backend.dto;

import com.keystone.backend.entity.AppUser;

public record TechnicianResponse(
        Long id,
        String name,
        String email
) {
    public static TechnicianResponse from(AppUser user) {
        return new TechnicianResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );
    }
}
