package com.hospital.consent.controller;

import com.hospital.consent.dto.common.ApiResponse;
import com.hospital.consent.dto.document.DocumentResponseDto;
import com.hospital.consent.dto.document.DocumentUploadDto;
import com.hospital.consent.enums.DocumentType;
import com.hospital.consent.security.UserPrincipal;
import com.hospital.consent.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Document Management", description = "Endpoints for secure patient medical document upload, viewing, and archival")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload patient document with metadata and security verification")
    public ResponseEntity<ApiResponse<DocumentResponseDto>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "patientId", required = false) Long patientId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        DocumentUploadDto dto = new DocumentUploadDto(patientId, documentType, title, description);
        String clientIp = getClientIp(request);
        DocumentResponseDto response = documentService.uploadDocument(file, dto, currentUser, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Document uploaded securely", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get documents for the currently authenticated patient")
    public ResponseEntity<ApiResponse<List<DocumentResponseDto>>> getMyDocuments(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<DocumentResponseDto> list = documentService.getMyDocuments(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Get documents for a specific patient (Doctor or Admin only)")
    public ResponseEntity<ApiResponse<List<DocumentResponseDto>>> getDocumentsForPatient(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<DocumentResponseDto> list = documentService.getDocumentsForPatient(patientId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download patient document file securely")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String clientIp = getClientIp(request);
        DocumentService.DownloadResult result = documentService.downloadDocument(id, currentUser, clientIp);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.originalFilename() + "\"")
                .body(result.resource());
    }

    @PatchMapping("/{id}/archive")
    @Operation(summary = "Archive an active document")
    public ResponseEntity<ApiResponse<DocumentResponseDto>> archiveDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String clientIp = getClientIp(request);
        DocumentResponseDto response = documentService.archiveDocument(id, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Document archived successfully", response));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(",")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
