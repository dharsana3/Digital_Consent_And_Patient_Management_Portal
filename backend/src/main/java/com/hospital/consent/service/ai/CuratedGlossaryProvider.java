package com.hospital.consent.service.ai;

import com.hospital.consent.dto.ai.GlossaryItemDto;
import com.hospital.consent.dto.ai.MedicalQueryResponse;
import com.hospital.consent.entity.MedicalGlossary;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component("glossaryProvider")
public class CuratedGlossaryProvider implements LlmProvider {

    @Override
    public String getProviderName() {
        return "CURATED_GLOSSARY_ENGINE (Offline & Private)";
    }

    @Override
    public boolean isAvailable() {
        return true; // Always operational without external network or API key dependencies
    }

    @Override
    public MedicalQueryResponse explainTerm(
            String sanitizedQuestion,
            String sanitizedConsentContext,
            List<MedicalGlossary> matchedGlossaryTerms) {

        List<GlossaryItemDto> glossaryDtos = matchedGlossaryTerms.stream().map(g -> new GlossaryItemDto(
                g.getId(),
                g.getTerm(),
                g.getCategory(),
                g.getDefinition(),
                g.getLaymanExplanation(),
                g.getPatientTakeaway(),
                g.getQuestionsToAskDoctor()
        )).collect(Collectors.toList());

        List<String> suggestedQuestions = new ArrayList<>();
        StringBuilder answerBuilder = new StringBuilder();
        StringBuilder laymanBuilder = new StringBuilder();

        boolean hasContext = sanitizedConsentContext != null && !sanitizedConsentContext.isBlank();

        if (!matchedGlossaryTerms.isEmpty()) {
            MedicalGlossary primaryTerm = matchedGlossaryTerms.get(0);

            answerBuilder.append("### Plain English Explanation: **").append(primaryTerm.getTerm()).append("**\n\n");
            answerBuilder.append(primaryTerm.getLaymanExplanation()).append("\n\n");

            answerBuilder.append("**Clinical Definition:**\n");
            answerBuilder.append(primaryTerm.getDefinition()).append("\n\n");

            if (primaryTerm.getPatientTakeaway() != null) {
                answerBuilder.append("**What this means for you:**\n");
                answerBuilder.append(primaryTerm.getPatientTakeaway()).append("\n\n");
            }

            laymanBuilder.append(primaryTerm.getLaymanExplanation());

            if (hasContext) {
                answerBuilder.append("**Context within your Consent Form:**\n");
                answerBuilder.append("This term is standard clinical terminology included in hospital consent disclosures to ensure transparency regarding proposed interventions, technique, and safety precautions. ");
                answerBuilder.append("Please review the complete disclosures with your attending doctor.\n\n");
            }

            // Extract doctor questions
            for (MedicalGlossary term : matchedGlossaryTerms) {
                if (term.getQuestionsToAskDoctor() != null && !term.getQuestionsToAskDoctor().isBlank()) {
                    suggestedQuestions.add(term.getQuestionsToAskDoctor());
                }
            }
        } else {
            // General medical assistant guidance when exact keyword is not in glossary
            answerBuilder.append("### Understanding Your Consent Inquiry\n\n");
            answerBuilder.append("You asked: *\"").append(sanitizedQuestion).append("\"*\n\n");
            answerBuilder.append("While this specific phrasing is not indexed in the verified offline dictionary, here are general guidelines for reviewing procedure terms in medical consent forms:\n\n");
            answerBuilder.append("1. **Medical Root Words:** Many complex terms describe body parts (e.g., 'Arthro' = joint, 'Cardio' = heart) combined with standard actions ('-ectomy' = removal, '-plasty' = repair or replacement, '-scopy' = viewing with a camera).\n");
            answerBuilder.append("2. **Risks and Precautions:** Any risks listed in your consent form represent possibilities that the surgical and anesthesia team are actively prepared to monitor, prevent, and treat.\n");
            answerBuilder.append("3. **Your Autonomy:** You have the legal and medical right to have every sentence in your consent form explained until you feel completely comfortable.\n\n");

            laymanBuilder.append("Medical terminology can sound overwhelming. Always feel empowered to ask your surgical team to rephrase any unclear medical terms before signing.");

            suggestedQuestions.add("Could you explain this procedure step in everyday language?");
            suggestedQuestions.add("What are the most common versus rare side effects associated with this?");
            suggestedQuestions.add("Are there any non-surgical alternatives I should consider?");
        }

        if (suggestedQuestions.isEmpty()) {
            suggestedQuestions.add("How does this procedure or terminology apply specifically to my health history?");
            suggestedQuestions.add("What precautions is the hospital team taking to minimize this risk?");
        }

        return new MedicalQueryResponse(
                sanitizedQuestion,
                answerBuilder.toString(),
                laymanBuilder.toString(),
                glossaryDtos,
                suggestedQuestions,
                getProviderName(),
                hasContext
        );
    }
}
