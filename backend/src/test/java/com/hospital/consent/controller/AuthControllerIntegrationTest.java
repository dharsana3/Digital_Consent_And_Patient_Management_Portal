package com.hospital.consent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.consent.dto.auth.LoginRequest;
import com.hospital.consent.dto.auth.RegisterRequest;
import com.hospital.consent.enums.Gender;
import com.hospital.consent.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully register a patient, log in, and access authenticated endpoint")
    void testRegisterAndLoginWorkflow() throws Exception {
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setFullName("Alexander Fleming");
        registerReq.setEmail("alex.fleming@test.com");
        registerReq.setPassword("SecurePass123!");
        registerReq.setRole(Role.PATIENT);
        registerReq.setDateOfBirth(LocalDate.of(1980, 8, 6));
        registerReq.setGender(Gender.MALE);

        // 1. Register
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.user.email").value("alex.fleming@test.com"))
                .andExpect(jsonPath("$.data.user.role").value("PATIENT"));

        // 2. Login
        LoginRequest loginReq = new LoginRequest("alex.fleming@test.com", "SecurePass123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // 3. Access /api/v1/auth/me with Bearer token
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("alex.fleming@test.com"))
                .andExpect(jsonPath("$.data.fullName").value("Alexander Fleming"));
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void testLoginWithBadCredentials() throws Exception {
        LoginRequest badLogin = new LoginRequest("nonexistent@test.com", "WrongPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Should prohibit public self-registration with ADMIN role")
    void testRejectAdminRegistration() throws Exception {
        RegisterRequest adminReq = new RegisterRequest();
        adminReq.setFullName("Malicious Admin Attempt");
        adminReq.setEmail("attacker@test.com");
        adminReq.setPassword("Password123!");
        adminReq.setRole(Role.ADMIN);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
