package com.hospital.consent.service;

import com.hospital.consent.dto.auth.AuthResponse;
import com.hospital.consent.dto.auth.LoginRequest;
import com.hospital.consent.dto.auth.RegisterRequest;
import com.hospital.consent.dto.user.UserSummaryDto;
import com.hospital.consent.entity.Department;
import com.hospital.consent.entity.Doctor;
import com.hospital.consent.entity.Patient;
import com.hospital.consent.entity.User;
import com.hospital.consent.enums.Role;
import com.hospital.consent.enums.UserStatus;
import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.exception.DuplicateResourceException;
import com.hospital.consent.exception.RateLimitExceededException;
import com.hospital.consent.exception.ResourceNotFoundException;
import com.hospital.consent.repository.DepartmentRepository;
import com.hospital.consent.repository.DoctorRepository;
import com.hospital.consent.repository.PatientRepository;
import com.hospital.consent.repository.UserRepository;
import com.hospital.consent.security.JwtTokenProvider;
import com.hospital.consent.security.RateLimitingService;
import com.hospital.consent.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RateLimitingService rateLimitingService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            RateLimitingService rateLimitingService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.rateLimitingService = rateLimitingService;
    }

    public AuthResponse authenticate(LoginRequest loginRequest, String clientIp) {
        if (!rateLimitingService.tryConsumeAuth(clientIp)) {
            throw new RateLimitExceededException("Too many authentication attempts. Please wait a minute and try again.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String jwt = tokenProvider.generateToken(authentication);

        UserSummaryDto userSummary = buildUserSummary(userPrincipal.getId(), userPrincipal.getEmail());
        return new AuthResponse(jwt, tokenProvider.getJwtExpirationMs(), userSummary);
    }

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest, String clientIp) {
        if (!rateLimitingService.tryConsumeAuth(clientIp)) {
            throw new RateLimitExceededException("Too many registration attempts. Please wait a minute and try again.");
        }

        if (registerRequest.getRole() == Role.ADMIN) {
            throw new BadRequestException("Public self-registration as ADMIN is prohibited. Contact hospital administration or use bootstrap configuration.");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new DuplicateResourceException("An account with email " + registerRequest.getEmail() + " already exists");
        }

        User user = new User(
                registerRequest.getFullName(),
                registerRequest.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getRole()
        );
        user = userRepository.save(user);

        Long profileId = null;
        String additionalInfo = null;

        if (registerRequest.getRole() == Role.PATIENT) {
            Patient patient = new Patient(
                    user,
                    registerRequest.getDateOfBirth(),
                    registerRequest.getGender(),
                    registerRequest.getBloodGroup(),
                    registerRequest.getPhoneNumber(),
                    registerRequest.getAddress()
            );
            patient.setEmergencyContactName(registerRequest.getEmergencyContactName());
            patient.setEmergencyContactPhone(registerRequest.getEmergencyContactPhone());
            patient = patientRepository.save(patient);
            profileId = patient.getId();
            additionalInfo = patient.getBloodGroup() != null ? patient.getBloodGroup().name() : null;
        } else if (registerRequest.getRole() == Role.DOCTOR) {
            if (registerRequest.getLicenseNumber() == null || registerRequest.getLicenseNumber().isBlank()) {
                throw new BadRequestException("Medical license number is mandatory for Doctor registration");
            }
            if (doctorRepository.findByLicenseNumber(registerRequest.getLicenseNumber()).isPresent()) {
                throw new DuplicateResourceException("Medical license number is already registered to an existing doctor");
            }

            Department department = null;
            if (registerRequest.getDepartmentId() != null) {
                department = departmentRepository.findById(registerRequest.getDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + registerRequest.getDepartmentId()));
            }

            Doctor doctor = new Doctor(
                    user,
                    department,
                    registerRequest.getLicenseNumber(),
                    registerRequest.getSpecialization() != null ? registerRequest.getSpecialization() : "General Practice",
                    registerRequest.getOfficeLocation()
            );
            doctor.setPhoneNumber(registerRequest.getPhoneNumber());
            doctor.setBio(registerRequest.getBio());
            doctor = doctorRepository.save(doctor);
            profileId = doctor.getId();
            additionalInfo = department != null ? department.getName() : "Unassigned Department";
        }

        String jwt = tokenProvider.generateTokenFromUser(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        );

        UserSummaryDto userSummary = new UserSummaryDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                profileId,
                additionalInfo
        );

        return new AuthResponse(jwt, tokenProvider.getJwtExpirationMs(), userSummary);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(UserPrincipal userPrincipal) {
        return buildUserSummary(userPrincipal.getId(), userPrincipal.getEmail());
    }

    private UserSummaryDto buildUserSummary(Long userId, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Long profileId = null;
        String additionalInfo = null;

        if (user.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(userId).orElse(null);
            if (patient != null) {
                profileId = patient.getId();
                additionalInfo = patient.getBloodGroup() != null ? patient.getBloodGroup().name() : null;
            }
        } else if (user.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(userId).orElse(null);
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
    }
}
