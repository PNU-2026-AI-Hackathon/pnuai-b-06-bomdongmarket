package com.farmbroker.farmbroker.matching.service;

import com.farmbroker.farmbroker.chat.service.ChatBlockService;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingType;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.matching.support.SpaceContractAdapter;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class MatchingServiceDismissTest {

    private static final long FARMER_ID = 10L;
    private static final long OWNER_ID = 20L;
    private static final long OTHER_USER_ID = 30L;
    private static final long MATCHING_ID = 100L;

    @Mock
    private MatchingRepository matchingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SpaceContractAdapter spaceContractAdapter;
    @Mock
    private ChatBlockService chatBlockService;
    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private MatchingService matchingService;

    @Test
    void ownerCanDismissRequestedNotificationWithoutChangingStatus() {
        Matching matching = requestedMatching();
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching));

        matchingService.dismissNotification(MATCHING_ID, OWNER_ID);

        assertThat(matching.getOwnerDismissedAt()).isNotNull();
        assertThat(matching.getStatus().name()).isEqualTo("REQUESTED");
    }

    @Test
    void farmerCanDismissSentNotificationWithoutChangingStatus() {
        Matching matching = requestedMatching();
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching));

        matchingService.dismissNotification(MATCHING_ID, FARMER_ID);

        assertThat(matching.getFarmerDismissedAt()).isNotNull();
        assertThat(matching.getStatus().name()).isEqualTo("REQUESTED");
    }

    @Test
    void unrelatedUserCannotDismissNotification() {
        Matching matching = requestedMatching();
        given(matchingRepository.findById(MATCHING_ID)).willReturn(Optional.of(matching));

        assertThatThrownBy(() -> matchingService.dismissNotification(MATCHING_ID, OTHER_USER_ID))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MATCHING_FORBIDDEN);
    }

    private Matching requestedMatching() {
        User owner = user(OWNER_ID, "owner@example.com");
        User farmer = user(FARMER_ID, "farmer@example.com");
        Space space = Space.builder().owner(owner).title("빈 상가").build();
        Matching matching = Matching.builder()
                .space(space)
                .farmer(farmer)
                .message("상추를 재배하고 싶습니다.")
                .type(MatchingType.PROFIT)
                .build();
        setField(matching, "id", MATCHING_ID);
        return matching;
    }

    private User user(long id, String email) {
        User user = User.builder().email(email).password("hashed").nickname(email).build();
        setField(user, "id", id);
        return user;
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
