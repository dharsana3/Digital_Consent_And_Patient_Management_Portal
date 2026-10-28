package com.hospital.consent.dto.consent;

import com.hospital.consent.enums.ConsentAuditAction;
import java.time.LocalDateTime;

public class ConsentAuditLogDto {
    private Long id;
    private Long performedById;
    private String performedByName;
    private String performedByRole;
    private ConsentAuditAction action;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;

    public ConsentAuditLogDto() {
    }

    public ConsentAuditLogDto(Long id, Long performedById, String performedByName, String performedByRole,
                              ConsentAuditAction action, String details, String ipAddress, LocalDateTime timestamp) {
        this.id = id;
        this.performedById = performedById;
        this.performedByName = performedByName;
        this.performedByRole = performedByRole;
        this.action = action;
        this.details = details;
        this.ipAddress = ipAddress;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPerformedById() {
        return performedById;
    }

    public void setPerformedById(Long performedById) {
        this.performedById = performedById;
    }

    public String getPerformedByName() {
        return performedByName;
    }

    public void setPerformedByName(String performedByName) {
        this.performedByName = performedByName;
    }

    public String getPerformedByRole() {
        return performedByRole;
    }

    public void setPerformedByRole(String performedByRole) {
        this.performedByRole = performedByRole;
    }

    public ConsentAuditAction getAction() {
        return action;
    }

    public void setAction(ConsentAuditAction action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
