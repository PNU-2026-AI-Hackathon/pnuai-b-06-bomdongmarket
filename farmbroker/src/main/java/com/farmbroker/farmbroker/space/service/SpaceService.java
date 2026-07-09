package com.farmbroker.farmbroker.space.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceImage;
import com.farmbroker.farmbroker.space.dto.SpaceCreateRequest;
import com.farmbroker.farmbroker.space.dto.SpaceResponse;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

// space 도메인 비즈니스 로직.
// 역할(OWNER) 체크는 시큐리티 authorities가 아닌 여기서 수동으로 수행한다 (JWT 필터가 권한을 싣지 않는 팀 정책).
// 클래스 기본은 readOnly 트랜잭션 — 쓰기 메서드에는 개별 @Transactional을 부착한다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final SpaceImageRepository spaceImageRepository;
    private final UserRepository userRepository;

    // 공간 등록 — OWNER 역할만 가능. ownerId는 항상 인증 컨텍스트의 userId를 쓴다.
    @Transactional
    public SpaceResponse create(Long userId, SpaceCreateRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (owner.getRole() != UserRole.OWNER) {
            throw new BusinessException(ErrorCode.FORBIDDEN_ROLE);
        }

        Space space = spaceRepository.save(Space.builder()
                .owner(owner)
                .title(request.getTitle())
                .address(request.getAddress())
                .area(request.getArea())
                .monthlyRent(request.getMonthlyRent())
                .floor(request.getFloor())
                .hasWater(request.getHasWater())
                .hasElectricity(request.getHasElectricity())
                .hasVentilation(request.getHasVentilation())
                .description(request.getDescription())
                .build());

        List<String> imageUrls = saveImages(space, request.getImageUrls());
        return SpaceResponse.from(space, imageUrls);
    }

    // 배열 순서대로 sortOrder를 매겨 저장한다 (0번 = 대표 이미지). null/빈 배열이면 저장 없이 빈 목록 반환
    private List<String> saveImages(Space space, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return List.of();
        }
        List<SpaceImage> images = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            images.add(SpaceImage.builder()
                    .space(space)
                    .imageUrl(imageUrls.get(i))
                    .sortOrder(i)
                    .build());
        }
        spaceImageRepository.saveAll(images);
        return List.copyOf(imageUrls);
    }
}
