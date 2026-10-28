package com.hospital.consent.repository;

import com.hospital.consent.entity.DocumentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentAuditLogRepository extends JpaRepository<DocumentAuditLog, Long> {
    List<DocumentAuditLog> findByDocumentIdOrderByTimestampDesc(Long documentId);
}
