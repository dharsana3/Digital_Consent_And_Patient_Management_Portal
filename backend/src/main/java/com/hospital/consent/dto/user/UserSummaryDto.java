package com.hospital.consent.dto.user;

import com.hospital.consent.enums.Role;
import com.hospital.consent.enums.UserStatus;

public class UserSummaryDto {
    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private UserStatus status;
    private Long profileId; // patientId or doctorId if applicable
    private String additionalInfo; // e.g., Department or Blood Group

    public UserSummaryDto() {
    }

    public UserSummaryDto(Long id, String fullName, String email, Role role, UserStatus status, Long profileId, String additionalInfo) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.status = status;
        this.profileId = profileId;
        this.additionalInfo = additionalInfo;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Long getProfileId() {
        return profileId;
    }

    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }

    public String getAdditionalInfo() {
        return additionalInfo;
    }

    public void setAdditionalInfo(String additionalInfo) {
        this.additionalInfo = additionalInfo;
    }
}
