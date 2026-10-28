package com.hospital.consent.dto.document;

import com.hospital.consent.enums.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class DocumentUploadDto {

    private Long patientId; // Required if uploaded by Doctor/Admin, ignored/overridden if uploaded by Patient

    @NotNull(message = "Document type is required")
    private DocumentType documentType;

    @NotBlank(message = "Document title is required")
    @Size(min = 2, max = 200, message = "Document title must be between 2 and 200 characters")
    private String title;

    private String description;

    public DocumentUploadDto() {
    }

    public DocumentUploadDto(Long patientId, DocumentType documentType, String title, String description) {
        this.patientId = patientId;
        this.documentType = documentType;
        this.title = title;
        this.description = description;
    }

    // Getters and Setters
    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
