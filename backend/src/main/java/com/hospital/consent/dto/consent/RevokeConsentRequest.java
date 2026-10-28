package com.hospital.consent.dto.consent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RevokeConsentRequest {

    @NotBlank(message = "Revocation reason is required")
    @Size(min = 5, max = 1000, message = "Revocation reason must be between 5 and 1000 characters")
    private String reason;

    public RevokeConsentRequest() {
    }

    public RevokeConsentRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
