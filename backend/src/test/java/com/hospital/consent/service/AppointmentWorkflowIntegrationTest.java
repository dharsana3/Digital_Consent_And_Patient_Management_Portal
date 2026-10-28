package com.hospital.consent.service;

import com.hospital.consent.dto.appointment.AppointmentResponseDto;
import com.hospital.consent.dto.appointment.CreateAppointmentRequest;
import com.hospital.consent.dto.appointment.UpdateAppointmentStatusRequest;
import com.hospital.consent.entity.Department;
import com.hospital.consent.entity.Doctor;
import com.hospital.consent.entity.Patient;
import com.hospital.consent.entity.User;
import com.hospital.consent.enums.AppointmentStatus;
import com.hospital.consent.enums.Role;
import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.repository.AppointmentRepository;
import com.hospital.consent.repository.DepartmentRepository;
import com.hospital.consent.repository.DoctorRepository;
import com.hospital.consent.repository.PatientRepository;
import com.hospital.consent.repository.UserRepository;
import com.hospital.consent.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AppointmentWorkflowIntegrationTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private Doctor savedDoctor;
    private Patient savedPatient;
    private Patient otherPatient;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal patientPrincipal;
    private UserPrincipal otherPatientPrincipal;

    @BeforeEach
    void setupTestData() {
        Department dept = departmentRepository.save(new Department("Cardiology", "Heart health", "Dr. Warren"));

        User docUser = userRepository.save(new User("Dr. Gregory House", "house.appt@hospital.com", "passhash", Role.DOCTOR));
        savedDoctor = doctorRepository.save(new Doctor(docUser, dept, "LIC-APP-1", "Cardiologist", "Room 101"));
        doctorPrincipal = UserPrincipal.create(docUser);

        User patUser = userRepository.save(new User("Jane Doe", "jane.appt@example.com", "passhash", Role.PATIENT));
        savedPatient = patientRepository.save(new Patient(patUser, LocalDate.of(1990, 1, 1), null, null, "555-0100", "Street 1"));
        patientPrincipal = UserPrincipal.create(patUser);

        User otherUser = userRepository.save(new User("Other Patient", "other.appt@example.com", "passhash", Role.PATIENT));
        otherPatient = patientRepository.save(new Patient(otherUser, LocalDate.of(1992, 2, 2), null, null, "555-0200", "Street 2"));
        otherPatientPrincipal = UserPrincipal.create(otherUser);
    }

    @Test
    @DisplayName("End-to-end appointment lifecycle: Patient books -> Doctor confirms -> Doctor completes")
    void testAppointmentLifecycle() {
        LocalDate date = LocalDate.now().plusDays(2);
        LocalTime time = LocalTime.of(10, 30);

        CreateAppointmentRequest req = new CreateAppointmentRequest(savedDoctor.getId(), date, time, "Cardiac routine evaluation");
        AppointmentResponseDto created = appointmentService.createAppointment(req, patientPrincipal);

        assertNotNull(created.getId());
        assertEquals(AppointmentStatus.REQUESTED, created.getStatus());
        assertEquals("Dr. Gregory House", created.getDoctorName());
        assertEquals("Jane Doe", created.getPatientName());

        // Doctor views appointments
        List<AppointmentResponseDto> docList = appointmentService.getDoctorAppointments(doctorPrincipal);
        assertTrue(docList.stream().anyMatch(a -> a.getId().equals(created.getId())));

        // Doctor confirms appointment
        UpdateAppointmentStatusRequest confirmReq = new UpdateAppointmentStatusRequest(AppointmentStatus.CONFIRMED, "Confirmed for 10:30 AM");
        AppointmentResponseDto confirmed = appointmentService.updateAppointmentStatus(created.getId(), confirmReq, doctorPrincipal);
        assertEquals(AppointmentStatus.CONFIRMED, confirmed.getStatus());
        assertEquals("Confirmed for 10:30 AM", confirmed.getDoctorNotes());

        // Doctor completes appointment
        UpdateAppointmentStatusRequest completeReq = new UpdateAppointmentStatusRequest(AppointmentStatus.COMPLETED, "Consultation completed");
        AppointmentResponseDto completed = appointmentService.updateAppointmentStatus(created.getId(), completeReq, doctorPrincipal);
        assertEquals(AppointmentStatus.COMPLETED, completed.getStatus());
    }

    @Test
    @DisplayName("Should prevent double booking same doctor at same slot")
    void testPreventDoubleBooking() {
        LocalDate date = LocalDate.now().plusDays(3);
        LocalTime time = LocalTime.of(14, 0);

        CreateAppointmentRequest req1 = new CreateAppointmentRequest(savedDoctor.getId(), date, time, "Checkup 1");
        appointmentService.createAppointment(req1, patientPrincipal);

        CreateAppointmentRequest req2 = new CreateAppointmentRequest(savedDoctor.getId(), date, time, "Checkup 2 conflict");
        assertThrows(BadRequestException.class, () -> appointmentService.createAppointment(req2, otherPatientPrincipal));
    }

    @Test
    @DisplayName("Should prevent booking appointment in the past")
    void testPreventPastBooking() {
        LocalDate pastDate = LocalDate.now().minusDays(1);
        LocalTime time = LocalTime.of(9, 0);

        CreateAppointmentRequest req = new CreateAppointmentRequest(savedDoctor.getId(), pastDate, time, "Past booking attempt");
        assertThrows(BadRequestException.class, () -> appointmentService.createAppointment(req, patientPrincipal));
    }

    @Test
    @DisplayName("Should prevent patient from cancelling another patient's appointment")
    void testPreventUnauthorizedAccess() {
        LocalDate date = LocalDate.now().plusDays(4);
        LocalTime time = LocalTime.of(11, 0);

        CreateAppointmentRequest req = new CreateAppointmentRequest(savedDoctor.getId(), date, time, "Private visit");
        AppointmentResponseDto created = appointmentService.createAppointment(req, patientPrincipal);

        UpdateAppointmentStatusRequest cancelReq = new UpdateAppointmentStatusRequest(AppointmentStatus.CANCELLED, null);
        assertThrows(AccessDeniedException.class, () ->
                appointmentService.updateAppointmentStatus(created.getId(), cancelReq, otherPatientPrincipal)
        );
    }
}
