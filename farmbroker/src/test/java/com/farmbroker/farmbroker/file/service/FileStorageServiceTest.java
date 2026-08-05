package com.farmbroker.farmbroker.file.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// 업로드 저장소가 원본 파일명을 신뢰하지 않고, 허용 확장자만 받아들이는지 검증한다.
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(tempDir.toString());
        service.createUploadDirectory();
    }

    private static MockMultipartFile image(String fileName) {
        return new MockMultipartFile("files", fileName, "image/jpeg", new byte[] {1, 2, 3});
    }

    @Test
    void stores_file_under_generated_name() throws IOException {
        String storedName = service.store(image("공실-정면.jpg"));

        assertTrue(storedName.matches("[0-9a-f]{32}\\.jpg"), "저장 파일명은 서버가 생성해야 합니다");
        assertTrue(Files.exists(tempDir.resolve(storedName)));
        assertEquals("image/jpeg", service.contentTypeOf(storedName));
    }

    @Test
    void rejects_unsupported_extension() {
        BusinessException caught =
                assertThrows(BusinessException.class, () -> service.store(image("payload.svg")));

        assertEquals(ErrorCode.FILE_TYPE_NOT_SUPPORTED, caught.getErrorCode());
    }

    @Test
    void rejects_empty_file() {
        MockMultipartFile empty = new MockMultipartFile("files", "a.png", "image/png", new byte[0]);

        assertEquals(ErrorCode.FILE_EMPTY,
                assertThrows(BusinessException.class, () -> service.store(empty)).getErrorCode());
    }

    @Test
    void rejects_path_traversal_on_lookup() {
        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.resolveStoredFile("../application.yml"));

        assertEquals(ErrorCode.FILE_NOT_FOUND, caught.getErrorCode());
    }

    @Test
    void rejects_lookup_of_missing_file() {
        String missing = "0".repeat(32) + ".jpg";

        assertEquals(ErrorCode.FILE_NOT_FOUND,
                assertThrows(BusinessException.class, () -> service.resolveStoredFile(missing))
                        .getErrorCode());
    }
}
