package com.farmbroker.farmbroker.matching.service;

import com.farmbroker.farmbroker.chat.service.ChatBlockService;
import com.farmbroker.farmbroker.matching.domain.MaintenanceFeePayer;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingType;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.matching.repository.MatchingParticipantProjection;
import com.farmbroker.farmbroker.matching.support.SpaceContractAdapter;
import com.farmbroker.farmbroker.matching.support.SpaceSummary;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceStatus;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.inOrder;

// 매칭의 역할 정책을 검증한다.
// 신청은 역할을 요구하지 않고(요구하면 농부가 될 방법이 없어진다),
// 양측이 계약에 동의해 재배가 확정되는 시점에 신청자가 FARMER 역할을 얻는다.
// DB 없이 돌도록 레포지토리·어댑터는 목으로 대체한다.
@ExtendWith(MockitoExtension.class)
class MatchingServiceRoleTest {

    private static final long FARMER_ID = 10L;
    private static final long OWNER_ID = 20L;
    private static final long SPACE_ID = 100L;
    private static final long MATCHING_ID = 1000L;

    @Mock
    private MatchingRepository matchingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SpaceContractAdapter spaceContractAdapter;

    // 차단 여부는 chat 모듈이 판단한다. 기본값 false 라 차단 없는 상황이 그대로 된다.
    @Mock
    private ChatBlockService chatBlockService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private MatchingService matchingService;

    @Test
    @DisplayName("FARMER 역할이 없어도 매칭을 신청할 수 있다")
    void applyDoesNotRequireFarmerRole() {
        User applicant = newUser("consumer@example.com", "소비자", FARMER_ID);
        given(userRepository.findActiveByIdForUpdate(FARMER_ID)).willReturn(Optional.of(applicant));
        given(spaceContractAdapter.getSummaryById(SPACE_ID)).willReturn(availableSpaceSummary());
        given(userRepository.findActiveByIdForUpdate(OWNER_ID)).willReturn(Optional.of(newUser("owner@example.com", "공간주", OWNER_ID)));
        given(spaceContractAdapter.getSummaryByIdForUpdate(SPACE_ID)).willReturn(availableSpaceSummary());
        given(entityManager.getReference(any(), anyLong())).willReturn(spaceStub());

        matchingService.apply(FARMER_ID, applyRequest());

        var order = inOrder(userRepository, spaceContractAdapter);
        order.verify(spaceContractAdapter).getSummaryById(SPACE_ID);
        order.verify(userRepository).findActiveByIdForUpdate(FARMER_ID);
        order.verify(userRepository).findActiveByIdForUpdate(OWNER_ID);
        order.verify(spaceContractAdapter).getSummaryByIdForUpdate(SPACE_ID);

        // 신청만으로는 아직 농부가 아니다 — 계약이 확정되어야 부여된다.
        assertThat(applicant.hasRole(UserRole.FARMER)).isFalse();
    }

    @Test
    @DisplayName("양측이 계약에 동의하면 신청자에게 FARMER 역할이 부여된다")
    void contractConfirmationGrantsFarmerRoleToApplicant() {
        User applicant = newUser("consumer@example.com", "소비자", FARMER_ID);
        Matching matching = requestedMatching(applicant);
        withContractTerms(matching);
        givenSecuredRequestedMatching(matching);
        given(matchingRepository.findByIdForUpdate(MATCHING_ID)).willReturn(Optional.of(matching));

        matchingService.agreeContract(MATCHING_ID, OWNER_ID, matching.getTermsVersion());
        // 한쪽만 동의한 시점에는 아직 확정이 아니다.
        assertThat(applicant.hasRole(UserRole.FARMER)).isFalse();

        matchingService.agreeContract(MATCHING_ID, FARMER_ID, matching.getTermsVersion());

        assertThat(applicant.getRoles())
                .containsExactlyInAnyOrder(UserRole.CONSUMER, UserRole.FARMER);
    }

    @Test
    @DisplayName("계약을 취소하면 FARMER 역할을 부여하지 않는다")
    void contractCancelDoesNotGrantFarmerRole() {
        User applicant = newUser("consumer@example.com", "소비자", FARMER_ID);
        Matching matching = requestedMatching(applicant);
        withContractTerms(matching);
        givenSecuredRequestedMatching(matching);
        given(matchingRepository.findByIdForUpdate(MATCHING_ID)).willReturn(Optional.of(matching));

        matchingService.cancelContract(MATCHING_ID, OWNER_ID);

        assertThat(applicant.hasRole(UserRole.FARMER)).isFalse();
    }

    // ── 픽스처 ────────────────────────────────────────────────────────────────

    private User newUser(String email, String nickname, long id) {
        User user = User.builder()
                .email(email)
                .password("hashed")
                .nickname(nickname)
                .build();
        setField(user, "id", id);
        return user;
    }

    // JPA 프록시(entityManager.getReference) 자리를 대신하는 Space — id만 있으면 충분하다.
    private Space spaceStub() {
        Space space = Space.builder()
                .owner(newUser("owner@example.com", "공간주", OWNER_ID))
                .title("빈 상가")
                .build();
        setField(space, "id", SPACE_ID);
        return space;
    }

    private Matching requestedMatching(User applicant) {
        Matching matching = Matching.builder()
                .space(spaceStub())
                .farmer(applicant)
                .message("여기서 상추를 키우고 싶습니다.")
                .type(MatchingType.PROFIT)
                .build();
        setField(matching, "id", MATCHING_ID);
        setField(matching, "createdAt", LocalDateTime.now());
        return matching;
    }

    // 조건이 비어 있으면 동의가 CONTRACT_TERMS_REQUIRED로 막히므로 미리 채워둔다.
    private void withContractTerms(Matching matching) {
        matching.updateContractTerms(500_000, 50_000, MaintenanceFeePayer.FARMER, 1_000_000,
                LocalDate.now(), LocalDate.now().plusMonths(6));
    }

    private void givenSecuredRequestedMatching(Matching matching) {
        MatchingParticipantProjection participants = org.mockito.Mockito.mock(MatchingParticipantProjection.class);
        given(participants.getFarmerId()).willReturn(FARMER_ID);
        given(participants.getOwnerId()).willReturn(OWNER_ID);
        given(participants.getSpaceId()).willReturn(SPACE_ID);
        given(matchingRepository.findParticipantsById(MATCHING_ID)).willReturn(Optional.of(participants));
        given(userRepository.findActiveByIdForUpdate(FARMER_ID)).willReturn(Optional.of(matching.getFarmer()));
        given(userRepository.findActiveByIdForUpdate(OWNER_ID)).willReturn(Optional.of(newUser("owner@example.com", "공간주", OWNER_ID)));
        given(spaceContractAdapter.getSummaryByIdForUpdate(SPACE_ID)).willReturn(availableSpaceSummary());
    }

    private SpaceSummary availableSpaceSummary() {
        return SpaceSummary.builder()
                .id(SPACE_ID)
                .ownerId(OWNER_ID)
                .status(SpaceStatus.AVAILABLE)
                .deleted(false)
                .build();
    }

    private MatchingApplyRequest applyRequest() {
        try {
            return new ObjectMapper().readValue(
                    """
                    { "spaceId": %d, "type": "PROFIT", "message": "여기서 상추를 키우고 싶습니다." }
                    """.formatted(SPACE_ID),
                    MatchingApplyRequest.class
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    // 엔티티 PK/생성시각은 JPA가 채우는 값이라 DB 없는 단위 테스트에서는 직접 심어준다.
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
