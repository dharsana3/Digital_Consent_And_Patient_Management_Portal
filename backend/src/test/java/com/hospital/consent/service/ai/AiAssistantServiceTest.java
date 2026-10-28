package com.hospital.consent.service.ai;

import com.hospital.consent.dto.ai.MedicalQueryRequest;
import com.hospital.consent.dto.ai.MedicalQueryResponse;
import com.hospital.consent.entity.MedicalGlossary;
import com.hospital.consent.entity.User;
import com.hospital.consent.enums.Role;
import com.hospital.consent.repository.ConsentRepository;
import com.hospital.consent.repository.MedicalGlossaryRepository;
import com.hospital.consent.security.RateLimitingService;
import com.hospital.consent.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAssistantServiceTest {

    @Mock
    private MedicalGlossaryRepository glossaryRepository;

    @Mock
    private ConsentRepository consentRepository;

    @Mock
    private ExternalApiLlmProvider externalLlmProvider;

    @Mock
    private RateLimitingService rateLimitingService;

    private CuratedGlossaryProvider glossaryProvider;
    private PromptSanitizer promptSanitizer;
    private AiAssistantService aiAssistantService;

    private UserPrincipal testPatientPrincipal;

    @BeforeEach
    void setUp() {
        glossaryProvider = new CuratedGlossaryProvider();
        promptSanitizer = new PromptSanitizer();

        aiAssistantService = new AiAssistantService(
                glossaryProvider,
                externalLlmProvider,
                glossaryRepository,
                consentRepository,
                promptSanitizer,
                rateLimitingService
        );

        when(rateLimitingService.tryConsumeAi(anyString())).thenReturn(true);
        when(externalLlmProvider.isAvailable()).thenReturn(false); // test offline engine

        User user = new User("John Doe", "john@example.com", "hash", Role.PATIENT);
        user.setId(10L);
        testPatientPrincipal = UserPrincipal.create(user);
    }

    @Test
    @DisplayName("Should explain medical term using curated offline glossary without external API")
    void testExplainKnownMedicalTerm() {
        MedicalGlossary glossary = new MedicalGlossary(
                "General Anesthesia",
                "Anesthesiology",
                "Induced loss of consciousness.",
                "Deep sleep where you do not feel pain during surgery.",
                "You need a ride home after surgery.",
                "How long will I be asleep?"
        );
        glossary.setId(1L);

        when(glossaryRepository.findAll()).thenReturn(List.of(glossary));

        MedicalQueryRequest request = new MedicalQueryRequest(null, "What does general anesthesia mean in my surgery?");
        MedicalQueryResponse response = aiAssistantService.answerInquiry(request, testPatientPrincipal, "127.0.0.1");

        assertNotNull(response);
        assertNotNull(response.getAnswer());
        assertTrue(response.getAnswer().contains("Deep sleep where you do not feel pain"));
        assertFalse(response.getMatchedGlossaryTerms().isEmpty());
        assertEquals("General Anesthesia", response.getMatchedGlossaryTerms().get(0).getTerm());
        assertNotNull(response.getDisclaimer());
        assertTrue(response.getDisclaimer().contains("IMPORTANT MEDICAL DISCLAIMER"));
        assertTrue(response.getProviderUsed().contains("CURATED_GLOSSARY_ENGINE"));
    }

    @Test
    @DisplayName("Should sanitize PII such as email and phone from patient inquiry before processing")
    void testSanitizePiiInInquiry() {
        MedicalGlossary glossary = new MedicalGlossary(
                "Infection Risk",
                "Surgical Risks",
                "Risk of microbial colonization.",
                "Chance of germs entering the wound.",
                "Keep the wound clean.",
                "How should I change dressings?"
        );
        when(glossaryRepository.findAll()).thenReturn(List.of(glossary));

        MedicalQueryRequest request = new MedicalQueryRequest(
                null,
                "Can you tell me about infection risk? Call me at 555-123-4567 or email john@test.com"
        );

        MedicalQueryResponse response = aiAssistantService.answerInquiry(request, testPatientPrincipal, "127.0.0.1");

        assertNotNull(response);
        assertFalse(response.getQuestion().contains("555-123-4567"));
        assertFalse(response.getQuestion().contains("john@test.com"));
        assertTrue(response.getQuestion().contains("[REDACTED_PHONE]"));
        assertTrue(response.getQuestion().contains("[REDACTED_EMAIL]"));
    }

    @Test
    @DisplayName("Should return structured guidance and disclaimer when term is not directly in glossary")
    void testExplainUnknownTerm() {
        when(glossaryRepository.findAll()).thenReturn(List.of());

        MedicalQueryRequest request = new MedicalQueryRequest(null, "What does hypercholesterolemia mean?");
        MedicalQueryResponse response = aiAssistantService.answerInquiry(request, testPatientPrincipal, "127.0.0.1");

        assertNotNull(response);
        assertTrue(response.getAnswer().contains("Understanding Your Consent Inquiry"));
        assertNotNull(response.getDisclaimer());
        assertFalse(response.getSuggestedDoctorQuestions().isEmpty());
    }
}
