package com.hospital.consent.service.storage;

import com.hospital.consent.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    @TempDir
    Path tempStorageDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempStorageDir.toString());
    }

    @Test
    @DisplayName("Should successfully store valid text document and calculate SHA-256")
    void testStoreValidDocument() {
        byte[] content = "Patient Lab Results: Normal hemodynamics and blood counts.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lab_results.txt",
                "text/plain",
                content
        );

        FileStorageService.StoredFileResult result = fileStorageService.storeFile(file);

        assertNotNull(result);
        assertEquals("lab_results.txt", result.originalFilename());
        assertTrue(result.storedFilename().contains("lab_results.txt"));
        assertEquals("text/plain", result.mimeType());
        assertNotNull(result.checksumSha256());
        assertEquals(64, result.checksumSha256().length()); // SHA-256 hex is 64 chars
    }

    @Test
    @DisplayName("Should reject disallowed file extension (.exe)")
    void testRejectDangerousExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                new byte[]{0x4D, 0x5A} // MZ executable header
        );

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(file)
        );

        assertTrue(exception.getMessage().contains("File extension .exe is not permitted"));
    }

    @Test
    @DisplayName("Should block path traversal attempts in filename")
    void testRejectPathTraversal() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../../secret.txt",
                "text/plain",
                "test data".getBytes()
        );

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(file)
        );

        assertTrue(exception.getMessage().contains("invalid path sequence"));
    }
}
