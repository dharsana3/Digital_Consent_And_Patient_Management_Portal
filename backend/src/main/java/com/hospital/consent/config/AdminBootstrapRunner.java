package com.hospital.consent.config;

import com.hospital.consent.entity.User;
import com.hospital.consent.enums.Role;
import com.hospital.consent.enums.UserStatus;
import com.hospital.consent.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);
    private static final String BROKEN_SEED_HASH = "$2a$10$w1qEw/7R3rO8g/QGqM7GheoKzTvh85V3Gg.2QoA.a1o/c0i.P6K4W";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_DEFAULT_PASSWORD:Password123!}")
    private String adminDefaultPassword;

    @Value("${ADMIN_RESET_PASSWORD:}")
    private String adminResetPassword;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Check if an admin exists
        boolean hasAdmin = userRepository.findAll().stream().anyMatch(u -> u.getRole() == Role.ADMIN);

        if (!hasAdmin) {
            log.info("No administrator account found. Initializing primary system administrator...");
            User admin = new User(
                    "System Administrator",
                    "admin@hospital.com",
                    passwordEncoder.encode(adminDefaultPassword),
                    Role.ADMIN
            );
            admin.setStatus(UserStatus.ACTIVE);
            userRepository.save(admin);
            log.info("Primary administrator account provisioned for admin@hospital.com");
        } else {
            // Check for explicit password reset via environment variable
            if (adminResetPassword != null && !adminResetPassword.trim().isEmpty()) {
                Optional<User> adminUser = userRepository.findByEmail("admin@hospital.com");
                if (adminUser.isPresent() && adminUser.get().getRole() == Role.ADMIN) {
                    User admin = adminUser.get();
                    admin.setPasswordHash(passwordEncoder.encode(adminResetPassword.trim()));
                    userRepository.save(admin);
                    log.info("Administrator password securely updated from ADMIN_RESET_PASSWORD configuration.");
                }
            } else {
                // Ensure broken legacy seed hash on admin@hospital.com is repaired
                Optional<User> adminUser = userRepository.findByEmail("admin@hospital.com");
                if (adminUser.isPresent() && BROKEN_SEED_HASH.equals(adminUser.get().getPasswordHash())) {
                    User admin = adminUser.get();
                    admin.setPasswordHash(passwordEncoder.encode(adminDefaultPassword));
                    userRepository.save(admin);
                    log.info("Repaired legacy password hash for primary administrator.");
                }
            }
        }
    }
}
