package com.farmbroker.farmbroker.file.service;

import com.farmbroker.farmbroker.file.domain.UploadedFile;
import com.farmbroker.farmbroker.file.repository.UploadedFileRepository;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.space.repository.SpaceFloorPlanRepository;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.user.service.UserWithdrawnEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;

// 파일 시스템은 DB 트랜잭션에 참여할 수 없으므로, 탈퇴 커밋 이후에만 best-effort로 정리한다.
// 전역 공간 이미지/도면과 활성 상품의 문자열 참조를 먼저 확인해 사용 중인 파일은 절대 지우지 않는다.
@Service
@Slf4j
public class WithdrawalFileCleanupService {

    private final Path uploadDir;
    private final UploadedFileRepository uploadedFileRepository;
    private final SpaceImageRepository spaceImageRepository;
    private final SpaceFloorPlanRepository spaceFloorPlanRepository;
    private final ProductRepository productRepository;
    private final TransactionTemplate cleanupTransaction;

    public WithdrawalFileCleanupService(@Value("${file.upload-dir}") String uploadDir,
                                        UploadedFileRepository uploadedFileRepository,
                                        SpaceImageRepository spaceImageRepository,
                                        SpaceFloorPlanRepository spaceFloorPlanRepository,
                                        ProductRepository productRepository,
                                        PlatformTransactionManager transactionManager) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.uploadedFileRepository = uploadedFileRepository;
        this.spaceImageRepository = spaceImageRepository;
        this.spaceFloorPlanRepository = spaceFloorPlanRepository;
        this.productRepository = productRepository;
        this.cleanupTransaction = new TransactionTemplate(transactionManager);
        this.cleanupTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        try {
            cleanupTransaction.executeWithoutResult(status -> cleanupUnreferencedByUploader(event.userId()));
        } catch (RuntimeException e) {
            // 탈퇴 커밋은 이미 완료됐다. 후처리 실패가 API 성공/실패를 뒤집지 않도록 로그만 남긴다.
            log.warn("탈퇴 업로드 후처리에 실패했습니다. 메타데이터를 남겨 다음 정리를 허용합니다: {}", event.userId(), e);
        }
    }

    public void cleanupUnreferencedByUploader(Long userId) {
        Set<String> referencedUrls = new HashSet<>(spaceImageRepository.findAllImageUrls());
        referencedUrls.addAll(spaceFloorPlanRepository.findAllImageUrls());

        for (UploadedFile uploaded : uploadedFileRepository.findAllByUploaderId(userId)) {
            if (isReferenced(referencedUrls, uploaded.getStoredName())
                    || productRepository.existsByImageUrlEndingWithAndDeletedFalse(fileUrl(uploaded.getStoredName()))) {
                continue;
            }
            Path file = uploadDir.resolve(uploaded.getStoredName()).normalize();
            if (!file.startsWith(uploadDir)) {
                log.warn("탈퇴 업로드 정리 중 허용되지 않은 파일명을 건너뜁니다: {}", uploaded.getStoredName());
                continue;
            }
            try {
                Files.deleteIfExists(file);
                uploadedFileRepository.delete(uploaded);
            } catch (IOException e) {
                // 파일 삭제가 실패하면 메타데이터도 남겨 후속 재시도가 가능하도록 한다.
                log.warn("탈퇴 업로드 파일 삭제에 실패해 메타데이터를 보존합니다: {}", uploaded.getStoredName(), e);
            }
        }
    }

    private boolean isReferenced(Set<String> urls, String storedName) {
        return urls.stream().anyMatch(url -> url != null && url.endsWith(fileUrl(storedName)));
    }

    private String fileUrl(String storedName) {
        return "/files/" + storedName;
    }
}
