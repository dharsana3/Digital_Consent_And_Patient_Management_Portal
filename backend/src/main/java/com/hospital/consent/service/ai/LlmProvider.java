package com.hospital.consent.service.ai;

import com.hospital.consent.dto.ai.MedicalQueryResponse;
import com.hospital.consent.entity.MedicalGlossary;

import java.util.List;

public interface LlmProvider {
    String getProviderName();
    boolean isAvailable();
    MedicalQueryResponse explainTerm(String sanitizedQuestion, String sanitizedConsentContext, List<MedicalGlossary> matchedGlossaryTerms);
}
