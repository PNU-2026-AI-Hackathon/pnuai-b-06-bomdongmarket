package com.farmbroker.farmbroker.user.service;

import com.farmbroker.farmbroker.ai.repository.AiRecommendationRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.order.repository.WishlistItemRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserUpdateRequest;
import com.farmbroker.farmbroker.user.dto.UserResponse;
import com.farmbroker.farmbroker.user.dto.UserWithdrawalRequest;
import com.farmbroker.farmbroker.user.dto.WithdrawalEligibilityResponse;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// 유저 도메인 비즈니스 로직 서비스.
// JWT 필터가 SecurityContext에 저장한 userId를 받아 DB에서 유저를 조회하고
// 응답 DTO로 변환해 반환한다. 유저가 없으면 USER_NOT_FOUND(404)를 던진다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final MatchingRepository matchingRepository;
    private final SpaceRepository spaceRepository;
    private final AiRecommendationRepository aiRecommendationRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    public UserResponse getMe(Long userId) {
        User user = userRepository.findByIdAndWithdrawnAtIsNull(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateMe(Long userId, UserUpdateRequest request) {
        User user = getActiveUserForUpdate(userId);
        if (request.changesPassword()) {
            if (request.getCurrentPassword() == null
                    || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BusinessException(ErrorCode.INVALID_CURRENT_PASSWORD);
            }
            user.changePassword(passwordEncoder.encode(request.getNewPassword()));
        }
        user.updateNickname(request.getNickname());
        return UserResponse.from(user);
    }

    public WithdrawalEligibilityResponse getWithdrawalEligibility(Long userId) {
        getActiveUser(userId);
        return WithdrawalEligibilityResponse.from(matchingRepository.countActiveContractsByUserId(userId));
    }

    @Transactional
    public void withdraw(Long userId, UserWithdrawalRequest request) {
        // 신청 생성도 같은 사용자 행을 먼저 잠근다. 탈퇴가 먼저 완료되면 신규 신청은 활성 사용자 조회에서 거부된다.
        User user = getActiveUserForUpdate(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CURRENT_PASSWORD);
        }

        // 신청 생성은 farmer → owner → space 순서로 잠근다. owner 탈퇴도 owner → space 순서로 잠가 교착을 피한다.
        spaceRepository.findActiveByOwnerIdForUpdate(userId);
        // 매칭 수락도 같은 행을 비관적으로 잠근다. 수락이 먼저 끝나면 아래 재검사에서 차단되고,
        // 탈퇴가 먼저 잠그면 REQUESTED 정리 후 수락은 이미 처리된 신청으로 거부된다.
        matchingRepository.findRequestedForWithdrawalByUserIdForUpdate(userId);
        if (!matchingRepository.findActiveContractsByUserIdForUpdate(userId).isEmpty()) {
            throw new BusinessException(ErrorCode.ACTIVE_CONTRACT_EXISTS);
        }

        LocalDateTime now = LocalDateTime.now();
        matchingRepository.cancelRequestedByFarmerId(userId, now);
        matchingRepository.rejectRequestedBySpaceOwnerId(userId, now);
        // 잠금 조회로 영속성 컨텍스트에 들어온 REQUESTED 엔티티가 bulk UPDATE 결과를 덮어쓰지 않게 한다.
        // DB 행 잠금은 트랜잭션 종료까지 유지되므로 clear 후에도 수락/탈퇴 경합 보호는 유지된다.
        entityManager.clear();
        User withdrawingUser = getActiveUser(userId);
        spaceRepository.findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(userId)
                .forEach(Space::softDelete);
        wishlistItemRepository.deleteByUserId(userId);
        productRepository.findActiveBySellerIdForUpdate(userId).forEach(Product::softDelete);
        aiRecommendationRepository.deleteAll(aiRecommendationRepository.findAllByUserId(userId));
        withdrawingUser.withdraw("withdrawn-" + withdrawingUser.getId() + "@withdrawn.local",
                passwordEncoder.encode("withdrawn-" + withdrawingUser.getId()));
        eventPublisher.publishEvent(new UserWithdrawnEvent(userId));
    }

    private User getActiveUser(Long userId) {
        return userRepository.findByIdAndWithdrawnAtIsNull(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private User getActiveUserForUpdate(Long userId) {
        return userRepository.findActiveByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
