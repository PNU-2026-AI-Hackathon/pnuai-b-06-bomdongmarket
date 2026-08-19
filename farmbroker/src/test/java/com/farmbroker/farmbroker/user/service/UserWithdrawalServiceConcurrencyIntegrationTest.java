package com.farmbroker.farmbroker.user.service;

import com.farmbroker.farmbroker.common.config.JpaAuditingConfig;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.chat.service.ChatBlockService;
import com.farmbroker.farmbroker.matching.service.MatchingService;
import com.farmbroker.farmbroker.matching.support.SpaceContractAdapter;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.dto.SpaceUpdateRequest;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.space.service.SpaceService;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserWithdrawalRequest;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

// 서비스 AOP와 실제 H2 행 잠금을 함께 사용해, 탈퇴가 먼저 user PESSIMISTIC_WRITE 잠금을 잡았을 때
// 매칭·공간 쓰기가 탈퇴 후 상태를 되돌릴 수 없는지를 검증한다.
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
// MatchingService 는 재신청을 막을지 판단할 때 차단 여부를 묻는다(ChatBlockService).
@Import({UserService.class, MatchingService.class, SpaceService.class, SpaceContractAdapter.class,
        ChatBlockService.class, JpaAuditingConfig.class,
        UserWithdrawalServiceConcurrencyIntegrationTest.BlockingPasswordEncoderConfiguration.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class UserWithdrawalServiceConcurrencyIntegrationTest {

    private static final String WITHDRAW_PASSWORD = "withdraw-password";

    @Autowired private UserService userService;
    @Autowired private MatchingService matchingService;
    @Autowired private SpaceService spaceService;
    @Autowired private UserRepository userRepository;
    @Autowired private SpaceRepository spaceRepository;
    @Autowired private MatchingRepository matchingRepository;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private BlockingPasswordEncoder passwordEncoder;

    @Test
    void apply_waits_for_owner_withdrawal_and_cannot_insert_a_matching_after_commit() throws Exception {
        Long[] ids = seedOwnerFarmerSpace("apply");

        runWhileWithdrawalHoldsUserLock(ids[0], () -> matchingService.apply(ids[1], applyRequest(ids[2])), error -> {
            assertThat(error).isInstanceOf(BusinessException.class);
            inNewTransaction(() -> {
                assertThat(matchingRepository.findAllReceivedByOwnerId(ids[0])).isEmpty();
                Space space = spaceRepository.findById(ids[2]).orElseThrow();
                assertThat(space.isDeleted()).isTrue();
            });
        });
    }

    @Test
    void contract_agree_waits_for_owner_withdrawal_and_cannot_restore_an_active_contract() throws Exception {
        Long[] ids = seedRequestedMatching("agree-owner");

        runWhileWithdrawalHoldsUserLock(ids[0], () -> matchingService.agreeContract(ids[3], ids[0], 0), error -> {
            assertThat(error).isInstanceOf(BusinessException.class);
            assertNoAcceptedContract(ids[0], ids[1], ids[2], ids[3]);
        });
    }

    @Test
    void contract_agree_waits_for_farmer_withdrawal_and_cannot_restore_an_active_contract() throws Exception {
        Long[] ids = seedRequestedMatching("agree-farmer");

        runWhileWithdrawalHoldsUserLock(ids[1], () -> matchingService.agreeContract(ids[3], ids[0], 0), error -> {
            assertThat(error).isInstanceOf(BusinessException.class);
            assertNoAcceptedContract(ids[0], ids[1], ids[2], ids[3]);
        });
    }

    @Test
    void update_waits_for_owner_withdrawal_and_cannot_restore_space_details() throws Exception {
        Long[] ids = seedOwnerFarmerSpace("update");

        runWhileWithdrawalHoldsUserLock(ids[0], () -> spaceService.update(ids[0], ids[2], updateRequest()), error -> {
            assertThat(error).isInstanceOf(BusinessException.class);
            inNewTransaction(() -> {
                Space space = spaceRepository.findById(ids[2]).orElseThrow();
                assertThat(space.isDeleted()).isTrue();
                assertThat(space.getTitle()).isEqualTo("원래 공간 update");
            });
        });
    }

    @Test
    void delete_waits_for_owner_withdrawal_and_cannot_restore_space_visibility() throws Exception {
        Long[] ids = seedOwnerFarmerSpace("delete");

        runWhileWithdrawalHoldsUserLock(ids[0], () -> spaceService.delete(ids[0], ids[2]), error -> {
            assertThat(error).isInstanceOf(BusinessException.class);
            inNewTransaction(() -> {
                Space space = spaceRepository.findById(ids[2]).orElseThrow();
                assertThat(space.isDeleted()).isTrue();
            });
        });
    }

    private void assertNoAcceptedContract(Long ownerId, Long farmerId, Long spaceId, Long matchingId) {
        inNewTransaction(() -> {
            Matching matching = matchingRepository.findById(matchingId).orElseThrow();
            Space space = spaceRepository.findById(spaceId).orElseThrow();
            assertThat(matching.getStatus()).isNotEqualTo(MatchingStatus.ACCEPTED);
            assertThat(matchingRepository.countActiveContractsByUserId(ownerId)).isZero();
            assertThat(matchingRepository.countActiveContractsByUserId(farmerId)).isZero();
            assertThat(space.getStatus().name()).isNotEqualTo("MATCHED");
        });
    }

    private void runWhileWithdrawalHoldsUserLock(Long withdrawingUserId, ThrowingRunnable concurrentAction,
                                                   java.util.function.Consumer<Throwable> verifier) throws Exception {
        passwordEncoder.armWithdrawalBlock();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            UserWithdrawalRequest request = withdrawalRequest();
            Future<?> withdrawal = executor.submit(() -> userService.withdraw(withdrawingUserId, request));
            assertThat(passwordEncoder.awaitWithdrawalLock()).isTrue();

            CountDownLatch actionStarted = new CountDownLatch(1);
            Future<Throwable> action = executor.submit(() -> {
                actionStarted.countDown();
                try {
                    concurrentAction.run();
                    return null;
                } catch (Throwable error) {
                    return error;
                }
            });
            assertThat(actionStarted.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(action.isDone()).isFalse();

            passwordEncoder.releaseWithdrawal();
            withdrawal.get(5, TimeUnit.SECONDS);
            verifier.accept(action.get(5, TimeUnit.SECONDS));
        } finally {
            passwordEncoder.releaseWithdrawal();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }

    private Long[] seedOwnerFarmerSpace(String suffix) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            User owner = saveUser("owner-" + suffix + "@example.com", "소유자");
            User farmer = saveUser("farmer-" + suffix + "@example.com", "농부");
            Space space = spaceRepository.save(newSpace(owner, "원래 공간 " + suffix));
            return new Long[] {owner.getId(), farmer.getId(), space.getId()};
        });
    }

    private Long[] seedRequestedMatching(String suffix) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            User owner = saveUser("owner-" + suffix + "@example.com", "소유자");
            User farmer = saveUser("farmer-" + suffix + "@example.com", "농부");
            Space space = spaceRepository.save(newSpace(owner, "수락 대기 공간 " + suffix));
            Matching matching = matchingRepository.save(Matching.builder()
                    .space(space)
                    .farmer(farmer)
                    .message("수락 대기")
                    .build());
            return new Long[] {owner.getId(), farmer.getId(), space.getId(), matching.getId()};
        });
    }

    private User saveUser(String email, String nickname) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode(WITHDRAW_PASSWORD))
                .nickname(nickname)
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

    private MatchingApplyRequest applyRequest(Long spaceId) throws Exception {
        return new ObjectMapper().readValue("""
                {"spaceId":%d,"message":"신청합니다"}
                """.formatted(spaceId), MatchingApplyRequest.class);
    }

    private SpaceUpdateRequest updateRequest() throws Exception {
        return new ObjectMapper().readValue("""
                {"title":"탈퇴 뒤에는 반영되면 안 되는 제목"}
                """, SpaceUpdateRequest.class);
    }

    private UserWithdrawalRequest withdrawalRequest() throws Exception {
        return new ObjectMapper().readValue("""
                {"currentPassword":"withdraw-password","agreement":true}
                """, UserWithdrawalRequest.class);
    }

    private void inNewTransaction(Runnable assertion) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> assertion.run());
    }

    @FunctionalInterface
    private interface ThrowingRunnable {
        void run() throws Exception;
    }

    @TestConfiguration
    static class BlockingPasswordEncoderConfiguration {

        @Bean
        @Primary
        BlockingPasswordEncoder blockingPasswordEncoder() {
            return new BlockingPasswordEncoder();
        }
    }

    static class BlockingPasswordEncoder implements PasswordEncoder {

        private final PasswordEncoder delegate = new BCryptPasswordEncoder();
        private volatile CountDownLatch withdrawalLock = new CountDownLatch(0);
        private volatile CountDownLatch releaseWithdrawal = new CountDownLatch(0);

        void armWithdrawalBlock() {
            withdrawalLock = new CountDownLatch(1);
            releaseWithdrawal = new CountDownLatch(1);
        }

        boolean awaitWithdrawalLock() throws InterruptedException {
            return withdrawalLock.await(5, TimeUnit.SECONDS);
        }

        void releaseWithdrawal() {
            releaseWithdrawal.countDown();
        }

        @Override
        public String encode(CharSequence rawPassword) {
            return delegate.encode(rawPassword);
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            if (WITHDRAW_PASSWORD.contentEquals(rawPassword) && withdrawalLock.getCount() > 0) {
                withdrawalLock.countDown();
                try {
                    if (!releaseWithdrawal.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("탈퇴 잠금 해제 대기 시간이 초과되었습니다.");
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(e);
                }
            }
            return delegate.matches(rawPassword, encodedPassword);
        }
    }
}
