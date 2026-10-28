package com.hospital.consent.dto.consent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RejectConsentRequest {

    @NotBlank(message = "Rejection reason is required")
    @Size(min = 5, max = 1000, message = "Rejection reason must be between 5 and 1000 characters")
    private String reason;

    public RejectConsentRequest() {
    }

    public RejectConsentRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
