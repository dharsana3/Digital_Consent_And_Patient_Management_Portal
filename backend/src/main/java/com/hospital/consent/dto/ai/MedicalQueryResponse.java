package com.hospital.consent.dto.ai;

import java.util.ArrayList;
import java.util.List;

public class MedicalQueryResponse {

    private String question;
    private String answer;
    private String laymanExplanation;
    private List<GlossaryItemDto> matchedGlossaryTerms = new ArrayList<>();
    private List<String> suggestedDoctorQuestions = new ArrayList<>();
    private String disclaimer = "IMPORTANT MEDICAL DISCLAIMER: This assistant is designed purely for educational clarification of medical terminology. It is NOT a doctor, cannot provide medical diagnoses, treatment decisions, or medical advice, and never replaces a direct conversation with your physician.";
    private String providerUsed;
    private boolean consentContextIncluded;

    public MedicalQueryResponse() {
    }

    public MedicalQueryResponse(String question, String answer, String laymanExplanation,
                                List<GlossaryItemDto> matchedGlossaryTerms, List<String> suggestedDoctorQuestions,
                                String providerUsed, boolean consentContextIncluded) {
        this.question = question;
        this.answer = answer;
        this.laymanExplanation = laymanExplanation;
        this.matchedGlossaryTerms = matchedGlossaryTerms != null ? matchedGlossaryTerms : new ArrayList<>();
        this.suggestedDoctorQuestions = suggestedDoctorQuestions != null ? suggestedDoctorQuestions : new ArrayList<>();
        this.providerUsed = providerUsed;
        this.consentContextIncluded = consentContextIncluded;
    }

    // Getters and Setters
    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getLaymanExplanation() {
        return laymanExplanation;
    }

    public void setLaymanExplanation(String laymanExplanation) {
        this.laymanExplanation = laymanExplanation;
    }

    public List<GlossaryItemDto> getMatchedGlossaryTerms() {
        return matchedGlossaryTerms;
    }

    public void setMatchedGlossaryTerms(List<GlossaryItemDto> matchedGlossaryTerms) {
        this.matchedGlossaryTerms = matchedGlossaryTerms;
    }

    public List<String> getSuggestedDoctorQuestions() {
        return suggestedDoctorQuestions;
    }

    public void setSuggestedDoctorQuestions(List<String> suggestedDoctorQuestions) {
        this.suggestedDoctorQuestions = suggestedDoctorQuestions;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public String getProviderUsed() {
        return providerUsed;
    }

    public void setProviderUsed(String providerUsed) {
        this.providerUsed = providerUsed;
    }

    public boolean isConsentContextIncluded() {
        return consentContextIncluded;
    }

    public void setConsentContextIncluded(boolean consentContextIncluded) {
        this.consentContextIncluded = consentContextIncluded;
    }
}
