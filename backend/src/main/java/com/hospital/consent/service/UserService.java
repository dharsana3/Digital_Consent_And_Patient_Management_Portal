package com.hospital.consent.service;

import com.hospital.consent.dto.user.AdminDashboardStatsDto;
import com.hospital.consent.dto.user.DoctorSummaryDto;
import com.hospital.consent.dto.user.PatientSummaryDto;
import com.hospital.consent.dto.user.UserSummaryDto;
import com.hospital.consent.entity.Doctor;
import com.hospital.consent.entity.Patient;
import com.hospital.consent.entity.User;
import com.hospital.consent.enums.AppointmentStatus;
import com.hospital.consent.enums.ConsentStatus;
import com.hospital.consent.enums.Role;
import com.hospital.consent.enums.UserStatus;
import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.exception.ResourceNotFoundException;
import com.hospital.consent.repository.*;
import com.hospital.consent.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final ConsentRepository consentRepository;
    private final DocumentRepository documentRepository;
    private final AppointmentRepository appointmentRepository;

    public UserService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            DepartmentRepository departmentRepository,
            ConsentRepository consentRepository,
            DocumentRepository documentRepository,
            AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.consentRepository = consentRepository;
        this.documentRepository = documentRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllUsers(Role roleFilter) {
        List<User> users = (roleFilter != null)
                ? userRepository.findByRole(roleFilter)
                : userRepository.findAll();

        return users.stream().map(user -> {
            Long profileId = null;
            String additionalInfo = null;

            if (user.getRole() == Role.PATIENT) {
                Patient patient = patientRepository.findByUserId(user.getId()).orElse(null);
                if (patient != null) {
                    profileId = patient.getId();
                    additionalInfo = patient.getBloodGroup() != null ? patient.getBloodGroup().name() : null;
                }
            } else if (user.getRole() == Role.DOCTOR) {
                Doctor doctor = doctorRepository.findByUserId(user.getId()).orElse(null);
                if (doctor != null) {
                    profileId = doctor.getId();
                    additionalInfo = doctor.getDepartment() != null ? doctor.getDepartment().getName() : null;
                }
            }

            return new UserSummaryDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getStatus(),
                    profileId,
                    additionalInfo
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorSummaryDto> getAllDoctors() {
        return doctorRepository.findAll().stream().map(d -> new DoctorSummaryDto(
                d.getId(),
                d.getUser().getId(),
                d.getUser().getFullName(),
                d.getUser().getEmail(),
                d.getDepartment() != null ? d.getDepartment().getId() : null,
                d.getDepartment() != null ? d.getDepartment().getName() : "Unassigned",
                d.getLicenseNumber(),
                d.getSpecialization(),
                d.getPhoneNumber(),
                d.getOfficeLocation(),
                d.getBio()
        )).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PatientSummaryDto> getAllPatients() {
        return patientRepository.findAll().stream().map(p -> new PatientSummaryDto(
                p.getId(),
                p.getUser().getId(),
                p.getUser().getFullName(),
                p.getUser().getEmail(),
                p.getDateOfBirth(),
                p.getGender(),
                p.getBloodGroup(),
                p.getPhoneNumber(),
                p.getAddress(),
                p.getEmergencyContactName(),
                p.getEmergencyContactPhone()
        )).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PatientSummaryDto getPatientById(Long id) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        return new PatientSummaryDto(
                p.getId(),
                p.getUser().getId(),
                p.getUser().getFullName(),
                p.getUser().getEmail(),
                p.getDateOfBirth(),
                p.getGender(),
                p.getBloodGroup(),
                p.getPhoneNumber(),
                p.getAddress(),
                p.getEmergencyContactName(),
                p.getEmergencyContactPhone()
        );
    }

    @Transactional
    public UserSummaryDto updateUserStatus(Long targetUserId, UserStatus newStatus, UserPrincipal currentUser) {
        if (targetUserId.equals(currentUser.getId())) {
            throw new BadRequestException("Security safeguard: Administrators cannot suspend their own active account");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        user.setStatus(newStatus);
        user = userRepository.save(user);

        return new UserSummaryDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                null,
                null
        );
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getAdminStats() {
        long totalUsers = userRepository.count();
        long totalDoctors = doctorRepository.count();
        long totalPatients = patientRepository.count();
        long totalDepartments = departmentRepository.count();
        long totalConsents = consentRepository.count();
        long pendingConsents = consentRepository.findAll().stream()
                .filter(c -> c.getStatus() == ConsentStatus.PENDING_REVIEW).count();
        long approvedConsents = consentRepository.findAll().stream()
                .filter(c -> c.getStatus() == ConsentStatus.APPROVED).count();
        long rejectedConsents = consentRepository.findAll().stream()
                .filter(c -> c.getStatus() == ConsentStatus.REJECTED).count();
        long revokedConsents = consentRepository.findAll().stream()
                .filter(c -> c.getStatus() == ConsentStatus.REVOKED).count();
        long totalDocuments = documentRepository.count();
        long totalAppointments = appointmentRepository.count();
        long pendingAppointments = appointmentRepository.countByStatus(AppointmentStatus.REQUESTED);
        long confirmedAppointments = appointmentRepository.countByStatus(AppointmentStatus.CONFIRMED);

        return new AdminDashboardStatsDto(
                totalUsers,
                totalDoctors,
                totalPatients,
                totalDepartments,
                totalConsents,
                pendingConsents,
                approvedConsents,
                rejectedConsents,
                revokedConsents,
                totalDocuments,
                totalAppointments,
                pendingAppointments,
                confirmedAppointments
        );
    }
}
