package com.farmbroker.farmbroker.file.service;

import com.farmbroker.farmbroker.file.domain.UploadedFile;
import com.farmbroker.farmbroker.file.repository.UploadedFileRepository;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.space.repository.SpaceFloorPlanRepository;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WithdrawalFileCleanupServiceTest {

    private static final long USER_ID = 9L;

    @TempDir Path tempDir;
    @Mock UploadedFileRepository uploadedFileRepository;
    @Mock SpaceImageRepository spaceImageRepository;
    @Mock SpaceFloorPlanRepository spaceFloorPlanRepository;
    @Mock ProductRepository productRepository;
    @Mock PlatformTransactionManager transactionManager;

    @Test
    void preserves_file_and_metadata_when_any_space_history_references_it() throws IOException {
        String storedName = "a".repeat(32) + ".jpg";
        Files.write(tempDir.resolve(storedName), new byte[] {1});
        given(uploadedFileRepository.findAllByUploaderId(USER_ID)).willReturn(List.of(uploaded(storedName)));
        given(spaceImageRepository.findAllImageUrls()).willReturn(List.of("http://localhost:8080/api/files/" + storedName));
        given(spaceFloorPlanRepository.findAllImageUrls()).willReturn(List.of());

        service(tempDir).cleanupUnreferencedByUploader(USER_ID);

        assertThat(Files.exists(tempDir.resolve(storedName))).isTrue();
        verify(uploadedFileRepository, never()).delete(any());
    }

    @Test
    void deletes_unreferenced_file_and_metadata_after_withdrawal_commit() throws IOException {
        String storedName = "b".repeat(32) + ".jpg";
        UploadedFile uploaded = uploaded(storedName);
        Files.write(tempDir.resolve(storedName), new byte[] {1});
        given(uploadedFileRepository.findAllByUploaderId(USER_ID)).willReturn(List.of(uploaded));
        given(spaceImageRepository.findAllImageUrls()).willReturn(List.of());
        given(spaceFloorPlanRepository.findAllImageUrls()).willReturn(List.of());

        service(tempDir).cleanupUnreferencedByUploader(USER_ID);

        assertThat(Files.exists(tempDir.resolve(storedName))).isFalse();
        verify(uploadedFileRepository).delete(uploaded);
    }

    @Test
    void preserves_file_when_an_active_product_references_it() throws IOException {
        String storedName = "d".repeat(32) + ".jpg";
        Files.write(tempDir.resolve(storedName), new byte[] {1});
        given(uploadedFileRepository.findAllByUploaderId(USER_ID)).willReturn(List.of(uploaded(storedName)));
        given(spaceImageRepository.findAllImageUrls()).willReturn(List.of());
        given(spaceFloorPlanRepository.findAllImageUrls()).willReturn(List.of());
        given(productRepository.existsByImageUrlEndingWithAndDeletedFalse("/files/" + storedName))
                .willReturn(true);

        service(tempDir).cleanupUnreferencedByUploader(USER_ID);

        assertThat(Files.exists(tempDir.resolve(storedName))).isTrue();
        verify(uploadedFileRepository, never()).delete(any());
    }

    @Test
    void preserves_metadata_when_physical_deletion_fails_for_retry() throws IOException {
        String storedName = "c".repeat(32) + ".jpg";
        Path nonDirectory = tempDir.resolve("not-a-directory");
        Files.write(nonDirectory, new byte[] {1});
        UploadedFile uploaded = uploaded(storedName);
        given(uploadedFileRepository.findAllByUploaderId(USER_ID)).willReturn(List.of(uploaded));
        given(spaceImageRepository.findAllImageUrls()).willReturn(List.of());
        given(spaceFloorPlanRepository.findAllImageUrls()).willReturn(List.of());

        service(nonDirectory).cleanupUnreferencedByUploader(USER_ID);

        verify(uploadedFileRepository, never()).delete(uploaded);
    }

    private WithdrawalFileCleanupService service(Path uploadDir) {
        return new WithdrawalFileCleanupService(uploadDir.toString(), uploadedFileRepository,
                spaceImageRepository, spaceFloorPlanRepository, productRepository, transactionManager);
    }

    private UploadedFile uploaded(String storedName) {
        return UploadedFile.builder().storedName(storedName).originalName("테스트.jpg").uploaderId(USER_ID).build();
    }
}
