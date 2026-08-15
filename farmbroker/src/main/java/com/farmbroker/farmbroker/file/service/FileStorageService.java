package com.farmbroker.farmbroker.file.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.file.domain.UploadedFile;
import com.farmbroker.farmbroker.file.repository.UploadedFileRepository;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

// 업로드된 이미지를 로컬 디스크에 저장하고 다시 읽어주는 저장소.
// Space 도메인은 여전히 URL 문자열만 보관하므로(SpaceImage) 이 서비스는 URL 발급까지만 책임진다.
// 저장 파일명은 서버가 UUID로 새로 만든다 — 사용자가 보낸 이름을 그대로 쓰면 경로 조작과 덮어쓰기가 가능하다.
@Service
public class FileStorageService {

    public static final int MAX_UPLOAD_COUNT = 10;
    public static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    // UploadedFile.originalName 컬럼 길이와 맞춘다.
    private static final int ORIGINAL_NAME_MAX_LENGTH = 255;

    // 확장자 → Content-Type. 이 목록에 없는 확장자는 저장 자체를 거부한다.
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "gif", "image/gif");

    // 서버가 만든 이름만 조회를 허용해 ../ 같은 경로 조작을 원천 차단한다.
    private static final Pattern STORED_FILE_NAME = Pattern.compile("[0-9a-f]{32}\\.[a-z]{3,4}");

    private final Path uploadDir;
    private final UploadedFileRepository uploadedFileRepository;
    private final UserRepository userRepository;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDir,
                              UploadedFileRepository uploadedFileRepository,
                              UserRepository userRepository) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.uploadedFileRepository = uploadedFileRepository;
        this.userRepository = userRepository;
    }

    @PostConstruct
    void createUploadDirectory() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("업로드 디렉터리를 만들지 못했습니다: " + uploadDir, e);
        }
    }

    // 저장 후 조회에 사용할 파일명을 돌려준다. 공개 URL 조립은 컨트롤러가 담당한다.
    // 업로더를 함께 기록해 두어야 나중에 삭제 권한을 판단할 수 있다.
    @Transactional
    public String store(MultipartFile file, Long uploaderId) {
        if (userRepository.findActiveByIdForUpdate(uploaderId).isEmpty()) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }

        String extension = extensionOf(file.getOriginalFilename());
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + extension;

        try {
            Files.copy(file.getInputStream(), uploadDir.resolve(storedName),
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
        }

        uploadedFileRepository.save(UploadedFile.builder()
                .storedName(storedName)
                .originalName(originalNameOf(file))
                .uploaderId(uploaderId)
                .build());
        return storedName;
    }

    // 업로더 본인만 삭제할 수 있다. 이름이 UUID라도 공개 URL로 노출되므로 소유자 확인이 필요하다.
    // 디스크 파일이 이미 없더라도 기록만 남은 상태를 정리할 수 있게 삭제를 계속 진행한다.
    @Transactional
    public void delete(String fileName, Long userId) {
        UploadedFile uploaded = uploadedFileRepository.findByStoredName(fileName)
                .orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        if (!uploaded.isUploadedBy(userId)) {
            throw new BusinessException(ErrorCode.FILE_FORBIDDEN);
        }

        Path file = uploadDir.resolve(fileName).normalize();
        if (!file.startsWith(uploadDir)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
        }
        uploadedFileRepository.delete(uploaded);
    }

    // 원본 파일명은 표시용이며 컬럼 길이를 넘지 않도록 자른다.
    private String originalNameOf(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            return "unknown";
        }
        return name.length() > ORIGINAL_NAME_MAX_LENGTH
                ? name.substring(0, ORIGINAL_NAME_MAX_LENGTH)
                : name;
    }

    public Path resolveStoredFile(String fileName) {
        if (fileName == null || !STORED_FILE_NAME.matcher(fileName).matches()) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        Path file = uploadDir.resolve(fileName).normalize();
        if (!file.startsWith(uploadDir) || !Files.isRegularFile(file)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return file;
    }

    public String contentTypeOf(String fileName) {
        return ALLOWED_TYPES.get(extensionOf(fileName));
    }

    // 선언된 Content-Type은 클라이언트가 위조할 수 있으므로 확장자를 기준으로 판단한다.
    private String extensionOf(String originalFilename) {
        String extension = StringUtils.getFilenameExtension(originalFilename);
        if (extension == null) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
        }
        String normalized = extension.toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.containsKey(normalized)) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
        }
        return normalized;
    }
}
