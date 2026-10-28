package com.hospital.consent.service.storage;

import com.hospital.consent.exception.BadRequestException;
import com.hospital.consent.exception.FileStorageException;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final Path fileStorageLocation;
    private final Tika tika = new Tika();

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "png", "jpg", "jpeg", "tiff", "tif", "txt", "docx"
    );

    private static final Set<String> ALLOWED_MIME_PREFIXES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/tiff",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    public record StoredFileResult(
            String originalFilename,
            String storedFilename,
            String storagePath,
            long fileSizeBytes,
            String mimeType,
            String checksumSha256
    ) {}

    public FileStorageService(@Value("${app.storage.local-directory:./storage/uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new FileStorageException("Could not initialize local private document storage directory: " + fileStorageLocation, ex);
        }
    }

    public StoredFileResult storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Cannot upload an empty file");
        }

        String rawOriginalFilename = file.getOriginalFilename();
        if (rawOriginalFilename == null || rawOriginalFilename.isBlank()) {
            rawOriginalFilename = "document_" + System.currentTimeMillis();
        }

        // Validate filename for path traversal sequences
        if (rawOriginalFilename.contains("..") || rawOriginalFilename.contains("/") || rawOriginalFilename.contains("\\")) {
            throw new BadRequestException("Filename contains invalid path sequence: " + rawOriginalFilename);
        }
        String cleanOriginalFilename = Paths.get(rawOriginalFilename).getFileName().toString();

        // Validate extension
        String extension = getFileExtension(cleanOriginalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("File extension ." + extension + " is not permitted. Permitted formats: PDF, PNG, JPG, JPEG, TIFF, TXT, DOCX");
        }

        // Validate content-type with Apache Tika magic bytes
        String detectedMimeType;
        try (InputStream is = file.getInputStream()) {
            detectedMimeType = tika.detect(is, cleanOriginalFilename);
        } catch (IOException ex) {
            throw new FileStorageException("Failed to inspect file magic bytes for security verification", ex);
        }

        boolean isMimeAllowed = ALLOWED_MIME_PREFIXES.stream().anyMatch(detectedMimeType::equalsIgnoreCase);
        if (!isMimeAllowed) {
            throw new BadRequestException("Security alert: File content type (" + detectedMimeType + ") does not match allowed safe medical document types");
        }

        // Compute SHA-256 and generate unique stored filename
        String storedFilename = UUID.randomUUID().toString() + "_" + cleanOriginalFilename;
        Path targetLocation = this.fileStorageLocation.resolve(storedFilename).normalize();

        if (!targetLocation.startsWith(this.fileStorageLocation)) {
            throw new BadRequestException("Cannot store file outside current storage directory");
        }

        String checksumSha256;
        try (InputStream is = file.getInputStream()) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            checksumSha256 = HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException | IOException ex) {
            throw new FileStorageException("Failed to calculate SHA-256 checksum for document", ex);
        }

        try (InputStream is = file.getInputStream()) {
            Files.copy(is, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new FileStorageException("Failed to persist file to secure storage location", ex);
        }

        return new StoredFileResult(
                cleanOriginalFilename,
                storedFilename,
                targetLocation.toString(),
                file.getSize(),
                detectedMimeType,
                checksumSha256
        );
    }

    public Resource loadFileAsResource(String storedFilename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(storedFilename).normalize();
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new BadRequestException("Invalid file path request");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileStorageException("File not found or unreadable: " + storedFilename);
            }
        } catch (MalformedURLException ex) {
            throw new FileStorageException("File URL resolution error: " + storedFilename, ex);
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1 || lastIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastIndex + 1);
    }
}
