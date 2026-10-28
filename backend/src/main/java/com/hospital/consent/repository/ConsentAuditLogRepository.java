package com.hospital.consent.repository;

import com.hospital.consent.entity.ConsentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsentAuditLogRepository extends JpaRepository<ConsentAuditLog, Long> {
    List<ConsentAuditLog> findByConsentIdOrderByTimestampDesc(Long consentId);
}
