package com.hospital.consent.dto.consent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SignConsentRequest {

    @NotBlank(message = "Digital signature data is required")
    @Pattern(
            regexp = "^data:image\\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$",
            message = "Signature data must be a valid base64 data URL (e.g. data:image/png;base64,...)"
    )
    private String signatureData;

    private String patientComments;

    public SignConsentRequest() {
    }

    public SignConsentRequest(String signatureData, String patientComments) {
        this.signatureData = signatureData;
        this.patientComments = patientComments;
    }

    public String getSignatureData() {
        return signatureData;
    }

    public void setSignatureData(String signatureData) {
        this.signatureData = signatureData;
    }

    public String getPatientComments() {
        return patientComments;
    }

    public void setPatientComments(String patientComments) {
        this.patientComments = patientComments;
    }
}
