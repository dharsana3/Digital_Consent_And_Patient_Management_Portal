package com.hospital.consent.dto.ai;

public class GlossaryItemDto {
    private Long id;
    private String term;
    private String category;
    private String definition;
    private String laymanExplanation;
    private String patientTakeaway;
    private String questionsToAskDoctor;

    public GlossaryItemDto() {
    }

    public GlossaryItemDto(Long id, String term, String category, String definition,
                           String laymanExplanation, String patientTakeaway, String questionsToAskDoctor) {
        this.id = id;
        this.term = term;
        this.category = category;
        this.definition = definition;
        this.laymanExplanation = laymanExplanation;
        this.patientTakeaway = patientTakeaway;
        this.questionsToAskDoctor = questionsToAskDoctor;
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
}
