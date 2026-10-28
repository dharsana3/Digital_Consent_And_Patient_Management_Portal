package com.hospital.consent.dto.consent;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class CreateConsentRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotBlank(message = "Procedure name is required")
    @Size(min = 3, max = 255, message = "Procedure name must be between 3 and 255 characters")
    private String procedureName;

    private String procedureDescription;

    @NotBlank(message = "Consent text is required")
    @Size(min = 20, message = "Consent text must be comprehensive (at least 20 characters)")
    private String consentText;

    private String risksAndAlternatives;

    @FutureOrPresent(message = "Valid until date must be in the present or future")
    private LocalDate validUntil;

    private String doctorNotes;

    public CreateConsentRequest() {
    }

    public CreateConsentRequest(Long patientId, String procedureName, String procedureDescription,
                                String consentText, String risksAndAlternatives, LocalDate validUntil,
                                String doctorNotes) {
        this.patientId = patientId;
        this.procedureName = procedureName;
        this.procedureDescription = procedureDescription;
        this.consentText = consentText;
        this.risksAndAlternatives = risksAndAlternatives;
        this.validUntil = validUntil;
        this.doctorNotes = doctorNotes;
    }

    // Getters and Setters
    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getProcedureName() {
        return procedureName;
    }

    public void setProcedureName(String procedureName) {
        this.procedureName = procedureName;
    }

    public String getProcedureDescription() {
        return procedureDescription;
    }

    public void setProcedureDescription(String procedureDescription) {
        this.procedureDescription = procedureDescription;
    }

    public String getConsentText() {
        return consentText;
    }

    public void setConsentText(String consentText) {
        this.consentText = consentText;
    }

    public String getRisksAndAlternatives() {
        return risksAndAlternatives;
    }

    public void setRisksAndAlternatives(String risksAndAlternatives) {
        this.risksAndAlternatives = risksAndAlternatives;
    }

    public LocalDate getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(LocalDate validUntil) {
        this.validUntil = validUntil;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }
}
