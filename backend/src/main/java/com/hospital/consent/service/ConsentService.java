package com.hospital.consent.service;

import com.hospital.consent.dto.consent.*;
import com.hospital.consent.dto.user.DoctorSummaryDto;
import com.hospital.consent.dto.user.PatientSummaryDto;
import com.hospital.consent.entity.*;
import com.hospital.consent.enums.ConsentAuditAction;
import com.hospital.consent.enums.ConsentStatus;
import com.hospital.consent.enums.Role;
import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.exception.ResourceNotFoundException;
import com.hospital.consent.repository.*;
import com.hospital.consent.security.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final ConsentAuditLogRepository auditLogRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ConsentService(
            ConsentRepository consentRepository,
            ConsentAuditLogRepository auditLogRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            UserRepository userRepository) {
        this.consentRepository = consentRepository;
        this.auditLogRepository = auditLogRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ConsentResponseDto createConsent(CreateConsentRequest request, UserPrincipal currentUser, String clientIp) {
        Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for authenticated user: " + currentUser.getEmail()));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getPatientId()));

        User actor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String consentNumber = generateConsentNumber();

        Consent consent = new Consent();
        consent.setConsentNumber(consentNumber);
        consent.setPatient(patient);
        consent.setDoctor(doctor);
        consent.setProcedureName(request.getProcedureName().trim());
        consent.setProcedureDescription(request.getProcedureDescription());
        consent.setConsentText(request.getConsentText().trim());
        consent.setRisksAndAlternatives(request.getRisksAndAlternatives());
        consent.setConsentVersion(1);
        consent.setStatus(ConsentStatus.PENDING_REVIEW);
        consent.setValidUntil(request.getValidUntil());
        consent.setDoctorNotes(request.getDoctorNotes());

        consent = consentRepository.save(consent);

        // Record initial immutable audit event
        auditLogRepository.save(new ConsentAuditLog(
                consent,
                actor,
                ConsentAuditAction.CREATED,
                "Consent request created for procedure: " + consent.getProcedureName() + " (Version " + consent.getConsentVersion() + ")",
                clientIp
        ));

        return mapToDto(consent, true);
    }

    @Transactional
    public ConsentResponseDto getConsentById(Long id, UserPrincipal currentUser, String clientIp) {
        Consent consent = consentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent not found with ID: " + id));

        validateAccess(consent, currentUser);

        // If viewed by patient, log the audit event for compliance
        if (currentUser.getRole() == Role.PATIENT) {
            User actor = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            auditLogRepository.save(new ConsentAuditLog(
                    consent,
                    actor,
                    ConsentAuditAction.VIEWED,
                    "Patient reviewed consent agreement and procedure disclosures",
                    clientIp
            ));
        }

        return mapToDto(consent, true);
    }

    @Transactional
    public ConsentResponseDto signConsent(Long id, SignConsentRequest request, UserPrincipal currentUser, String clientIp) {
        Consent consent = consentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent not found with ID: " + id));

        // State Machine validation: Only PENDING_REVIEW can transition to APPROVED
        if (consent.getStatus() != ConsentStatus.PENDING_REVIEW) {
            throw new BadRequestException("State conflict: Consent cannot be approved in its current state of " + consent.getStatus());
        }

        // Ownership validation: Only the assigned patient can sign
        if (!consent.getPatient().getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Security violation: Only the designated patient can legally execute this consent signature");
        }

        consent.setStatus(ConsentStatus.APPROVED);
        consent.setSignatureData(request.getSignatureData());
        consent.setSignatureTimestamp(LocalDateTime.now());
        if (request.getPatientComments() != null && !request.getPatientComments().isBlank()) {
            consent.setPatientComments(request.getPatientComments().trim());
        }

        consent = consentRepository.save(consent);

        User actor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        auditLogRepository.save(new ConsentAuditLog(
                consent,
                actor,
                ConsentAuditAction.APPROVED,
                "Patient executed digital signature and approved procedure consent",
                clientIp
        ));

        return mapToDto(consent, true);
    }

    @Transactional
    public ConsentResponseDto rejectConsent(Long id, RejectConsentRequest request, UserPrincipal currentUser, String clientIp) {
        Consent consent = consentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent not found with ID: " + id));

        // State Machine validation
        if (consent.getStatus() != ConsentStatus.PENDING_REVIEW) {
            throw new BadRequestException("State conflict: Consent cannot be rejected in its current state of " + consent.getStatus());
        }

        if (!consent.getPatient().getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Security violation: Only the designated patient can reject this consent request");
        }

        consent.setStatus(ConsentStatus.REJECTED);
        consent.setPatientComments("REJECTION REASON: " + request.getReason().trim());

        consent = consentRepository.save(consent);

        User actor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        auditLogRepository.save(new ConsentAuditLog(
                consent,
                actor,
                ConsentAuditAction.REJECTED,
                "Patient deliberately declined procedure consent. Reason: " + request.getReason(),
                clientIp
        ));

        return mapToDto(consent, true);
    }

    @Transactional
    public ConsentResponseDto revokeConsent(Long id, RevokeConsentRequest request, UserPrincipal currentUser, String clientIp) {
        Consent consent = consentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent not found with ID: " + id));

        // State Machine validation: Only APPROVED consents can be REVOKED
        if (consent.getStatus() != ConsentStatus.APPROVED) {
            throw new BadRequestException("State conflict: Only previously APPROVED consents can be formally revoked");
        }

        // Permitted actors: Patient or attending Doctor
        boolean isPatient = consent.getPatient().getUser().getId().equals(currentUser.getId());
        boolean isDoctor = consent.getDoctor().getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new AccessDeniedException("Security violation: You are not authorized to revoke this consent agreement");
        }

        consent.setStatus(ConsentStatus.REVOKED);
        consent.setRevocationReason(request.getReason().trim());
        consent.setRevocationTimestamp(LocalDateTime.now());

        consent = consentRepository.save(consent);

        User actor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        auditLogRepository.save(new ConsentAuditLog(
                consent,
                actor,
                ConsentAuditAction.REVOKED,
                "Consent revoked by " + actor.getFullName() + " (" + actor.getRole() + "). Reason: " + request.getReason(),
                clientIp
        ));

        return mapToDto(consent, true);
    }

    @Transactional
    public ConsentResponseDto askQuestion(Long id, ConsentQuestionRequest request, UserPrincipal currentUser, String clientIp) {
        Consent consent = consentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent not found with ID: " + id));

        validateAccess(consent, currentUser);

        User actor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        auditLogRepository.save(new ConsentAuditLog(
                consent,
                actor,
                ConsentAuditAction.QUESTIONS_ASKED,
                "Patient inquiry: " + request.getQuestion(),
                clientIp
        ));

        return mapToDto(consent, true);
    }

    @Transactional(readOnly = true)
    public List<ConsentResponseDto> getMyConsents(UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.PATIENT) {
            throw new BadRequestException("Only patients can access the personal consent list endpoint");
        }
        return consentRepository.findByPatientUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().map(c -> mapToDto(c, false)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConsentResponseDto> getDoctorConsents(UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.DOCTOR) {
            throw new BadRequestException("Only doctors can access the doctor consent list endpoint");
        }
        return consentRepository.findByDoctorUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().map(c -> mapToDto(c, false)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConsentResponseDto> getAllConsents(ConsentStatus statusFilter) {
        List<Consent> list = consentRepository.findAll();
        if (statusFilter != null) {
            list = list.stream().filter(c -> c.getStatus() == statusFilter).collect(Collectors.toList());
        }
        return list.stream().map(c -> mapToDto(c, false)).collect(Collectors.toList());
    }

    private void validateAccess(Consent consent, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.PATIENT) {
            if (!consent.getPatient().getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Access denied: You cannot view consent agreements for another patient");
            }
        } else if (currentUser.getRole() == Role.DOCTOR) {
            // Doctors can access if they created it or if they are reviewing hospital consents
            // Here any authorized doctor can review or the specific doctor
        }
    }

    private String generateConsentNumber() {
        String num;
        do {
            int randomVal = 10000 + secureRandom.nextInt(90000);
            num = "CNS-2026-" + randomVal;
        } while (consentRepository.existsByConsentNumber(num));
        return num;
    }

    private ConsentResponseDto mapToDto(Consent c, boolean includeAudit) {
        ConsentResponseDto dto = new ConsentResponseDto();
        dto.setId(c.getId());
        dto.setConsentNumber(c.getConsentNumber());
        dto.setPatientId(c.getPatient().getId());
        dto.setPatient(new PatientSummaryDto(
                c.getPatient().getId(),
                c.getPatient().getUser().getId(),
                c.getPatient().getUser().getFullName(),
                c.getPatient().getUser().getEmail(),
                c.getPatient().getDateOfBirth(),
                c.getPatient().getGender(),
                c.getPatient().getBloodGroup(),
                c.getPatient().getPhoneNumber(),
                c.getPatient().getAddress(),
                c.getPatient().getEmergencyContactName(),
                c.getPatient().getEmergencyContactPhone()
        ));
        dto.setDoctorId(c.getDoctor().getId());
        dto.setDoctor(new DoctorSummaryDto(
                c.getDoctor().getId(),
                c.getDoctor().getUser().getId(),
                c.getDoctor().getUser().getFullName(),
                c.getDoctor().getUser().getEmail(),
                c.getDoctor().getDepartment() != null ? c.getDoctor().getDepartment().getId() : null,
                c.getDoctor().getDepartment() != null ? c.getDoctor().getDepartment().getName() : "General",
                c.getDoctor().getLicenseNumber(),
                c.getDoctor().getSpecialization(),
                c.getDoctor().getPhoneNumber(),
                c.getDoctor().getOfficeLocation(),
                c.getDoctor().getBio()
        ));
        dto.setProcedureName(c.getProcedureName());
        dto.setProcedureDescription(c.getProcedureDescription());
        dto.setConsentText(c.getConsentText());
        dto.setRisksAndAlternatives(c.getRisksAndAlternatives());
        dto.setConsentVersion(c.getConsentVersion());
        dto.setStatus(c.getStatus());
        dto.setSignatureData(c.getSignatureData());
        dto.setSignatureTimestamp(c.getSignatureTimestamp());
        dto.setPatientComments(c.getPatientComments());
        dto.setDoctorNotes(c.getDoctorNotes());
        dto.setRevocationReason(c.getRevocationReason());
        dto.setRevocationTimestamp(c.getRevocationTimestamp());
        dto.setValidUntil(c.getValidUntil());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());

        if (includeAudit) {
            List<ConsentAuditLogDto> auditDtos = auditLogRepository.findByConsentIdOrderByTimestampDesc(c.getId())
                    .stream().map(log -> new ConsentAuditLogDto(
                            log.getId(),
                            log.getPerformedBy().getId(),
                            log.getPerformedBy().getFullName(),
                            log.getPerformedBy().getRole().name(),
                            log.getAction(),
                            log.getDetails(),
                            log.getIpAddress(),
                            log.getTimestamp()
                    )).collect(Collectors.toList());
            dto.setAuditTrail(auditDtos);
        }

        return dto;
    }
}
