package com.hospital.consent.dto.consent;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ConsentQuestionRequest {

    @NotBlank(message = "Question or clarification text is required")
    @Size(min = 5, max = 2000, message = "Question must be between 5 and 2000 characters")
    private String question;

    public ConsentQuestionRequest() {
    }

    public ConsentQuestionRequest(String question) {
        this.question = question;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
