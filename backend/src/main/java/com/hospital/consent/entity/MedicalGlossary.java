package com.hospital.consent.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_glossary")
public class MedicalGlossary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String term;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "layman_explanation", nullable = false, columnDefinition = "TEXT")
    private String laymanExplanation;

    @Column(name = "patient_takeaway", columnDefinition = "TEXT")
    private String patientTakeaway;

    @Column(name = "questions_to_ask_doctor", columnDefinition = "TEXT")
    private String questionsToAskDoctor;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public MedicalGlossary() {
    }

    public MedicalGlossary(String term, String category, String definition, String laymanExplanation, String patientTakeaway, String questionsToAskDoctor) {
        this.term = term;
        this.category = category;
        this.definition = definition;
        this.laymanExplanation = laymanExplanation;
        this.patientTakeaway = patientTakeaway;
        this.questionsToAskDoctor = questionsToAskDoctor;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDefinition() {
        return definition;
    }

    public void setDefinition(String definition) {
        this.definition = definition;
    }

    public String getLaymanExplanation() {
        return laymanExplanation;
    }

    public void setLaymanExplanation(String laymanExplanation) {
        this.laymanExplanation = laymanExplanation;
    }

    public String getPatientTakeaway() {
        return patientTakeaway;
    }

    public void setPatientTakeaway(String patientTakeaway) {
        this.patientTakeaway = patientTakeaway;
    }

    public String getQuestionsToAskDoctor() {
        return questionsToAskDoctor;
    }

    public void setQuestionsToAskDoctor(String questionsToAskDoctor) {
        this.questionsToAskDoctor = questionsToAskDoctor;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
