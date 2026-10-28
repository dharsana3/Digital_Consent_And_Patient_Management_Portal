package com.hospital.consent.dto.user;

import com.hospital.consent.enums.Role;
import com.hospital.consent.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateUserStatusRequest {
    @NotNull(message = "Status is required (ACTIVE or SUSPENDED)")
    private UserStatus status;

    public UpdateUserStatusRequest() {
    }

    public UpdateUserStatusRequest(UserStatus status) {
        this.status = status;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }
}
