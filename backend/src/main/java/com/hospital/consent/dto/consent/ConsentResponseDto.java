package com.hospital.consent.dto.consent;

import com.hospital.consent.dto.user.DoctorSummaryDto;
import com.hospital.consent.dto.user.PatientSummaryDto;
import com.hospital.consent.enums.ConsentStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ConsentResponseDto {
    private Long id;
    private String consentNumber;
    private Long patientId;
    private PatientSummaryDto patient;
    private Long doctorId;
    private DoctorSummaryDto doctor;
    private String procedureName;
    private String procedureDescription;
    private String consentText;
    private String risksAndAlternatives;
    private int consentVersion;
    private ConsentStatus status;
    private String signatureData;
    private LocalDateTime signatureTimestamp;
    private String patientComments;
    private String doctorNotes;
    private String revocationReason;
    private LocalDateTime revocationTimestamp;
    private LocalDate validUntil;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ConsentAuditLogDto> auditTrail = new ArrayList<>();

    public ConsentResponseDto() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConsentNumber() {
        return consentNumber;
    }

    public void setConsentNumber(String consentNumber) {
        this.consentNumber = consentNumber;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public PatientSummaryDto getPatient() {
        return patient;
    }

    public void setPatient(PatientSummaryDto patient) {
        this.patient = patient;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public DoctorSummaryDto getDoctor() {
        return doctor;
    }

    public void setDoctor(DoctorSummaryDto doctor) {
        this.doctor = doctor;
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

    public int getConsentVersion() {
        return consentVersion;
    }

    public void setConsentVersion(int consentVersion) {
        this.consentVersion = consentVersion;
    }

    public ConsentStatus getStatus() {
        return status;
    }

    public void setStatus(ConsentStatus status) {
        this.status = status;
    }

    public String getSignatureData() {
        return signatureData;
    }

    public void setSignatureData(String signatureData) {
        this.signatureData = signatureData;
    }

    public LocalDateTime getSignatureTimestamp() {
        return signatureTimestamp;
    }

    public void setSignatureTimestamp(LocalDateTime signatureTimestamp) {
        this.signatureTimestamp = signatureTimestamp;
    }

    public String getPatientComments() {
        return patientComments;
    }

    public void setPatientComments(String patientComments) {
        this.patientComments = patientComments;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public String getRevocationReason() {
        return revocationReason;
    }

    public void setRevocationReason(String revocationReason) {
        this.revocationReason = revocationReason;
    }

    public LocalDateTime getRevocationTimestamp() {
        return revocationTimestamp;
    }

    public void setRevocationTimestamp(LocalDateTime revocationTimestamp) {
        this.revocationTimestamp = revocationTimestamp;
    }

    public LocalDate getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(LocalDate validUntil) {
        this.validUntil = validUntil;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<ConsentAuditLogDto> getAuditTrail() {
        return auditTrail;
    }

    public void setAuditTrail(List<ConsentAuditLogDto> auditTrail) {
        this.auditTrail = auditTrail;
    }
}
