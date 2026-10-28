package com.hospital.consent.controller;

import com.hospital.consent.dto.common.ApiResponse;
import com.hospital.consent.dto.consent.*;
import com.hospital.consent.enums.ConsentStatus;
import com.hospital.consent.security.UserPrincipal;
import com.hospital.consent.service.ConsentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/consents")
@Tag(name = "Consent Management", description = "Endpoints for digital procedure consent workflow, signing, and audit trails")
public class ConsentController {

    private final ConsentService consentService;

    public ConsentController(ConsentService consentService) {
        this.consentService = consentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Create a new procedure consent request for a patient (Doctor only)")
    public ResponseEntity<ApiResponse<ConsentResponseDto>> createConsent(
            @Valid @RequestBody CreateConsentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        ConsentResponseDto response = consentService.createConsent(request, currentUser, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Consent request created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get consent request by ID including immutable audit trail")
    public ResponseEntity<ApiResponse<ConsentResponseDto>> getConsentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        ConsentResponseDto response = consentService.getConsentById(id, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Execute digital signature and approve procedure consent (Patient only)")
    public ResponseEntity<ApiResponse<ConsentResponseDto>> signConsent(
            @PathVariable Long id,
            @Valid @RequestBody SignConsentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        ConsentResponseDto response = consentService.signConsent(id, request, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Consent approved and signed successfully", response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Deliberately reject procedure consent request (Patient only)")
    public ResponseEntity<ApiResponse<ConsentResponseDto>> rejectConsent(
            @PathVariable Long id,
            @Valid @RequestBody RejectConsentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        ConsentResponseDto response = consentService.rejectConsent(id, request, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Consent request rejected", response));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Revoke a previously approved consent agreement")
    public ResponseEntity<ApiResponse<ConsentResponseDto>> revokeConsent(
            @PathVariable Long id,
            @Valid @RequestBody RevokeConsentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        ConsentResponseDto response = consentService.revokeConsent(id, request, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Consent revoked successfully", response));
    }

    @PostMapping("/{id}/ask")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Submit a formal question or clarification inquiry regarding consent text")
    public ResponseEntity<ApiResponse<ConsentResponseDto>> askQuestion(
            @PathVariable Long id,
            @Valid @RequestBody ConsentQuestionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        ConsentResponseDto response = consentService.askQuestion(id, request, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Question recorded in consent audit history", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Retrieve all consent requests for current patient")
    public ResponseEntity<ApiResponse<List<ConsentResponseDto>>> getMyConsents(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConsentResponseDto> list = consentService.getMyConsents(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Retrieve all consents created by current doctor")
    public ResponseEntity<ApiResponse<List<ConsentResponseDto>>> getDoctorConsents(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConsentResponseDto> list = consentService.getDoctorConsents(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Retrieve all hospital consents with optional status filter (Admin only)")
    public ResponseEntity<ApiResponse<List<ConsentResponseDto>>> getAllConsents(
            @RequestParam(required = false) ConsentStatus status) {
        List<ConsentResponseDto> list = consentService.getAllConsents(status);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(",")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
