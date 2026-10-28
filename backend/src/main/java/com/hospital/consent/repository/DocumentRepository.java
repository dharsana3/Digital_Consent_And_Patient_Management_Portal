package com.hospital.consent.repository;

import com.hospital.consent.entity.Document;
import com.hospital.consent.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByPatientIdAndStatusOrderByCreatedAtDesc(Long patientId, DocumentStatus status);
    List<Document> findByPatientUserIdAndStatusOrderByCreatedAtDesc(Long userId, DocumentStatus status);
    List<Document> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Document> findByUploaderIdOrderByCreatedAtDesc(Long uploaderId);
}
