package com.hospital.consent.controller;

import com.hospital.consent.dto.appointment.AppointmentResponseDto;
import com.hospital.consent.dto.appointment.CreateAppointmentRequest;
import com.hospital.consent.dto.appointment.UpdateAppointmentStatusRequest;
import com.hospital.consent.dto.common.ApiResponse;
import com.hospital.consent.enums.AppointmentStatus;
import com.hospital.consent.security.UserPrincipal;
import com.hospital.consent.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointment Management", description = "Endpoints for scheduling, managing, and tracking hospital appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Book a new clinical appointment with a doctor (Patient only)")
    public ResponseEntity<ApiResponse<AppointmentResponseDto>> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        AppointmentResponseDto response = appointmentService.createAppointment(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Appointment scheduled successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get appointment history and upcoming bookings for current patient")
    public ResponseEntity<ApiResponse<List<AppointmentResponseDto>>> getMyAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<AppointmentResponseDto> list = appointmentService.getMyAppointments(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get appointment roster for currently logged in doctor")
    public ResponseEntity<ApiResponse<List<AppointmentResponseDto>>> getDoctorAppointments(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<AppointmentResponseDto> list = appointmentService.getDoctorAppointments(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all hospital appointments with optional status filter (Admin only)")
    public ResponseEntity<ApiResponse<List<AppointmentResponseDto>>> getAllAppointments(
            @RequestParam(required = false) AppointmentStatus status) {
        List<AppointmentResponseDto> list = appointmentService.getAllAppointments(status);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update appointment status (Confirm/Reject/Complete by Doctor, Cancel by Patient/Admin)")
    public ResponseEntity<ApiResponse<AppointmentResponseDto>> updateAppointmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        AppointmentResponseDto response = appointmentService.updateAppointmentStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Appointment status updated successfully", response));
    }
}
