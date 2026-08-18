package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
public class ChatImageStorage {

    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );
    private static final Map<String, Set<String>> ACCEPTED_ORIGINAL_EXTENSIONS = Map.of(
            "image/jpeg", Set.of(".jpg", ".jpeg"),
            "image/png", Set.of(".png"),
            "image/webp", Set.of(".webp")
    );

    private final Path uploadDir;

    public ChatImageStorage(@Value("${file.chat-upload-dir:./uploads/chat}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    void initialize() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("채팅 이미지 디렉터리를 만들지 못했습니다.", e);
        }
    }

    public StoredImage store(MultipartFile image) {
        validate(image);
        String contentType = image.getContentType();
        String storedName = UUID.randomUUID() + EXTENSIONS.get(contentType);
        String originalName = sanitizeOriginalName(image.getOriginalFilename());
        Path target = resolve(storedName);
        try {
            Files.copy(image.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
        }
        return new StoredImage(storedName, originalName, contentType, image.getSize());
    }

    public Resource load(String storedName) {
        Path path = resolve(storedName);
        if (!Files.isRegularFile(path)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        try {
            return new UrlResource(path.toUri());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
    }

    public void deleteQuietly(String storedName) {
        if (storedName == null) {
            return;
        }
        try {
            Files.deleteIfExists(resolve(storedName));
        } catch (IOException ignored) {
            // DB 저장 실패 정리 과정에서는 원래 예외를 보존한다.
        }
    }

    private void validate(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }
        if (image.getSize() > MAX_IMAGE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }
        if (!EXTENSIONS.containsKey(image.getContentType())) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
        }
        String originalName = image.getOriginalFilename();
        String extension = originalName == null ? "" : extensionOf(originalName.toLowerCase());
        if (!ACCEPTED_ORIGINAL_EXTENSIONS.get(image.getContentType()).contains(extension)) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
        }
    }

    private Path resolve(String storedName) {
        Path resolved = uploadDir.resolve(storedName).normalize();
        if (!resolved.startsWith(uploadDir)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return resolved;
    }

    private String sanitizeOriginalName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "image";
        }
        String normalized = originalName.replace('\\', '/');
        String sanitized = normalized.substring(normalized.lastIndexOf('/') + 1);
        return sanitized.length() <= 255 ? sanitized : sanitized.substring(sanitized.length() - 255);
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot);
    }

    public record StoredImage(String storedName, String originalName, String contentType, long size) {
    }
}
