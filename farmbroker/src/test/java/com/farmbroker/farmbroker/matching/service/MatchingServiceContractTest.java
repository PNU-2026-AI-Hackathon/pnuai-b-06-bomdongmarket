package com.farmbroker.farmbroker.matching.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.ContractStatus;
import com.farmbroker.farmbroker.matching.domain.MaintenanceFeePayer;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.domain.MatchingType;
import com.farmbroker.farmbroker.matching.dto.ContractResponse;
import com.farmbroker.farmbroker.matching.dto.ContractTermsRequest;
import com.farmbroker.farmbroker.matching.repository.MatchingParticipantProjection;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
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

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

// 계약서(매칭에 붙는 월세·계약기간·양측 동의)의 권한과 상태 전이를 검증한다.
// 지켜야 할 규칙: 조건 입력은 공간 제공자만, 확정은 양측 모두 동의해야, 취소는 한쪽만 눌러도 된다.
// 조건을 바꾸면 기존 동의가 풀려야 한다 — 안 그러면 상대가 동의한 적 없는 금액으로 확정된다.
@ExtendWith(MockitoExtension.class)
class MatchingServiceContractTest {

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

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private MatchingService matchingService;

    // 계약서 쓰기 경로는 수락과 같은 순서(사용자 → 공간 → 매칭)로 잠근 뒤 매칭을 읽는다.
    private void givenLockedMatching(Matching matching) {
        given(matchingRepository.findParticipantsById(MATCHING_ID))
                .willReturn(Optional.of(participants()));
        given(userRepository.findActiveByIdForUpdate(FARMER_ID))
                .willReturn(Optional.of(matching.getFarmer()));
        given(userRepository.findActiveByIdForUpdate(OWNER_ID))
                .willReturn(Optional.of(matching.getSpace().getOwner()));
        given(spaceContractAdapter.getSummaryByIdForUpdate(SPACE_ID))
                .willReturn(SpaceSummary.builder()
                        .id(SPACE_ID)
                        .ownerId(OWNER_ID)
                        .status(SpaceStatus.AVAILABLE)
                        .deleted(false)
                        .build());
        given(matchingRepository.findByIdForUpdate(MATCHING_ID)).willReturn(Optional.of(matching));
    }

    private MatchingParticipantProjection participants() {
        return new MatchingParticipantProjection() {
            @Override
            public Long getFarmerId() {
                return FARMER_ID;
            }

            @Override
            public Long getOwnerId() {
                return OWNER_ID;
            }

            @Override
            public Long getSpaceId() {
                return SPACE_ID;
            }
        };
    }

    @Test
    @DisplayName("계약서 조회는 양측 닉네임과 공간 주소를 그대로 싣고 요청자 쪽을 알려준다")
    void getContractCarriesExistingInfo() {
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching()));

        ContractResponse response = matchingService.getContract(MATCHING_ID, FARMER_ID);

        assertThat(response.getOwnerNickname()).isEqualTo("공간주");
        assertThat(response.getFarmerNickname()).isEqualTo("도심농부");
        assertThat(response.getAddress()).isEqualTo("부산광역시 금정구 부산대학로 63번길 2");
        assertThat(response.getViewerRole()).isEqualTo("FARMER");
        assertThat(response.getStatus()).isEqualTo(ContractStatus.DRAFT);
    }

    @Test
    @DisplayName("당사자가 아니면 계약서를 볼 수 없다")
    void getContractByOtherUserIsForbidden() {
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching()));

        assertThatThrownBy(() -> matchingService.getContract(MATCHING_ID, OTHER_USER_ID))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MATCHING_FORBIDDEN);
    }

    @Test
    @DisplayName("신청자는 계약 조건을 저장할 수 없다")
    void updateTermsByFarmerIsForbidden() {
        Matching matching = matching();
        givenLockedMatching(matching);

        assertThatThrownBy(() -> matchingService.updateContractTerms(MATCHING_ID, FARMER_ID, terms(500_000)))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MATCHING_FORBIDDEN);
        assertThat(matching.getContractMonthlyRent()).isNull();
    }

    @Test
    @DisplayName("종료일이 시작일보다 앞서면 저장할 수 없다")
    void updateTermsWithInvalidPeriodIsRejected() {
        givenLockedMatching(matching());
        ContractTermsRequest reversed = termsJson("""
                {
                  "monthlyRent": 500000, "maintenanceFee": 50000,
                  "maintenanceFeePayer": "FARMER", "deposit": 3000000,
                  "startDate": "2026-12-31", "endDate": "2026-09-01"
                }
                """);

        assertThatThrownBy(() -> matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, reversed))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONTRACT_INVALID_PERIOD);
    }

    @Test
    @DisplayName("조건을 다시 저장하면 이미 받은 동의가 초기화된다")
    void updateTermsResetsAgreements() {
        Matching matching = matching();
        givenLockedMatching(matching);
        matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(500_000));
        matchingService.agreeContract(MATCHING_ID, FARMER_ID);
        assertThat(matching.getFarmerAgreedAt()).isNotNull();

        ContractResponse response = matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(900_000));

        assertThat(matching.getFarmerAgreedAt()).isNull();
        assertThat(matching.getOwnerAgreedAt()).isNull();
        assertThat(response.getMonthlyRent()).isEqualTo(900_000);
        assertThat(response.isFarmerAgreed()).isFalse();
    }

    @Test
    @DisplayName("관리비·책임소재·보증금도 함께 저장되어 응답에 실린다")
    void updateTermsSavesFeeAndDeposit() {
        Matching matching = matching();
        givenLockedMatching(matching);

        ContractResponse response = matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(500_000));

        assertThat(response.getMaintenanceFee()).isEqualTo(50_000);
        assertThat(response.getMaintenanceFeePayer()).isEqualTo(MaintenanceFeePayer.FARMER);
        assertThat(response.getDeposit()).isEqualTo(3_000_000);
        assertThat(matching.getContractMaintenanceFeePayer()).isEqualTo(MaintenanceFeePayer.FARMER);
    }

    @Test
    @DisplayName("조건을 입력하지 않으면 계약에 동의할 수 없다")
    void agreeWithoutTermsIsRejected() {
        givenLockedMatching(matching());

        assertThatThrownBy(() -> matchingService.agreeContract(MATCHING_ID, OWNER_ID))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONTRACT_TERMS_REQUIRED);
    }

    @Test
    @DisplayName("양측이 모두 동의해야 계약이 확정되고, 확정 시 매칭도 ACCEPTED가 된다")
    void contractIsConfirmedOnlyWhenBothAgree() {
        Matching matching = matching();
        givenLockedMatching(matching);
        matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(500_000));

        ContractResponse afterOwner = matchingService.agreeContract(MATCHING_ID, OWNER_ID);
        assertThat(afterOwner.getStatus()).isEqualTo(ContractStatus.DRAFT);
        // 한쪽만 동의한 단계에서는 매칭이 아직 신청 상태 그대로여야 한다.
        assertThat(matching.getStatus()).isEqualTo(MatchingStatus.REQUESTED);

        ContractResponse afterFarmer = matchingService.agreeContract(MATCHING_ID, FARMER_ID);
        assertThat(afterFarmer.getStatus()).isEqualTo(ContractStatus.CONFIRMED);
        assertThat(matching.getStatus()).isEqualTo(MatchingStatus.ACCEPTED);
        assertThat(matching.getRespondedAt()).isNotNull();
        // 확정은 소유자의 수락과 똑같은 후속 처리를 일으켜야 한다.
        assertThat(matching.getFarmer().getRoles()).contains(UserRole.FARMER);
        then(spaceContractAdapter).should().markMatched(SPACE_ID);
        then(matchingRepository).should()
                .rejectRemainingRequested(eq(SPACE_ID), eq(MATCHING_ID), any(LocalDateTime.class));
        // 확정 응답은 벌크 UPDATE 전에 조립되므로 LAZY 필드가 그대로 담겨 있어야 한다.
        assertThat(afterFarmer.getOwnerNickname()).isEqualTo("공간주");
        assertThat(afterFarmer.getAddress()).isNotBlank();
    }

    @Test
    @DisplayName("소유자가 이미 수락한 매칭이면 확정 시 후속 처리를 다시 하지 않는다")
    void alreadyAcceptedMatchingSkipsAcceptanceSideEffects() {
        // 수락/거절 flow로 이미 공간이 MATCHED가 된 상태다 — 다시 markMatched를 부르면 409가 난다.
        Matching matching = matching();
        matching.accept();
        givenLockedMatching(matching);
        matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(500_000));
        matchingService.agreeContract(MATCHING_ID, OWNER_ID);

        ContractResponse response = matchingService.agreeContract(MATCHING_ID, FARMER_ID);

        assertThat(response.getStatus()).isEqualTo(ContractStatus.CONFIRMED);
        assertThat(matching.getStatus()).isEqualTo(MatchingStatus.ACCEPTED);
        then(spaceContractAdapter).should(never()).markMatched(anyLong());
    }

    @Test
    @DisplayName("확정된 계약은 조건을 바꾸거나 취소할 수 없다")
    void confirmedContractIsClosed() {
        givenLockedMatching(matching());
        matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(500_000));
        matchingService.agreeContract(MATCHING_ID, OWNER_ID);
        matchingService.agreeContract(MATCHING_ID, FARMER_ID);

        assertThatThrownBy(() -> matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(700_000)))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONTRACT_CLOSED);
        assertThatThrownBy(() -> matchingService.cancelContract(MATCHING_ID, FARMER_ID))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONTRACT_CLOSED);
    }

    @Test
    @DisplayName("한 쪽만 취소해도 계약이 취소되고 매칭은 REJECTED가 된다")
    void cancelByOneSideClosesContract() {
        Matching matching = matching();
        givenLockedMatching(matching);
        matchingService.updateContractTerms(MATCHING_ID, OWNER_ID, terms(500_000));
        matchingService.agreeContract(MATCHING_ID, OWNER_ID);

        ContractResponse response = matchingService.cancelContract(MATCHING_ID, FARMER_ID);

        assertThat(response.getStatus()).isEqualTo(ContractStatus.CANCELED);
        assertThat(matching.getStatus()).isEqualTo(MatchingStatus.REJECTED);
        assertThat(matching.getRespondedAt()).isNotNull();
        assertThatThrownBy(() -> matchingService.agreeContract(MATCHING_ID, FARMER_ID))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONTRACT_CLOSED);
    }

    // ── 픽스처 ────────────────────────────────────────────────────────────────

    private Matching matching() {
        User owner = user(OWNER_ID, "owner@example.com", "공간주");
        User farmer = user(FARMER_ID, "farmer@example.com", "도심농부");

        Space space = Space.builder()
                .owner(owner)
                .title("빈 상가")
                .address("부산광역시 금정구 부산대학로 63번길 2")
                .build();
        setField(space, "id", SPACE_ID);

        Matching matching = Matching.builder()
                .space(space)
                .farmer(farmer)
                .message("여기서 상추를 키우고 싶습니다.")
                .type(MatchingType.PROFIT)
                .build();
        setField(matching, "id", MATCHING_ID);
        setField(matching, "createdAt", LocalDateTime.now());
        return matching;
    }

    private User user(long id, String email, String nickname) {
        User user = User.builder()
                .email(email)
                .password("hashed")
                .nickname(nickname)
                .build();
        setField(user, "id", id);
        return user;
    }

    private ContractTermsRequest terms(int monthlyRent) {
        return termsJson("""
                {
                  "monthlyRent": %d, "maintenanceFee": 50000,
                  "maintenanceFeePayer": "FARMER", "deposit": 3000000,
                  "startDate": "2026-09-01", "endDate": "2027-08-31"
                }
                """.formatted(monthlyRent));
    }

    // 요청 DTO는 세터가 없어 Jackson으로 만든다 — 실제 요청과 같은 경로다.
    private ContractTermsRequest termsJson(String json) {
        try {
            return new ObjectMapper().findAndRegisterModules().readValue(json, ContractTermsRequest.class);
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
