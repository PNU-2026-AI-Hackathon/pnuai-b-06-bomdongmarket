package com.farmbroker.farmbroker.matching.service;

import com.farmbroker.farmbroker.chat.service.ChatBlockService;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.domain.MatchingType;
import com.farmbroker.farmbroker.matching.dto.MatchingApplyRequest;
import com.farmbroker.farmbroker.matching.dto.MatchingStatusResponse;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.matching.support.SpaceContractAdapter;
import com.farmbroker.farmbroker.matching.support.SpaceSummary;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceStatus;
import com.farmbroker.farmbroker.user.domain.User;
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

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;

// 신청 취소(PATCH /matchings/{id}/cancel)의 권한·상태 전제를 검증한다.
// 취소는 신청자 본인만, 아직 응답받지 않은(REQUESTED) 신청에 대해서만 가능하고,
// 행을 지우지 않으므로 취소 후 같은 공간에 재신청할 수 있어야 한다.
// DB 없이 돌도록 레포지토리·어댑터는 목으로 대체한다.
@ExtendWith(MockitoExtension.class)
class MatchingServiceCancelTest {

    private static final long FARMER_ID = 10L;
    private static final long OWNER_ID = 20L;
    private static final long OTHER_USER_ID = 30L;
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
    @DisplayName("신청자 본인은 응답 전 신청을 취소할 수 있다")
    void cancelByApplicantMarksCanceled() {
        Matching matching = requestedMatching();
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching));

        MatchingStatusResponse response = matchingService.cancel(MATCHING_ID, FARMER_ID);

        assertThat(matching.getStatus()).isEqualTo(MatchingStatus.CANCELED);
        assertThat(matching.getRespondedAt()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(MatchingStatus.CANCELED);
    }

    @Test
    @DisplayName("신청자가 아닌 사용자는 취소할 수 없다")
    void cancelByOtherUserIsForbidden() {
        Matching matching = requestedMatching();
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching));

        assertThatThrownBy(() -> matchingService.cancel(MATCHING_ID, OTHER_USER_ID))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MATCHING_FORBIDDEN);
        assertThat(matching.getStatus()).isEqualTo(MatchingStatus.REQUESTED);
    }

    @Test
    @DisplayName("이미 수락된 신청은 취소할 수 없다")
    void cancelAcceptedMatchingIsRejected() {
        Matching matching = requestedMatching();
        matching.accept();
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching));

        assertThatThrownBy(() -> matchingService.cancel(MATCHING_ID, FARMER_ID))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MATCHING_ALREADY_PROCESSED);
        assertThat(matching.getStatus()).isEqualTo(MatchingStatus.ACCEPTED);
    }

    @Test
    @DisplayName("취소한 공간에는 다시 신청할 수 있다")
    void canReapplyAfterCancel() {
        // 중복 검사는 REQUESTED 건만 보므로, 취소로 CANCELED가 된 뒤에는 통과해야 한다.
        User applicant = newUser(FARMER_ID);
        given(userRepository.findActiveByIdForUpdate(FARMER_ID)).willReturn(Optional.of(applicant));
        given(userRepository.findActiveByIdForUpdate(OWNER_ID)).willReturn(Optional.of(newUser(OWNER_ID)));
        given(spaceContractAdapter.getSummaryById(SPACE_ID)).willReturn(availableSpaceSummary());
        given(spaceContractAdapter.getSummaryByIdForUpdate(SPACE_ID)).willReturn(availableSpaceSummary());
        given(matchingRepository.existsBySpaceIdAndFarmerIdAndStatus(
                SPACE_ID, FARMER_ID, MatchingStatus.REQUESTED)).willReturn(false);
        given(entityManager.getReference(any(), anyLong())).willReturn(spaceStub());

        assertThat(matchingService.apply(FARMER_ID, applyRequest()).getStatus())
                .isEqualTo(MatchingStatus.REQUESTED);
    }

    // 차단이 채팅만 막는 표시로 남지 않게, 거래 재신청도 함께 막는다.
    // 거절·취소만으로는 계속 다시 신청할 수 있어 받는 쪽이 멈출 방법이 없었다.
    @Test
    @DisplayName("차단한 사이에는 다시 신청할 수 없다")
    void cannotReapplyWhenBlocked() {
        User applicant = newUser(FARMER_ID);
        given(userRepository.findActiveByIdForUpdate(FARMER_ID)).willReturn(Optional.of(applicant));
        given(userRepository.findActiveByIdForUpdate(OWNER_ID)).willReturn(Optional.of(newUser(OWNER_ID)));
        given(spaceContractAdapter.getSummaryById(SPACE_ID)).willReturn(availableSpaceSummary());
        given(spaceContractAdapter.getSummaryByIdForUpdate(SPACE_ID)).willReturn(availableSpaceSummary());
        given(matchingRepository.existsBySpaceIdAndFarmerIdAndStatus(
                SPACE_ID, FARMER_ID, MatchingStatus.REQUESTED)).willReturn(false);
        given(chatBlockService.isBlockedEitherDirection(FARMER_ID, OWNER_ID)).willReturn(true);

        assertThatThrownBy(() -> matchingService.apply(FARMER_ID, applyRequest()))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MATCHING_BLOCKED);
    }

    // ── 픽스처 ────────────────────────────────────────────────────────────────

    private User newUser(long id) {
        User user = User.builder()
                .email("farmer@example.com")
                .password("hashed")
                .nickname("도심농부")
                .build();
        setField(user, "id", id);
        return user;
    }

    // JPA 프록시(entityManager.getReference) 자리를 대신하는 Space — id/owner만 있으면 충분하다.
    private Space spaceStub() {
        User owner = User.builder()
                .email("owner@example.com")
                .password("hashed")
                .nickname("공간주")
                .build();
        setField(owner, "id", OWNER_ID);

        Space space = Space.builder()
                .owner(owner)
                .title("빈 상가")
                .build();
        setField(space, "id", SPACE_ID);
        return space;
    }

    private Matching requestedMatching() {
        Matching matching = Matching.builder()
                .space(spaceStub())
                .farmer(newUser(FARMER_ID))
                .message("여기서 상추를 키우고 싶습니다.")
                .type(MatchingType.HOBBY)
                .build();
        setField(matching, "id", MATCHING_ID);
        setField(matching, "createdAt", LocalDateTime.now());
        return matching;
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
                    { "spaceId": %d, "type": "HOBBY", "message": "여기서 상추를 키우고 싶습니다." }
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
