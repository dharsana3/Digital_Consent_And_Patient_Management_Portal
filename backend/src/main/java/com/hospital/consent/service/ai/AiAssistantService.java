package com.hospital.consent.service.ai;

import com.hospital.consent.dto.ai.GlossaryItemDto;
import com.hospital.consent.dto.ai.MedicalQueryRequest;
import com.hospital.consent.dto.ai.MedicalQueryResponse;
import com.hospital.consent.entity.Consent;
import com.hospital.consent.entity.MedicalGlossary;
import com.hospital.consent.enums.Role;
import com.hospital.consent.exception.RateLimitExceededException;
import com.hospital.consent.exception.ResourceNotFoundException;
import com.hospital.consent.repository.ConsentRepository;
import com.hospital.consent.repository.MedicalGlossaryRepository;
import com.hospital.consent.security.RateLimitingService;
import com.hospital.consent.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiAssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AiAssistantService.class);

    private final CuratedGlossaryProvider glossaryProvider;
    private final ExternalApiLlmProvider externalLlmProvider;
    private final MedicalGlossaryRepository glossaryRepository;
    private final ConsentRepository consentRepository;
    private final PromptSanitizer promptSanitizer;
    private final RateLimitingService rateLimitingService;

    public AiAssistantService(
            CuratedGlossaryProvider glossaryProvider,
            ExternalApiLlmProvider externalLlmProvider,
            MedicalGlossaryRepository glossaryRepository,
            ConsentRepository consentRepository,
            PromptSanitizer promptSanitizer,
            RateLimitingService rateLimitingService) {
        this.glossaryProvider = glossaryProvider;
        this.externalLlmProvider = externalLlmProvider;
        this.glossaryRepository = glossaryRepository;
        this.consentRepository = consentRepository;
        this.promptSanitizer = promptSanitizer;
        this.rateLimitingService = rateLimitingService;
    }

    @Transactional(readOnly = true)
    public MedicalQueryResponse answerInquiry(MedicalQueryRequest request, UserPrincipal currentUser, String clientIp) {
        if (!rateLimitingService.tryConsumeAi(clientIp)) {
            throw new RateLimitExceededException("AI Assistant rate limit reached. Please wait a moment before sending more queries.");
        }

        String sanitizedQuestion = promptSanitizer.sanitizeInput(request.getQuestion());

        String consentContext = null;
        if (request.getConsentId() != null) {
            Consent consent = consentRepository.findById(request.getConsentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consent form not found with ID: " + request.getConsentId()));

            // Authorization check
            if (currentUser.getRole() == Role.PATIENT) {
                if (!consent.getPatient().getUser().getId().equals(currentUser.getId())) {
                    throw new AccessDeniedException("Access denied: You cannot ask questions regarding another patient's consent form");
                }
            }

            consentContext = promptSanitizer.sanitizeConsentContext(
                    "Procedure: " + consent.getProcedureName() + "\n" +
                    "Description: " + consent.getProcedureDescription() + "\n" +
                    "Disclosures: " + consent.getConsentText() + "\n" +
                    (consent.getRisksAndAlternatives() != null ? "Risks & Alternatives: " + consent.getRisksAndAlternatives() : "")
            );
        }

        // Match terms in knowledge base
        List<MedicalGlossary> matchedTerms = findMatchingTerms(sanitizedQuestion, consentContext);

        // Try external LLM if configured; otherwise use offline glossary engine
        if (externalLlmProvider.isAvailable()) {
            try {
                return externalLlmProvider.explainTerm(sanitizedQuestion, consentContext, matchedTerms);
            } catch (Exception ex) {
                logger.warn("Falling back to curated offline glossary engine due to external LLM provider issue: {}", ex.getMessage());
            }
        }

        return glossaryProvider.explainTerm(sanitizedQuestion, consentContext, matchedTerms);
    }

    @Transactional(readOnly = true)
    public List<GlossaryItemDto> searchGlossary(String query, String category) {
        List<MedicalGlossary> list;
        if (query != null && !query.isBlank()) {
            list = glossaryRepository.searchTerms(query.trim());
        } else if (category != null && !category.isBlank()) {
            list = glossaryRepository.findByCategoryIgnoreCase(category.trim());
        } else {
            list = glossaryRepository.findAll();
        }

        return list.stream().map(g -> new GlossaryItemDto(
                g.getId(),
                g.getTerm(),
                g.getCategory(),
                g.getDefinition(),
                g.getLaymanExplanation(),
                g.getPatientTakeaway(),
                g.getQuestionsToAskDoctor()
        )).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getGlossaryCategories() {
        return glossaryRepository.findDistinctCategories();
    }

    private List<MedicalGlossary> findMatchingTerms(String question, String consentContext) {
        List<MedicalGlossary> allTerms = glossaryRepository.findAll();
        Set<MedicalGlossary> matched = new LinkedHashSet<>();

        String lowerQuestion = question.toLowerCase();

        // 1. Direct search in question
        for (MedicalGlossary item : allTerms) {
            String lowerTerm = item.getTerm().toLowerCase();
            if (lowerQuestion.contains(lowerTerm) || lowerTerm.contains(lowerQuestion)) {
                matched.add(item);
            }
        }

        // 2. Keyword/word boundary search
        String[] words = lowerQuestion.split("[^a-zA-Z0-9]+");
        for (String word : words) {
            if (word.length() > 4) {
                for (MedicalGlossary item : allTerms) {
                    if (item.getTerm().toLowerCase().contains(word) || item.getCategory().toLowerCase().contains(word)) {
                        matched.add(item);
                    }
                }
            }
        }

        // 3. If consent context exists and matches are few, search terms present in consent context
        if (matched.size() < 3 && consentContext != null) {
            String lowerContext = consentContext.toLowerCase();
            for (MedicalGlossary item : allTerms) {
                if (lowerContext.contains(item.getTerm().toLowerCase())) {
                    matched.add(item);
                    if (matched.size() >= 5) break;
                }
            }
        }

        return new ArrayList<>(matched);
    }
}
