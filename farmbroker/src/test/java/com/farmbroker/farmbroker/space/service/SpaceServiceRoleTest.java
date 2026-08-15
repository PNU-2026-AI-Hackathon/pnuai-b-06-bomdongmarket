package com.farmbroker.farmbroker.space.service;

import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.dto.SpaceCreateRequest;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

// 공간 등록의 역할 정책을 검증한다.
// 등록은 더 이상 OWNER를 요구하지 않고, 등록 행위 자체가 OWNER 역할을 부여한다.
// DB 없이 돌도록 레포지토리는 목으로 대체한다(이 프로젝트는 H2 없이 MySQL만 쓴다).
@ExtendWith(MockitoExtension.class)
class SpaceServiceRoleTest {

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private SpaceImageRepository spaceImageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SpaceService spaceService;

    private User newConsumer() {
        return User.builder()
                .email("consumer@example.com")
                .password("hashed")
                .nickname("소비자")
                .build();
    }

    // SpaceCreateRequest는 setter 없는 바인딩 전용 DTO라 실제 요청과 같은 경로(역직렬화)로 만든다.
    private SpaceCreateRequest createRequest() {
        try {
            return new ObjectMapper().readValue(
                    """
                    {
                      "title": "빈 상가 1층",
                      "address": "부산 금정구",
                      "area": 30.5,
                      "monthlyRent": 300000,
                      "floor": 1,
                      "hasWater": true,
                      "hasElectricity": true,
                      "hasVentilation": false
                    }
                    """,
                    SpaceCreateRequest.class
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    @DisplayName("OWNER 역할이 없어도 공간을 등록할 수 있다")
    void createDoesNotRequireOwnerRole() {
        User user = newConsumer();
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user));
        given(spaceRepository.save(any(Space.class))).willAnswer(inv -> inv.getArgument(0));

        spaceService.create(1L, createRequest());

        assertThat(user.hasRole(UserRole.OWNER)).isTrue();
    }

    @Test
    @DisplayName("공간 등록에 성공하면 OWNER 역할이 더해지고 기존 역할은 유지된다")
    void createGrantsOwnerRoleKeepingExistingOnes() {
        User user = newConsumer();
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user));
        given(spaceRepository.save(any(Space.class))).willAnswer(inv -> inv.getArgument(0));

        spaceService.create(1L, createRequest());

        assertThat(user.getRoles())
                .containsExactlyInAnyOrder(UserRole.CONSUMER, UserRole.OWNER);
    }
}
