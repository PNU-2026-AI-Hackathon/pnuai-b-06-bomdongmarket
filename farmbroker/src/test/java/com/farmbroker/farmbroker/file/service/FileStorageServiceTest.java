package com.farmbroker.farmbroker.file.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.file.domain.UploadedFile;
import com.farmbroker.farmbroker.file.repository.UploadedFileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

// 업로드 저장소가 원본 파일명을 신뢰하지 않고, 허용 확장자만 받아들이며,
// 삭제는 업로더 본인에게만 허용하는지 검증한다. DB 없이 돌도록 레포지토리는 목으로 대체한다.
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FileStorageServiceTest {

    private static final long UPLOADER_ID = 7L;
    private static final long OTHER_USER_ID = 99L;

    @TempDir
    Path tempDir;

    @Mock
    UploadedFileRepository uploadedFileRepository;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(tempDir.toString(), uploadedFileRepository);
        service.createUploadDirectory();
    }

    private static MockMultipartFile image(String fileName) {
        return new MockMultipartFile("files", fileName, "image/jpeg", new byte[] {1, 2, 3});
    }

    private void givenStoredFileOwnedBy(String storedName, long uploaderId) {
        given(uploadedFileRepository.findByStoredName(storedName))
                .willReturn(Optional.of(UploadedFile.builder()
                        .storedName(storedName)
                        .originalName("정면.jpg")
                        .uploaderId(uploaderId)
                        .build()));
    }

    @Test
    void stores_file_under_generated_name() {
        String storedName = service.store(image("공실-정면.jpg"), UPLOADER_ID);

        assertTrue(storedName.matches("[0-9a-f]{32}\\.jpg"), "저장 파일명은 서버가 생성해야 합니다");
        assertTrue(Files.exists(tempDir.resolve(storedName)));
        assertEquals("image/jpeg", service.contentTypeOf(storedName));
    }

    @Test
    void records_uploader_so_delete_can_check_ownership() {
        service.store(image("공실-정면.jpg"), UPLOADER_ID);

        verify(uploadedFileRepository).save(any(UploadedFile.class));
    }

    @Test
    void rejects_unsupported_extension() {
        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.store(image("payload.svg"), UPLOADER_ID));

        assertEquals(ErrorCode.FILE_TYPE_NOT_SUPPORTED, caught.getErrorCode());
        verify(uploadedFileRepository, never()).save(any());
    }

    @Test
    void rejects_empty_file() {
        MockMultipartFile empty = new MockMultipartFile("files", "a.png", "image/png", new byte[0]);

        assertEquals(ErrorCode.FILE_EMPTY,
                assertThrows(BusinessException.class, () -> service.store(empty, UPLOADER_ID))
                        .getErrorCode());
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

    @Test
    void uploader_can_delete_own_file() throws IOException {
        String storedName = service.store(image("공실-정면.jpg"), UPLOADER_ID);
        givenStoredFileOwnedBy(storedName, UPLOADER_ID);

        service.delete(storedName, UPLOADER_ID);

        assertFalse(Files.exists(tempDir.resolve(storedName)), "디스크 파일이 지워져야 합니다");
        verify(uploadedFileRepository).delete(any(UploadedFile.class));
    }

    @Test
    void other_user_cannot_delete_someone_elses_file() {
        String storedName = service.store(image("공실-정면.jpg"), UPLOADER_ID);
        givenStoredFileOwnedBy(storedName, UPLOADER_ID);

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.delete(storedName, OTHER_USER_ID));

        assertEquals(ErrorCode.FILE_FORBIDDEN, caught.getErrorCode());
        assertTrue(Files.exists(tempDir.resolve(storedName)), "남의 파일은 지워지면 안 됩니다");
        verify(uploadedFileRepository, never()).delete(any());
    }

    @Test
    void delete_of_unknown_file_is_not_found() {
        String unknown = "1".repeat(32) + ".jpg";
        given(uploadedFileRepository.findByStoredName(unknown)).willReturn(Optional.empty());

        assertEquals(ErrorCode.FILE_NOT_FOUND,
                assertThrows(BusinessException.class, () -> service.delete(unknown, UPLOADER_ID))
                        .getErrorCode());
    }

    // 디스크 파일이 먼저 사라진 상태여도 업로드 기록은 정리되어야 한다.
    @Test
    void delete_succeeds_when_disk_file_already_gone() throws IOException {
        String storedName = service.store(image("공실-정면.jpg"), UPLOADER_ID);
        givenStoredFileOwnedBy(storedName, UPLOADER_ID);
        Files.delete(tempDir.resolve(storedName));

        service.delete(storedName, UPLOADER_ID);

        verify(uploadedFileRepository).delete(any(UploadedFile.class));
    }
}
