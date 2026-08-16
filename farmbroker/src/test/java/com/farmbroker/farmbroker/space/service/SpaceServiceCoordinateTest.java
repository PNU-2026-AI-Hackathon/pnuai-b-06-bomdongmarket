package com.farmbroker.farmbroker.space.service;

import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.dto.SpaceCreateRequest;
import com.farmbroker.farmbroker.space.dto.SpaceResponse;
import com.farmbroker.farmbroker.space.dto.SpaceUpdateRequest;
import com.farmbroker.farmbroker.space.repository.SpaceFloorPlanRepository;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

// Space가 Product와 동일하게 지도용 좌표를 등록/수정 시 저장하는지 검증한다.
// DB 없이 돌도록 레포지토리는 목으로 대체한다(이 프로젝트는 H2 없이 MySQL만 쓴다).
@ExtendWith(MockitoExtension.class)
class SpaceServiceCoordinateTest {

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private SpaceImageRepository spaceImageRepository;

    @Mock
    private SpaceFloorPlanRepository spaceFloorPlanRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SpaceService spaceService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User newConsumer() {
        return User.builder()
                .email("consumer@example.com")
                .password("hashed")
                .nickname("소비자")
                .build();
    }

    private SpaceCreateRequest createRequest(String latitude, String longitude) {
        try {
            return objectMapper.readValue(
                    """
                    {
                      "title": "빈 상가 1층",
                      "address": "부산 금정구",
                      "area": 30.5,
                      "monthlyRent": 300000,
                      "floor": 1,
                      "hasWater": true,
                      "hasElectricity": true,
                      "hasVentilation": false,
                      "latitude": %s,
                      "longitude": %s
                    }
                    """.formatted(latitude, longitude),
                    SpaceCreateRequest.class
            );
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    // id를 부여할 방법이 없는(@GeneratedValue) 순수 목 환경이라, spaceId/ownerId가 필요한 경로(SpaceResponse.from,
    // validateOwner) 전에 리플렉션으로 id를 채운다. (SpaceServiceStatusTest와 동일 패턴)
    private void assignId(Object entity, long id) throws NoSuchFieldException, IllegalAccessException {
        Field idField = entity.getClass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }

    @Test
    @DisplayName("공간 등록 시 요청의 위도/경도가 그대로 저장된다")
    void createStoresCoordinates() throws Exception {
        User user = newConsumer();
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user));
        given(spaceRepository.save(any(Space.class))).willAnswer(inv -> {
            Space space = inv.getArgument(0);
            assignId(space, 10L);
            return space;
        });

        SpaceResponse response = spaceService.create(1L, createRequest("35.1798", "129.075"));

        assertThat(response.getLatitude()).isEqualTo(35.1798);
        assertThat(response.getLongitude()).isEqualTo(129.075);
    }

    @Test
    @DisplayName("좌표 없이 등록하면 위도/경도는 null로 저장된다")
    void createWithoutCoordinatesStoresNull() throws Exception {
        User user = newConsumer();
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user));
        given(spaceRepository.save(any(Space.class))).willAnswer(inv -> {
            Space space = inv.getArgument(0);
            assignId(space, 11L);
            return space;
        });

        SpaceResponse response = spaceService.create(1L, createRequest("null", "null"));

        assertThat(response.getLatitude()).isNull();
        assertThat(response.getLongitude()).isNull();
    }

    @Test
    @DisplayName("공간 수정 시 좌표만 보내면 null-safe 부분수정으로 좌표만 바뀐다")
    void updatePartiallyChangesCoordinatesOnly() throws Exception {
        User user = newConsumer();
        assignId(user, 1L);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(user));

        Space space = Space.builder()
                .owner(user)
                .title("기존 제목")
                .address("부산 금정구")
                .area(new java.math.BigDecimal("30.5"))
                .monthlyRent(300000)
                .floor(1)
                .hasWater(true)
                .hasElectricity(true)
                .hasVentilation(false)
                .description("설명")
                .latitude(35.0)
                .longitude(129.0)
                .build();
        assignId(space, 20L);
        given(spaceRepository.findByIdAndDeletedFalse(20L)).willReturn(Optional.of(space));

        SpaceUpdateRequest updateRequest = objectMapper.readValue(
                """
                {
                  "latitude": 36.5,
                  "longitude": 128.5
                }
                """,
                SpaceUpdateRequest.class
        );

        SpaceResponse response = spaceService.update(1L, 20L, updateRequest);

        assertThat(response.getLatitude()).isEqualTo(36.5);
        assertThat(response.getLongitude()).isEqualTo(128.5);
        assertThat(response.getTitle()).isEqualTo("기존 제목");
    }
}
