package com.hospital.consent.service;

import com.hospital.consent.dto.document.DocumentResponseDto;
import com.hospital.consent.dto.document.DocumentUploadDto;
import com.hospital.consent.entity.Document;
import com.hospital.consent.entity.DocumentAuditLog;
import com.hospital.consent.entity.Patient;
import com.hospital.consent.entity.User;
import com.hospital.consent.enums.DocumentAuditAction;
import com.hospital.consent.enums.DocumentStatus;
import com.hospital.consent.enums.Role;
import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.exception.ResourceNotFoundException;
import com.hospital.consent.repository.DocumentAuditLogRepository;
import com.hospital.consent.repository.DocumentRepository;
import com.hospital.consent.repository.PatientRepository;
import com.hospital.consent.repository.UserRepository;
import com.hospital.consent.security.UserPrincipal;
import com.hospital.consent.service.storage.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentAuditLogRepository auditLogRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentAuditLogRepository auditLogRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {
        this.documentRepository = documentRepository;
        this.auditLogRepository = auditLogRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public DocumentResponseDto uploadDocument(MultipartFile file, DocumentUploadDto dto, UserPrincipal currentUser, String clientIp) {
        User uploader = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Uploader user not found"));

        Patient patient;
        if (currentUser.getRole() == Role.PATIENT) {
            patient = patientRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + currentUser.getEmail()));
        } else {
            if (dto.getPatientId() == null) {
                throw new BadRequestException("Target patientId is required when document is uploaded by medical staff");
            }
            patient = patientRepository.findById(dto.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target patient not found with ID: " + dto.getPatientId()));
        }

        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(file);

        Document doc = new Document();
        doc.setPatient(patient);
        doc.setUploader(uploader);
        doc.setDocumentType(dto.getDocumentType());
        doc.setTitle(dto.getTitle().trim());
        doc.setDescription(dto.getDescription());
        doc.setOriginalFilename(stored.originalFilename());
        doc.setStoredFilename(stored.storedFilename());
        doc.setStoragePath(stored.storagePath());
        doc.setFileSizeBytes(stored.fileSizeBytes());
        doc.setMimeType(stored.mimeType());
        doc.setChecksumSha256(stored.checksumSha256());
        doc.setStatus(DocumentStatus.ACTIVE);

        doc = documentRepository.save(doc);

        // Record immutable audit event
        auditLogRepository.save(new DocumentAuditLog(
                doc,
                uploader,
                DocumentAuditAction.UPLOADED,
                "Uploaded document '" + doc.getTitle() + "' (SHA-256: " + doc.getChecksumSha256() + ")",
                clientIp
        ));

        return mapToDto(doc);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponseDto> getDocumentsForPatient(Long patientId, UserPrincipal currentUser) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        validatePatientAccess(patient, currentUser);

        return documentRepository.findByPatientIdAndStatusOrderByCreatedAtDesc(patientId, DocumentStatus.ACTIVE)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentResponseDto> getMyDocuments(UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.PATIENT) {
            throw new BadRequestException("Only patients can invoke the personal document library endpoint");
        }
        return documentRepository.findByPatientUserIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), DocumentStatus.ACTIVE)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public DownloadResult downloadDocument(Long documentId, UserPrincipal currentUser, String clientIp) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        validatePatientAccess(doc.getPatient(), currentUser);

        User accessor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Resource resource = fileStorageService.loadFileAsResource(doc.getStoredFilename());

        // Audit download
        auditLogRepository.save(new DocumentAuditLog(
                doc,
                accessor,
                DocumentAuditAction.DOWNLOADED,
                "Downloaded file '" + doc.getOriginalFilename() + "'",
                clientIp
        ));

        return new DownloadResult(resource, doc.getOriginalFilename(), doc.getMimeType());
    }

    @Transactional
    public DocumentResponseDto archiveDocument(Long documentId, UserPrincipal currentUser, String clientIp) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        validatePatientAccess(doc.getPatient(), currentUser);

        doc.setStatus(DocumentStatus.ARCHIVED);
        doc = documentRepository.save(doc);

        User actor = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        auditLogRepository.save(new DocumentAuditLog(
                doc,
                actor,
                DocumentAuditAction.ARCHIVED,
                "Archived document '" + doc.getTitle() + "'",
                clientIp
        ));

        return mapToDto(doc);
    }

    private void validatePatientAccess(Patient patient, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.PATIENT) {
            if (!patient.getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Access denied: You cannot view or access records belonging to another patient");
            }
        }
        // DOCTOR and ADMIN are authorized hospital staff
    }

    public record DownloadResult(Resource resource, String originalFilename, String mimeType) {}

    private DocumentResponseDto mapToDto(Document doc) {
        return new DocumentResponseDto(
                doc.getId(),
                doc.getPatient().getId(),
                doc.getPatient().getUser().getFullName(),
                doc.getUploader().getId(),
                doc.getUploader().getFullName(),
                doc.getDocumentType(),
                doc.getTitle(),
                doc.getDescription(),
                doc.getOriginalFilename(),
                doc.getFileSizeBytes(),
                doc.getMimeType(),
                doc.getChecksumSha256(),
                doc.getStatus(),
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }
}
