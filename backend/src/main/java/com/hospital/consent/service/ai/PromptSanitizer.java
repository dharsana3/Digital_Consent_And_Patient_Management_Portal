package com.hospital.consent.service.ai;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class PromptSanitizer {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");
    private static final Pattern SSN_PATTERN = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");
    private static final Pattern INJECTION_PATTERN = Pattern.compile(
            "(?i)(ignore\\s+(all\\s+)?(previous|prior)\\s+instructions|system\\s+prompt|disregard|you\\s+are\\s+now\\s+in\\s+developer\\s+mode|jailbreak|bypass\\s+guardrails)"
    );

    public String sanitizeInput(String input) {
        if (input == null) return "";

        String sanitized = EMAIL_PATTERN.matcher(input).replaceAll("[REDACTED_EMAIL]");
        sanitized = PHONE_PATTERN.matcher(sanitized).replaceAll("[REDACTED_PHONE]");
        sanitized = SSN_PATTERN.matcher(sanitized).replaceAll("[REDACTED_IDENTIFIER]");

        // Neutralize prompt injection phrases
        sanitized = INJECTION_PATTERN.matcher(sanitized).replaceAll("[FILTERED_COMMAND]");

        return sanitized.trim();
    }

    public String sanitizeConsentContext(String consentText) {
        if (consentText == null) return "";
        // Strip potential patient identifiers and limit length to reasonable excerpt for token efficiency
        String sanitized = sanitizeInput(consentText);
        if (sanitized.length() > 3000) {
            sanitized = sanitized.substring(0, 3000) + "... [truncated for brevity]";
        }
        return sanitized;
    }
}
