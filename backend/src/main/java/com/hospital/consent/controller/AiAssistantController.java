package com.hospital.consent.controller;

import com.hospital.consent.dto.ai.GlossaryItemDto;
import com.hospital.consent.dto.ai.MedicalQueryRequest;
import com.hospital.consent.dto.ai.MedicalQueryResponse;
import com.hospital.consent.dto.common.ApiResponse;
import com.hospital.consent.security.UserPrincipal;
import com.hospital.consent.service.ai.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Medical-Term Assistant", description = "Endpoints for patient medical terminology explanations and curated clinical glossary")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/ask")
    @Operation(summary = "Ask the AI Medical Assistant to explain unfamiliar medical terms in simple language")
    public ResponseEntity<ApiResponse<MedicalQueryResponse>> askQuestion(
            @Valid @RequestBody MedicalQueryRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        MedicalQueryResponse response = aiAssistantService.answerInquiry(request, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Explanation generated successfully", response));
    }

    @GetMapping("/glossary")
    @Operation(summary = "Search or list curated medical terminology glossary")
    public ResponseEntity<ApiResponse<List<GlossaryItemDto>>> searchGlossary(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {
        List<GlossaryItemDto> results = aiAssistantService.searchGlossary(query, category);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/glossary/categories")
    @Operation(summary = "Retrieve all medical glossary categories")
    public ResponseEntity<ApiResponse<List<String>>> getGlossaryCategories() {
        List<String> categories = aiAssistantService.getGlossaryCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(",")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
