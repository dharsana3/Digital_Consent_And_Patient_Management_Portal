package com.hospital.consent.service;

import com.hospital.consent.dto.consent.*;
import com.hospital.consent.entity.*;
import com.hospital.consent.enums.ConsentStatus;
import com.hospital.consent.enums.Role;
import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.repository.*;
import com.hospital.consent.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ConsentWorkflowIntegrationTest {

    @Autowired
    private ConsentService consentService;

    @Autowired
    private ConsentRepository consentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    private Doctor savedDoctor;
    private Patient savedPatient;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal patientPrincipal;

    @BeforeEach
    void setupTestData() {
        // Setup doctor
        User docUser = new User("Dr. Gregory House", "house@hospital.com", "passhash", Role.DOCTOR);
        docUser = userRepository.save(docUser);
        Doctor doctor = new Doctor(docUser, null, "LIC-9901", "Diagnostics & Surgery", "Clinic 1");
        savedDoctor = doctorRepository.save(doctor);
        doctorPrincipal = UserPrincipal.create(docUser);

        // Setup patient
        User patUser = new User("Jane Doe", "jane@example.com", "passhash", Role.PATIENT);
        patUser = userRepository.save(patUser);
        Patient patient = new Patient(patUser, LocalDate.of(1990, 5, 20), null, null, "+1-555-0199", "123 Main St");
        savedPatient = patientRepository.save(patient);
        patientPrincipal = UserPrincipal.create(patUser);
    }

    @Test
    @DisplayName("Complete Consent Workflow: Doctor creates consent, Patient approves with signature, Patient revokes")
    void testFullConsentLifecycle() {
        // 1. Doctor creates consent
        CreateConsentRequest createReq = new CreateConsentRequest(
                savedPatient.getId(),
                "Laparoscopic Appendectomy",
                "Removal of inflamed appendix via small incisions",
                "I agree to undergo laparoscopic appendectomy after discussion of risks and alternatives.",
                "Infection, bleeding, anesthesia risks.",
                LocalDate.now().plusDays(30),
                "Pre-op tests cleared."
        );

        ConsentResponseDto created = consentService.createConsent(createReq, doctorPrincipal, "127.0.0.1");

        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals(ConsentStatus.PENDING_REVIEW, created.getStatus());
        assertEquals(1, created.getConsentVersion());
        assertNotNull(created.getConsentNumber());
        assertFalse(created.getAuditTrail().isEmpty());

        // 2. Patient signs consent with valid signature data URL
        String validSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        SignConsentRequest signReq = new SignConsentRequest(validSignature, "All my questions were answered by Dr. House.");

        ConsentResponseDto signed = consentService.signConsent(created.getId(), signReq, patientPrincipal, "127.0.0.1");

        assertEquals(ConsentStatus.APPROVED, signed.getStatus());
        assertNotNull(signed.getSignatureTimestamp());
        assertEquals(validSignature, signed.getSignatureData());
        assertEquals("All my questions were answered by Dr. House.", signed.getPatientComments());

        // Verify state machine prevents re-signing an already approved consent
        assertThrows(BadRequestException.class, () ->
                consentService.signConsent(created.getId(), signReq, patientPrincipal, "127.0.0.1")
        );

        // 3. Patient revokes consent before surgery
        RevokeConsentRequest revokeReq = new RevokeConsentRequest("Decided to seek a second medical opinion.");
        ConsentResponseDto revoked = consentService.revokeConsent(created.getId(), revokeReq, patientPrincipal, "127.0.0.1");

        assertEquals(ConsentStatus.REVOKED, revoked.getStatus());
        assertNotNull(revoked.getRevocationTimestamp());
        assertEquals("Decided to seek a second medical opinion.", revoked.getRevocationReason());

        // Verify state machine prevents signing or revoking already revoked consent
        assertThrows(BadRequestException.class, () ->
                consentService.signConsent(created.getId(), signReq, patientPrincipal, "127.0.0.1")
        );
        assertThrows(BadRequestException.class, () ->
                consentService.revokeConsent(created.getId(), revokeReq, patientPrincipal, "127.0.0.1")
        );
    }

    @Test
    @DisplayName("Patient rejects consent request with formal reason")
    void testPatientRejectConsent() {
        CreateConsentRequest createReq = new CreateConsentRequest(
                savedPatient.getId(),
                "Knee Arthroscopy",
                "Diagnostic joint inspection",
                "Consent agreement text...",
                "Risks of procedure...",
                LocalDate.now().plusDays(15),
                "Standard procedure"
        );
        ConsentResponseDto created = consentService.createConsent(createReq, doctorPrincipal, "127.0.0.1");

        RejectConsentRequest rejectReq = new RejectConsentRequest("Patient requested alternative physical therapy trial.");
        ConsentResponseDto rejected = consentService.rejectConsent(created.getId(), rejectReq, patientPrincipal, "127.0.0.1");

        assertEquals(ConsentStatus.REJECTED, rejected.getStatus());
        assertTrue(rejected.getPatientComments().contains("REJECTION REASON"));
    }
}
