package com.farmbroker.farmbroker.file.service;

import com.farmbroker.farmbroker.common.config.JpaAuditingConfig;
import com.farmbroker.farmbroker.common.config.PasswordEncoderConfig;
import com.farmbroker.farmbroker.file.domain.UploadedFile;
import com.farmbroker.farmbroker.file.repository.UploadedFileRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceFloorPlan;
import com.farmbroker.farmbroker.space.domain.SpaceImage;
import com.farmbroker.farmbroker.space.repository.SpaceFloorPlanRepository;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserWithdrawalRequest;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.farmbroker.farmbroker.user.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// UserService 이벤트 발행부터 AFTER_COMMIT listener의 REQUIRES_NEW 정리까지 실제 트랜잭션으로 검증한다.
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({UserService.class, WithdrawalFileCleanupService.class, PasswordEncoderConfig.class, JpaAuditingConfig.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WithdrawalFileCleanupJpaIntegrationTest {

    private static final Path UPLOAD_DIR = createUploadDir();

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private SpaceRepository spaceRepository;
    @Autowired private SpaceImageRepository spaceImageRepository;
    @Autowired private SpaceFloorPlanRepository spaceFloorPlanRepository;
    @Autowired private UploadedFileRepository uploadedFileRepository;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @DynamicPropertySource
    static void uploadDirectory(DynamicPropertyRegistry registry) {
        registry.add("file.upload-dir", () -> UPLOAD_DIR.toString());
    }

    @AfterAll
    static void removeUploadDir() throws IOException {
        try (var paths = Files.walk(UPLOAD_DIR)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    throw new IllegalStateException(e);
                }
            });
        }
    }

    @Test
    void committed_withdrawal_preserves_globally_referenced_uploads_and_deletes_orphans() throws Exception {
        Long userId = inNewTransaction(() -> {
            User user = saveUser("cleanup-commit@example.com");
            UploadedFile image = saveUpload(user.getId(), "referenced-image.jpg");
            UploadedFile floorPlan = saveUpload(user.getId(), "referenced-floor-plan.jpg");
            UploadedFile orphan = saveUpload(user.getId(), "orphan.jpg");
            write(image.getStoredName());
            write(floorPlan.getStoredName());
            write(orphan.getStoredName());

            Space space = spaceRepository.save(newSpace(user, "참조 이력 공간"));
            spaceImageRepository.save(SpaceImage.builder()
                    .space(space)
                    .imageUrl(fileUrl(image.getStoredName()))
                    .sortOrder(0)
                    .build());
            spaceFloorPlanRepository.save(SpaceFloorPlan.builder()
                    .space(space)
                    .imageUrl(fileUrl(floorPlan.getStoredName()))
                    .sortOrder(0)
                    .build());
            return user.getId();
        });

        userService.withdraw(userId, withdrawalRequest());

        inNewTransaction(() -> {
            assertThat(Files.exists(UPLOAD_DIR.resolve("referenced-image.jpg"))).isTrue();
            assertThat(Files.exists(UPLOAD_DIR.resolve("referenced-floor-plan.jpg"))).isTrue();
            assertThat(Files.exists(UPLOAD_DIR.resolve("orphan.jpg"))).isFalse();
            assertThat(uploadedFileRepository.findByStoredName("referenced-image.jpg")).isPresent();
            assertThat(uploadedFileRepository.findByStoredName("referenced-floor-plan.jpg")).isPresent();
            assertThat(uploadedFileRepository.findByStoredName("orphan.jpg")).isEmpty();
        });
    }

    @Test
    void committed_withdrawal_keeps_metadata_when_physical_delete_fails() throws Exception {
        Long userId = inNewTransaction(() -> {
            User user = saveUser("cleanup-failure@example.com");
            UploadedFile uploaded = saveUpload(user.getId(), "not-empty-directory");
            Path directory = UPLOAD_DIR.resolve(uploaded.getStoredName());
            Files.createDirectory(directory);
            Files.write(directory.resolve("child"), new byte[] {1});
            return user.getId();
        });

        userService.withdraw(userId, withdrawalRequest());

        inNewTransaction(() -> {
            assertThat(Files.isDirectory(UPLOAD_DIR.resolve("not-empty-directory"))).isTrue();
            assertThat(uploadedFileRepository.findByStoredName("not-empty-directory")).isPresent();
        });
    }

    @Test
    void rollback_does_not_publish_cleanup_event_or_delete_orphan_uploads() throws Exception {
        Long[] ids = inNewTransaction(() -> {
            User user = saveUser("cleanup-rollback@example.com");
            UploadedFile orphan = saveUpload(user.getId(), "rollback-orphan.jpg");
            write(orphan.getStoredName());
            User conflict = saveUser("withdrawn-" + user.getId() + "@withdrawn.local");
            return new Long[] {user.getId(), conflict.getId()};
        });

        assertThatThrownBy(() -> userService.withdraw(ids[0], withdrawalRequest()))
                .isInstanceOf(RuntimeException.class);

        inNewTransaction(() -> {
            assertThat(Files.exists(UPLOAD_DIR.resolve("rollback-orphan.jpg"))).isTrue();
            assertThat(uploadedFileRepository.findByStoredName("rollback-orphan.jpg")).isPresent();
            User active = userRepository.findById(ids[0]).orElseThrow();
            assertThat(active.getWithdrawnAt()).isNull();
        });
    }

    private User saveUser(String email) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("current-password"))
                .nickname("회원")
                .build());
    }

    private UploadedFile saveUpload(Long userId, String storedName) {
        return uploadedFileRepository.save(UploadedFile.builder()
                .storedName(storedName)
                .originalName(storedName)
                .uploaderId(userId)
                .build());
    }

    private Space newSpace(User owner, String title) {
        return Space.builder()
                .owner(owner)
                .title(title)
                .address("부산광역시")
                .area(BigDecimal.TEN)
                .monthlyRent(100000)
                .hasWater(true)
                .hasElectricity(true)
                .hasVentilation(true)
                .build();
    }

    private String fileUrl(String storedName) {
        return "http://localhost:8080/api/files/" + storedName;
    }

    private void write(String storedName) throws IOException {
        Files.write(UPLOAD_DIR.resolve(storedName), new byte[] {1});
    }

    private UserWithdrawalRequest withdrawalRequest() throws Exception {
        return new ObjectMapper().readValue("""
                {"currentPassword":"current-password","agreement":true}
                """, UserWithdrawalRequest.class);
    }

    private <T> T inNewTransaction(java.util.concurrent.Callable<T> callback) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            try {
                return callback.call();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        });
    }

    private void inNewTransaction(ThrowingRunnable assertion) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            try {
                assertion.run();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        });
    }

    @FunctionalInterface
    private interface ThrowingRunnable {
        void run() throws Exception;
    }

    private static Path createUploadDir() {
        try {
            return Files.createTempDirectory("withdrawal-file-cleanup-");
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }
}
