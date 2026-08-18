package com.farmbroker.farmbroker.user.service;

import com.farmbroker.farmbroker.ai.repository.AiRecommendationRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.order.repository.WishlistItemRepository;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserUpdateRequest;
import com.farmbroker.farmbroker.user.dto.UserWithdrawalRequest;
import com.farmbroker.farmbroker.user.dto.WithdrawalEligibilityResponse;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.context.ApplicationEventPublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.inOrder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final long USER_ID = 7L;

    @Mock private UserRepository userRepository;
    @Mock private MatchingRepository matchingRepository;
    @Mock private SpaceRepository spaceRepository;
    @Mock private AiRecommendationRepository aiRecommendationRepository;
    @Mock private WishlistItemRepository wishlistItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private EntityManager entityManager;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ApplicationEventPublisher eventPublisher;

    @Test
    void updates_nickname_without_changing_password() throws Exception {
        User user = activeUser();
        given(userRepository.findActiveByIdForUpdate(USER_ID)).willReturn(Optional.of(user));

        UserService service = service();
        var response = service.updateMe(USER_ID, updateRequest("새 닉네임", null, null));

        assertThat(response.getNickname()).isEqualTo("새 닉네임");
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void rejects_password_change_without_matching_current_password() throws Exception {
        User user = activeUser();
        given(userRepository.findActiveByIdForUpdate(USER_ID)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrong-password", "hashed-password")).willReturn(false);

        assertThatThrownBy(() -> service().updateMe(USER_ID,
                updateRequest("닉네임", "wrong-password", "new-password")))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_CURRENT_PASSWORD);
    }

    @Test
    void reports_active_contract_as_not_withdrawable() {
        given(userRepository.findByIdAndWithdrawnAtIsNull(USER_ID)).willReturn(Optional.of(activeUser()));
        given(matchingRepository.countActiveContractsByUserId(USER_ID)).willReturn(1L);

        WithdrawalEligibilityResponse response = service().getWithdrawalEligibility(USER_ID);

        assertThat(response.withdrawable()).isFalse();
        assertThat(response.activeContractCount()).isEqualTo(1L);
        assertThat(response.reason()).isEqualTo("ACTIVE_CONTRACT_EXISTS");
    }

    @Test
    void blocks_withdrawal_before_mutating_related_data_when_active_contract_exists() throws Exception {
        User user = activeUser();
        given(userRepository.findActiveByIdForUpdate(USER_ID)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("current-password", "hashed-password")).willReturn(true);
        given(matchingRepository.findRequestedForWithdrawalByUserIdForUpdate(USER_ID)).willReturn(List.of());
        given(matchingRepository.findActiveContractsByUserIdForUpdate(USER_ID))
                .willReturn(List.of(mock(com.farmbroker.farmbroker.matching.domain.Matching.class)));

        assertThatThrownBy(() -> service().withdraw(USER_ID, withdrawalRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.ACTIVE_CONTRACT_EXISTS);

        verify(matchingRepository, never()).cancelRequestedByFarmerId(anyLong(), any());
        verify(spaceRepository, never()).findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(anyLong());
    }

    @Test
    void withdraws_after_cleaning_matchings_spaces_cart_products_and_own_recommendations() throws Exception {
        User user = activeUser();
        Space space = Space.builder().owner(user).title("공실").build();
        given(userRepository.findActiveByIdForUpdate(USER_ID)).willReturn(Optional.of(user));
        given(userRepository.findByIdAndWithdrawnAtIsNull(USER_ID)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("current-password", "hashed-password")).willReturn(true);
        given(passwordEncoder.encode(any())).willReturn("anonymized-password");
        given(matchingRepository.findRequestedForWithdrawalByUserIdForUpdate(USER_ID)).willReturn(List.of());
        given(matchingRepository.findActiveContractsByUserIdForUpdate(USER_ID)).willReturn(List.of());
        given(spaceRepository.findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(USER_ID)).willReturn(List.of(space));
        given(aiRecommendationRepository.findAllByUserId(USER_ID)).willReturn(List.of());

        service().withdraw(USER_ID, withdrawalRequest());

        assertThat(user.getEmail()).isEqualTo("withdrawn-7@withdrawn.local");
        assertThat(user.getNickname()).isEqualTo("탈퇴한 사용자");
        assertThat(user.getWithdrawnAt()).isNotNull();
        assertThat(space.isDeleted()).isTrue();
        var order = inOrder(matchingRepository);
        order.verify(matchingRepository).findRequestedForWithdrawalByUserIdForUpdate(USER_ID);
        order.verify(matchingRepository).findActiveContractsByUserIdForUpdate(USER_ID);
        var withdrawalOrder = inOrder(spaceRepository, matchingRepository);
        withdrawalOrder.verify(spaceRepository).findActiveByOwnerIdForUpdate(USER_ID);
        withdrawalOrder.verify(matchingRepository).findRequestedForWithdrawalByUserIdForUpdate(USER_ID);
        verify(matchingRepository).cancelRequestedByFarmerId(anyLong(), any());
        verify(matchingRepository).rejectRequestedBySpaceOwnerId(anyLong(), any());
        verify(aiRecommendationRepository).deleteAll(List.of());
        verify(wishlistItemRepository).deleteByUserId(USER_ID);
        verify(productRepository).findActiveBySellerIdForUpdate(USER_ID);
    }

    private UserService service() {
        return new UserService(userRepository, matchingRepository, spaceRepository,
                aiRecommendationRepository, wishlistItemRepository, productRepository,
                entityManager, passwordEncoder, eventPublisher);
    }

    private User activeUser() {
        User user = User.builder()
                .email("member@example.com")
                .password("hashed-password")
                .nickname("회원")
                .build();
        setField(user, "id", USER_ID);
        return user;
    }

    private UserUpdateRequest updateRequest(String nickname, String currentPassword, String newPassword) throws Exception {
        return new ObjectMapper().readValue("""
                {"nickname":"%s","currentPassword":%s,"newPassword":%s}
                """.formatted(nickname, jsonString(currentPassword), jsonString(newPassword)), UserUpdateRequest.class);
    }

    private UserWithdrawalRequest withdrawalRequest() throws Exception {
        return new ObjectMapper().readValue("""
                {"currentPassword":"current-password","agreement":true}
                """, UserWithdrawalRequest.class);
    }

    private String jsonString(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private void setField(Object target, String name, Object value) {
        try {
            var field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
