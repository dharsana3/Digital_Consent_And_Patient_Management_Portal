package com.hospital.consent.controller;

import com.hospital.consent.dto.common.ApiResponse;
import com.hospital.consent.dto.user.*;
import com.hospital.consent.enums.Role;
import com.hospital.consent.security.UserPrincipal;
import com.hospital.consent.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "Endpoints for user administration, doctor lookup, and patient directory")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users with optional role filtering (Admin only)")
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getAllUsers(
            @RequestParam(required = false) Role role) {
        List<UserSummaryDto> users = userService.getAllUsers(role);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user status (ACTIVE / SUSPENDED) (Admin only)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserSummaryDto updated = userService.updateUserStatus(id, request.getStatus(), currentUser);
        return ResponseEntity.ok(ApiResponse.ok("User status updated successfully", updated));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get system administration metrics and statistics (Admin only)")
    public ResponseEntity<ApiResponse<AdminDashboardStatsDto>> getAdminStats() {
        AdminDashboardStatsDto stats = userService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/doctors")
    @Operation(summary = "Get all active doctors and their hospital departments")
    public ResponseEntity<ApiResponse<List<DoctorSummaryDto>>> getAllDoctors() {
        List<DoctorSummaryDto> doctors = userService.getAllDoctors();
        return ResponseEntity.ok(ApiResponse.ok(doctors));
    }

    @GetMapping("/patients")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Get all registered patients (Admin or Doctor only)")
    public ResponseEntity<ApiResponse<List<PatientSummaryDto>>> getAllPatients() {
        List<PatientSummaryDto> patients = userService.getAllPatients();
        return ResponseEntity.ok(ApiResponse.ok(patients));
    }

    @GetMapping("/patients/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Get patient details by patient ID (Admin or Doctor only)")
    public ResponseEntity<ApiResponse<PatientSummaryDto>> getPatientById(@PathVariable Long id) {
        PatientSummaryDto patient = userService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.ok(patient));
    }
}
