package com.hospital.consent.service;

import com.hospital.consent.dto.appointment.AppointmentResponseDto;
import com.hospital.consent.dto.appointment.CreateAppointmentRequest;
import com.hospital.consent.dto.appointment.UpdateAppointmentStatusRequest;
import com.hospital.consent.entity.Appointment;
import com.hospital.consent.entity.Doctor;
import com.hospital.consent.entity.Patient;
import com.hospital.consent.enums.AppointmentStatus;
import com.hospital.consent.enums.Role;
import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.exception.ResourceNotFoundException;
import com.hospital.consent.repository.AppointmentRepository;
import com.hospital.consent.repository.DoctorRepository;
import com.hospital.consent.repository.PatientRepository;
import com.hospital.consent.security.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    @Transactional
    public AppointmentResponseDto createAppointment(CreateAppointmentRequest request, UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.PATIENT) {
            throw new AccessDeniedException("Only registered patients can request appointments");
        }

        Patient patient = patientRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + currentUser.getEmail()));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + request.getDoctorId()));

        // Prevent booking in the past
        if (request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Appointment date cannot be in the past");
        }

        // Prevent double booking with the same doctor at the same slot
        boolean slotTaken = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNotIn(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                List.of(AppointmentStatus.REJECTED, AppointmentStatus.CANCELLED)
        );

        if (slotTaken) {
            throw new BadRequestException("The selected doctor already has a scheduled appointment at this date and time ("  + request.getAppointmentDate() + " at " + request.getAppointmentTime() + "). Please choose a different slot.");
        }

        Appointment appointment = new Appointment(
                patient,
                doctor,
                doctor.getDepartment(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                request.getReason().trim()
        );

        appointment = appointmentRepository.save(appointment);
        return mapToDto(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> getMyAppointments(UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.PATIENT) {
            throw new AccessDeniedException("Only patients can access their personal appointment history");
        }
        return appointmentRepository.findByPatientUserIdOrderByAppointmentDateDescAppointmentTimeDesc(currentUser.getId())
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> getDoctorAppointments(UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.DOCTOR) {
            throw new AccessDeniedException("Only doctors can access clinical appointment schedules");
        }
        return appointmentRepository.findByDoctorUserIdOrderByAppointmentDateDescAppointmentTimeDesc(currentUser.getId())
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> getAllAppointments(AppointmentStatus status) {
        List<Appointment> list = (status != null)
                ? appointmentRepository.findByStatusOrderByAppointmentDateDescAppointmentTimeDesc(status)
                : appointmentRepository.findAllByOrderByAppointmentDateDescAppointmentTimeDesc();
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponseDto updateAppointmentStatus(Long id, UpdateAppointmentStatusRequest request, UserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        AppointmentStatus currentStatus = appointment.getStatus();
        AppointmentStatus newStatus = request.getStatus();

        if (currentUser.getRole() == Role.PATIENT) {
            if (!appointment.getPatient().getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Access denied: You cannot modify another patient's appointment");
            }
            // Patient can only cancel active appointments
            if (newStatus != AppointmentStatus.CANCELLED) {
                throw new BadRequestException("Patients can only cancel appointments");
            }
            if (currentStatus == AppointmentStatus.COMPLETED || currentStatus == AppointmentStatus.REJECTED) {
                throw new BadRequestException("Cannot cancel an appointment that is already " + currentStatus);
            }
        } else if (currentUser.getRole() == Role.DOCTOR) {
            if (!appointment.getDoctor().getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Access denied: You are not the assigned physician for this appointment");
            }
            // Doctor transitions
            if (currentStatus == AppointmentStatus.CANCELLED) {
                throw new BadRequestException("Cannot modify an appointment cancelled by the patient");
            }
            if (currentStatus == AppointmentStatus.COMPLETED && newStatus != AppointmentStatus.COMPLETED) {
                throw new BadRequestException("Cannot re-open an appointment that has been marked COMPLETED");
            }
            if (request.getDoctorNotes() != null) {
                appointment.setDoctorNotes(request.getDoctorNotes().trim());
            }
        } else if (currentUser.getRole() == Role.ADMIN) {
            if (request.getDoctorNotes() != null) {
                appointment.setDoctorNotes(request.getDoctorNotes().trim());
            }
        } else {
            throw new AccessDeniedException("Unauthorized role for appointment management");
        }

        appointment.setStatus(newStatus);
        appointment = appointmentRepository.save(appointment);
        return mapToDto(appointment);
    }

    private AppointmentResponseDto mapToDto(Appointment a) {
        Patient p = a.getPatient();
        Doctor d = a.getDoctor();
        return new AppointmentResponseDto(
                a.getId(),
                p.getId(),
                p.getUser().getFullName(),
                p.getUser().getEmail(),
                p.getPhoneNumber(),
                d.getId(),
                d.getUser().getFullName(),
                d.getDepartment() != null ? d.getDepartment().getId() : null,
                d.getDepartment() != null ? d.getDepartment().getName() : "General Practice",
                d.getSpecialization(),
                a.getAppointmentDate(),
                a.getAppointmentTime(),
                a.getReason(),
                a.getStatus(),
                a.getDoctorNotes(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
