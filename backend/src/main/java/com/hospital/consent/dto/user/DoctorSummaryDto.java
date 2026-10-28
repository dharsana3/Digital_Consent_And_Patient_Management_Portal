package com.hospital.consent.dto.user;

public class DoctorSummaryDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private Long departmentId;
    private String departmentName;
    private String licenseNumber;
    private String specialization;
    private String phoneNumber;
    private String officeLocation;
    private String bio;

    public DoctorSummaryDto() {
    }

    public DoctorSummaryDto(Long id, Long userId, String fullName, String email, Long departmentId,
                            String departmentName, String licenseNumber, String specialization,
                            String phoneNumber, String officeLocation, String bio) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.licenseNumber = licenseNumber;
        this.specialization = specialization;
        this.phoneNumber = phoneNumber;
        this.officeLocation = officeLocation;
        this.bio = bio;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getOfficeLocation() {
        return officeLocation;
    }

    public void setOfficeLocation(String officeLocation) {
        this.officeLocation = officeLocation;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
}
