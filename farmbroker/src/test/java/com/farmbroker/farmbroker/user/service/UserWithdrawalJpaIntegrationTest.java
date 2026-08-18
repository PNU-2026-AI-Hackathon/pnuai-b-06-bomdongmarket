package com.farmbroker.farmbroker.user.service;

import com.farmbroker.farmbroker.ai.domain.AiRecommendation;
import com.farmbroker.farmbroker.ai.domain.RecommendedCrop;
import com.farmbroker.farmbroker.ai.repository.AiRecommendationRepository;
import com.farmbroker.farmbroker.common.config.JpaAuditingConfig;
import com.farmbroker.farmbroker.common.config.PasswordEncoderConfig;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.order.domain.WishlistItem;
import com.farmbroker.farmbroker.order.domain.Order;
import com.farmbroker.farmbroker.order.domain.OrderItem;
import com.farmbroker.farmbroker.order.repository.WishlistItemRepository;
import com.farmbroker.farmbroker.order.repository.OrderRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserWithdrawalRequest;
import com.farmbroker.farmbroker.user.dto.UserUpdateRequest;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// 실제 Hibernate/H2에서 벌크 매칭 정리 뒤의 사용자 비식별화와 AI cascade 삭제를 함께 검증한다.
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({UserService.class, PasswordEncoderConfig.class, JpaAuditingConfig.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class UserWithdrawalJpaIntegrationTest {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private SpaceRepository spaceRepository;
    @Autowired private MatchingRepository matchingRepository;
    @Autowired private AiRecommendationRepository aiRecommendationRepository;
    @Autowired private WishlistItemRepository wishlistItemRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private PlatformTransactionManager transactionManager;

    @Test
    void withdrawal_persists_anonymization_after_bulk_matching_cleanup_and_deletes_own_ai_recommendations() throws Exception {
        Long userId = seedWithdrawalData("member@example.com");

        userService.withdraw(userId, withdrawalRequest());

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            User withdrawn = userRepository.findById(userId).orElseThrow();
            assertThat(withdrawn.getWithdrawnAt()).isNotNull();
            assertThat(withdrawn.getEmail()).isEqualTo("withdrawn-" + userId + "@withdrawn.local");
            assertThat(matchingRepository.findAllByFarmerIdOrderByCreatedAtDesc(userId))
                    .extracting(Matching::getStatus)
                    .containsExactly(MatchingStatus.CANCELED);
            assertThat(spaceRepository.findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(userId)).isEmpty();
            assertThat(aiRecommendationRepository.findAllByUserId(userId)).isEmpty();
        });
    }

    @Test
    void withdrawal_rolls_back_bulk_cleanup_when_anonymized_email_conflicts() throws Exception {
        Long userId = seedWithdrawalData("rollback@example.com");
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> userRepository.save(User.builder()
                .email("withdrawn-" + userId + "@withdrawn.local")
                .password("hashed")
                .nickname("기존 계정")
                .build()));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> userService.withdraw(userId, withdrawalRequest()))
                .isInstanceOf(RuntimeException.class);

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            User active = userRepository.findById(userId).orElseThrow();
            assertThat(active.getWithdrawnAt()).isNull();
            assertThat(active.getEmail()).isEqualTo("rollback@example.com");
            assertThat(matchingRepository.findAllByFarmerIdOrderByCreatedAtDesc(userId))
                    .extracting(Matching::getStatus)
                    .containsExactly(MatchingStatus.REQUESTED);
            assertThat(spaceRepository.findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(userId)).hasSize(1);
            assertThat(aiRecommendationRepository.findAllByUserId(userId)).hasSize(1);
        });
    }

    @Test
    void withdrawal_clears_cart_hides_products_and_preserves_anonymized_order_history() throws Exception {
        Long[] ids = new TransactionTemplate(transactionManager).execute(status -> {
            User user = userRepository.save(User.builder()
                    .email("market-withdrawal@example.com")
                    .password(passwordEncoder.encode("current-password"))
                    .nickname("판매자")
                    .build());
            Product product = productRepository.save(Product.builder()
                    .seller(user)
                    .name("상추")
                    .category(ProductCategory.LEAFY)
                    .price(3000)
                    .unit("팩")
                    .stock(5)
                    .harvestDate(LocalDate.of(2026, 8, 15))
                    .producerName("판매자")
                    .productionLocation("부산 스마트팜")
                    .build());
            wishlistItemRepository.save(WishlistItem.builder().user(user).product(product).build());
            Order order = new Order(user);
            order.addItem(new OrderItem(product, 1));
            orderRepository.save(order);
            return new Long[] {user.getId(), product.getId(), order.getId()};
        });

        userService.withdraw(ids[0], withdrawalRequest());

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            assertThat(wishlistItemRepository.findByUserIdOrderByCreatedAtAsc(ids[0])).isEmpty();
            assertThat(productRepository.findById(ids[1]).orElseThrow().isDeleted()).isTrue();
            assertThat(orderRepository.findByBuyerIdOrderByCreatedAtDesc(ids[0]))
                    .extracting(Order::getId)
                    .containsExactly(ids[2]);
            assertThat(userRepository.findById(ids[0]).orElseThrow().getWithdrawnAt()).isNotNull();
        });
    }

    @Test
    void active_user_lock_makes_concurrent_application_recheck_after_withdrawal() throws Exception {
        Long userId = new TransactionTemplate(transactionManager).execute(status -> userRepository.save(User.builder()
                .email("concurrent@example.com")
                .password("hashed")
                .nickname("동시성")
                .build()).getId());
        CountDownLatch withdrawalLockAcquired = new CountDownLatch(1);
        CountDownLatch finishWithdrawal = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> withdrawal = executor.submit(() -> new TransactionTemplate(transactionManager)
                    .executeWithoutResult(status -> {
                        User user = userRepository.findActiveByIdForUpdate(userId).orElseThrow();
                        withdrawalLockAcquired.countDown();
                        await(finishWithdrawal);
                        user.withdraw("withdrawn-" + userId + "@withdrawn.local", "anonymized-password");
                    }));
            assertThat(withdrawalLockAcquired.await(5, TimeUnit.SECONDS)).isTrue();

            // MatchingService.apply도 동일한 findActiveByIdForUpdate를 첫 단계에서 호출한다.
            Future<Boolean> applicationActiveCheck = executor.submit(() -> new TransactionTemplate(transactionManager)
                    .execute(status -> userRepository.findActiveByIdForUpdate(userId).isPresent()));
            assertThat(applicationActiveCheck.isDone()).isFalse();

            finishWithdrawal.countDown();
            withdrawal.get(5, TimeUnit.SECONDS);
            assertThat(applicationActiveCheck.get(5, TimeUnit.SECONDS)).isFalse();
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void profile_update_waits_for_withdrawal_and_cannot_restore_personal_data() throws Exception {
        Long userId = new TransactionTemplate(transactionManager).execute(status -> userRepository.save(User.builder()
                .email("profile-race@example.com")
                .password("hashed")
                .nickname("기존닉네임")
                .build()).getId());
        CountDownLatch withdrawalLockAcquired = new CountDownLatch(1);
        CountDownLatch finishWithdrawal = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> withdrawal = executor.submit(() -> new TransactionTemplate(transactionManager)
                    .executeWithoutResult(status -> {
                        User user = userRepository.findActiveByIdForUpdate(userId).orElseThrow();
                        withdrawalLockAcquired.countDown();
                        await(finishWithdrawal);
                        user.withdraw("withdrawn-" + userId + "@withdrawn.local", "anonymized-password");
                    }));
            assertThat(withdrawalLockAcquired.await(5, TimeUnit.SECONDS)).isTrue();
            Future<Throwable> update = executor.submit(() -> {
                try {
                    userService.updateMe(userId, profileUpdateRequest());
                    return null;
                } catch (Throwable error) {
                    return error;
                }
            });

            finishWithdrawal.countDown();
            withdrawal.get(5, TimeUnit.SECONDS);
            assertThat(update.get(5, TimeUnit.SECONDS)).isNotNull();
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                User withdrawn = userRepository.findById(userId).orElseThrow();
                assertThat(withdrawn.getNickname()).isEqualTo("탈퇴한 사용자");
                assertThat(withdrawn.getWithdrawnAt()).isNotNull();
            });
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void active_contract_count_blocks_both_farmer_and_owner_but_closed_space_ends_it() {
        Long[] ids = new TransactionTemplate(transactionManager).execute(status -> {
            User owner = userRepository.save(User.builder().email("owner-contract@example.com").password("hashed").nickname("소유자").build());
            User farmer = userRepository.save(User.builder().email("farmer-contract@example.com").password("hashed").nickname("농부").build());
            Space space = spaceRepository.save(newSpace(owner, "계약 공간"));
            space.markMatched();
            Matching matching = Matching.builder().space(space).farmer(farmer).message("수락됨").build();
            matching.accept();
            matchingRepository.save(matching);
            return new Long[] {owner.getId(), farmer.getId(), space.getId()};
        });

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            assertThat(matchingRepository.countActiveContractsByUserId(ids[0])).isEqualTo(1L);
            assertThat(matchingRepository.countActiveContractsByUserId(ids[1])).isEqualTo(1L);
            Space space = spaceRepository.findById(ids[2]).orElseThrow();
            space.changeStatus(com.farmbroker.farmbroker.space.domain.SpaceStatus.CLOSED);
        });
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            assertThat(matchingRepository.countActiveContractsByUserId(ids[0])).isZero();
            assertThat(matchingRepository.countActiveContractsByUserId(ids[1])).isZero();
        });
    }

    @Test
    void owner_withdrawal_serializes_a_new_inbound_application_before_it_can_be_inserted() throws Exception {
        Long[] ids = new TransactionTemplate(transactionManager).execute(status -> {
            User owner = userRepository.save(User.builder().email("owner-race@example.com").password("hashed").nickname("소유자").build());
            User farmer = userRepository.save(User.builder().email("farmer-race@example.com").password("hashed").nickname("농부").build());
            Space space = spaceRepository.save(newSpace(owner, "신청 대상 공간"));
            return new Long[] {owner.getId(), farmer.getId(), space.getId()};
        });
        CountDownLatch locksAcquired = new CountDownLatch(1);
        CountDownLatch finishWithdrawal = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> withdrawal = executor.submit(() -> new TransactionTemplate(transactionManager)
                    .executeWithoutResult(status -> {
                        User owner = userRepository.findActiveByIdForUpdate(ids[0]).orElseThrow();
                        spaceRepository.findActiveByOwnerIdForUpdate(ids[0]);
                        locksAcquired.countDown();
                        await(finishWithdrawal);
                        owner.withdraw("withdrawn-" + ids[0] + "@withdrawn.local", "anonymized-password");
                    }));
            assertThat(locksAcquired.await(5, TimeUnit.SECONDS)).isTrue();
            Future<Boolean> applicationCanProceed = executor.submit(() -> new TransactionTemplate(transactionManager)
                    .execute(status -> {
                        spaceRepository.findById(ids[2]).orElseThrow(); // apply의 owner 식별용 사전 조회
                        return userRepository.findActiveByIdForUpdate(ids[0]).isPresent();
                    }));
            finishWithdrawal.countDown();
            withdrawal.get(5, TimeUnit.SECONDS);
            assertThat(applicationCanProceed.get(5, TimeUnit.SECONDS)).isFalse();
            new TransactionTemplate(transactionManager).executeWithoutResult(status ->
                    assertThat(matchingRepository.findAllReceivedByOwnerId(ids[0])).isEmpty());
        } finally {
            executor.shutdownNow();
        }
    }

    private Long seedWithdrawalData(String email) {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        return transaction.execute(status -> {
            User user = userRepository.save(User.builder()
                    .email(email)
                    .password(passwordEncoder.encode("current-password"))
                    .nickname("회원")
                    .build());
            Space space = spaceRepository.save(newSpace(user, "탈퇴 대상 공간"));
            matchingRepository.save(Matching.builder()
                    .space(space)
                    .farmer(user)
                    .message("대기 중 신청")
                    .build());
            AiRecommendation recommendation = AiRecommendation.builder()
                    .space(space)
                    .user(user)
                    .model("test-model")
                    .build();
            recommendation.addRecommendedCrop(RecommendedCrop.builder()
                    .cropName("상추")
                    .reason("테스트")
                    .displayOrder(0)
                    .build());
            aiRecommendationRepository.save(recommendation);
            return user.getId();
        });
    }

    private UserWithdrawalRequest withdrawalRequest() throws Exception {
        return new ObjectMapper().readValue("""
                {"currentPassword":"current-password","agreement":true}
                """, UserWithdrawalRequest.class);
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

    private UserUpdateRequest profileUpdateRequest() throws Exception {
        return new ObjectMapper().readValue("""
                {"nickname":"새닉네임"}
                """, UserUpdateRequest.class);
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("동시성 테스트가 시간 안에 진행되지 않았습니다.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    }
}
