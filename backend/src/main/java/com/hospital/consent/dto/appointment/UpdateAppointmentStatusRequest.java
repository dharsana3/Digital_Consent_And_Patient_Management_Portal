package com.hospital.consent.dto.appointment;

import com.hospital.consent.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateAppointmentStatusRequest {

    @NotNull(message = "Appointment status is required")
    private AppointmentStatus status;

    private String doctorNotes;

    public UpdateAppointmentStatusRequest() {
    }

    public UpdateAppointmentStatusRequest(AppointmentStatus status, String doctorNotes) {
        this.status = status;
        this.doctorNotes = doctorNotes;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }
}
