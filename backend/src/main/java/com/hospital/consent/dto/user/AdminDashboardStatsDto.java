package com.hospital.consent.dto.user;

public class AdminDashboardStatsDto {
    private long totalUsers;
    private long totalDoctors;
    private long totalPatients;
    private long totalDepartments;
    private long totalConsents;
    private long pendingConsents;
    private long approvedConsents;
    private long rejectedConsents;
    private long revokedConsents;
    private long totalDocuments;
    private long totalAppointments;
    private long pendingAppointments;
    private long confirmedAppointments;

    public AdminDashboardStatsDto() {
    }

    public AdminDashboardStatsDto(long totalUsers, long totalDoctors, long totalPatients, long totalDepartments,
                                 long totalConsents, long pendingConsents, long approvedConsents,
                                 long rejectedConsents, long revokedConsents, long totalDocuments) {
        this(totalUsers, totalDoctors, totalPatients, totalDepartments,
             totalConsents, pendingConsents, approvedConsents,
             rejectedConsents, revokedConsents, totalDocuments,
             0, 0, 0);
    }

    public AdminDashboardStatsDto(long totalUsers, long totalDoctors, long totalPatients, long totalDepartments,
                                 long totalConsents, long pendingConsents, long approvedConsents,
                                 long rejectedConsents, long revokedConsents, long totalDocuments,
                                 long totalAppointments, long pendingAppointments, long confirmedAppointments) {
        this.totalUsers = totalUsers;
        this.totalDoctors = totalDoctors;
        this.totalPatients = totalPatients;
        this.totalDepartments = totalDepartments;
        this.totalConsents = totalConsents;
        this.pendingConsents = pendingConsents;
        this.approvedConsents = approvedConsents;
        this.rejectedConsents = rejectedConsents;
        this.revokedConsents = revokedConsents;
        this.totalDocuments = totalDocuments;
        this.totalAppointments = totalAppointments;
        this.pendingAppointments = pendingAppointments;
        this.confirmedAppointments = confirmedAppointments;
    }

    // Getters and Setters
    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalDoctors() {
        return totalDoctors;
    }

    public void setTotalDoctors(long totalDoctors) {
        this.totalDoctors = totalDoctors;
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public void setTotalPatients(long totalPatients) {
        this.totalPatients = totalPatients;
    }

    public long getTotalDepartments() {
        return totalDepartments;
    }

    public void setTotalDepartments(long totalDepartments) {
        this.totalDepartments = totalDepartments;
    }

    public long getTotalConsents() {
        return totalConsents;
    }

    public void setTotalConsents(long totalConsents) {
        this.totalConsents = totalConsents;
    }

    public long getPendingConsents() {
        return pendingConsents;
    }

    public void setPendingConsents(long pendingConsents) {
        this.pendingConsents = pendingConsents;
    }

    public long getApprovedConsents() {
        return approvedConsents;
    }

    public void setApprovedConsents(long approvedConsents) {
        this.approvedConsents = approvedConsents;
    }

    public long getRejectedConsents() {
        return rejectedConsents;
    }

    public void setRejectedConsents(long rejectedConsents) {
        this.rejectedConsents = rejectedConsents;
    }

    public long getRevokedConsents() {
        return revokedConsents;
    }

    public void setRevokedConsents(long revokedConsents) {
        this.revokedConsents = revokedConsents;
    }

    public long getTotalDocuments() {
        return totalDocuments;
    }

    public void setTotalDocuments(long totalDocuments) {
        this.totalDocuments = totalDocuments;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getPendingAppointments() {
        return pendingAppointments;
    }

    public void setPendingAppointments(long pendingAppointments) {
        this.pendingAppointments = pendingAppointments;
    }

    public long getConfirmedAppointments() {
        return confirmedAppointments;
    }

    public void setConfirmedAppointments(long confirmedAppointments) {
        this.confirmedAppointments = confirmedAppointments;
    }
}
