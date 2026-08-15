package com.farmbroker.farmbroker.space.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.dto.SpaceUpdateRequest;
import com.farmbroker.farmbroker.space.repository.SpaceFloorPlanRepository;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class SpaceServiceStatusTest {

    @Test
    void owner_cannot_return_matched_space_to_available() throws Exception {
        User owner = User.builder().email("owner@example.com").password("hashed").nickname("공간주").build();
        setId(owner, 1L);
        Space space = Space.builder().owner(owner).title("계약 공간").build();
        setId(space, 10L);
        space.markMatched();

        SpaceRepository spaceRepository = mock(SpaceRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        given(spaceRepository.findByIdAndDeletedFalse(10L)).willReturn(Optional.of(space));
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(owner));
        SpaceService service = new SpaceService(spaceRepository, mock(SpaceImageRepository.class),
                mock(SpaceFloorPlanRepository.class), userRepository);
        SpaceUpdateRequest request = new ObjectMapper().readValue("{\"status\":\"AVAILABLE\"}", SpaceUpdateRequest.class);

        assertThatThrownBy(() -> service.update(1L, 10L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_STATUS_CHANGE);
    }

    private void setId(Object entity, Long id) {
        try {
            var field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
