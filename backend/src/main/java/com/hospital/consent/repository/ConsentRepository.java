package com.hospital.consent.repository;

import com.hospital.consent.entity.Consent;
import com.hospital.consent.enums.ConsentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentRepository extends JpaRepository<Consent, Long> {
    Optional<Consent> findByConsentNumber(String consentNumber);
    List<Consent> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Consent> findByPatientUserIdOrderByCreatedAtDesc(Long userId);
    List<Consent> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<Consent> findByDoctorUserIdOrderByCreatedAtDesc(Long userId);
    List<Consent> findByPatientIdAndStatus(Long patientId, ConsentStatus status);
    boolean existsByConsentNumber(String consentNumber);
}
