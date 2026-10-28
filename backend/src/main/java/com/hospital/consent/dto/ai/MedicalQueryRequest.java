package com.hospital.consent.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MedicalQueryRequest {

    private Long consentId; // Optional consent form context

    @NotBlank(message = "Question or medical term inquiry is required")
    @Size(min = 2, max = 1500, message = "Inquiry must be between 2 and 1500 characters")
    private String question;

    public MedicalQueryRequest() {
    }

    public MedicalQueryRequest(Long consentId, String question) {
        this.consentId = consentId;
        this.question = question;
    }

    // Getters and Setters
    public Long getConsentId() {
        return consentId;
    }

    public void setConsentId(Long consentId) {
        this.consentId = consentId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
