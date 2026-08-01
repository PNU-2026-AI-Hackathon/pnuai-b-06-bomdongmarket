package com.farmbroker.farmbroker.space.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.space.domain.SpaceImage;
import com.farmbroker.farmbroker.space.domain.SpaceStatus;
import com.farmbroker.farmbroker.space.dto.SpaceCreateRequest;
import com.farmbroker.farmbroker.space.dto.SpaceDeleteResponse;
import com.farmbroker.farmbroker.space.dto.SpaceDetailResponse;
import com.farmbroker.farmbroker.space.dto.SpaceListItemResponse;
import com.farmbroker.farmbroker.space.dto.SpaceListResponse;
import com.farmbroker.farmbroker.space.dto.SpaceResponse;
import com.farmbroker.farmbroker.space.dto.SpaceSummaryDto;
import com.farmbroker.farmbroker.space.dto.SpaceUpdateRequest;
import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    // 공간 상세 조회 — 공개 API. 삭제된 공간은 존재하지 않는 것처럼 404 처리한다.
    // (BE3 내부용 getSummaryById와 정책이 다름: 내부용은 deleted여도 반환)
    public SpaceDetailResponse getDetail(Long spaceId) {
        Space space = spaceRepository.findByIdAndDeletedFalse(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        List<String> imageUrls = spaceImageRepository.findBySpaceIdOrderBySortOrderAsc(spaceId).stream()
                .map(SpaceImage::getImageUrl)
                .toList();
        return SpaceDetailResponse.from(space, imageUrls);
    }

    // 정렬 파라미터 값 상수 (명세 2.2)
    private static final String SORT_LATEST = "latest";
    private static final String SORT_AREA = "area";
    private static final String SORT_RENT = "rent";

    // 공개 목록 검색 — deleted=false && AVAILABLE만. keyword/minArea/maxRent 필터 + latest/area/rent 정렬 + 페이징
    public SpaceListResponse getList(String keyword, BigDecimal minArea, Integer maxRent,
                                     String sort, int page, int size) {
        if (page < 0 || size <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        Pageable pageable = PageRequest.of(page, size, toSort(sort));
        Page<Space> spaces = spaceRepository.search(emptyToNull(keyword), minArea, maxRent, pageable);

        Map<Long, String> thumbnails = findThumbnails(spaces.getContent());
        List<SpaceListItemResponse> content = spaces.getContent().stream()
                .map(space -> SpaceListItemResponse.from(space, thumbnails.get(space.getId())))
                .toList();
        return SpaceListResponse.of(content, spaces.getNumber(), spaces.getSize(),
                spaces.getTotalElements(), spaces.getTotalPages());
    }

    // latest: 최신순(기본) / area: 면적 큰 순 / rent: 월세 낮은 순. 그 외 값은 400 VALIDATION_ERROR (명세 2.2)
    private Sort toSort(String sort) {
        return switch (sort == null ? SORT_LATEST : sort) {
            case SORT_LATEST -> Sort.by(Sort.Direction.DESC, "createdAt");
            case SORT_AREA -> Sort.by(Sort.Direction.DESC, "area");
            case SORT_RENT -> Sort.by(Sort.Direction.ASC, "monthlyRent");
            default -> throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        };
    }

    // 빈 문자열 keyword는 필터 미적용(null)으로 취급한다
    private String emptyToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    // 내가 등록한 공간 — status 무관 전부, deleted 제외, 최신순. MVP 기준 페이징 없음 (명세 2.4)
    public List<SpaceListItemResponse> getMy(Long userId) {
        List<Space> spaces = spaceRepository.findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(userId);
        Map<Long, String> thumbnails = findThumbnails(spaces);
        return spaces.stream()
                .map(space -> SpaceListItemResponse.from(space, thumbnails.get(space.getId())))
                .toList();
    }

    // 공간 부분수정 — 등록자 본인만. null이 아닌 필드만 반영하고, imageUrls는 전체 교체(replace)한다.
    @Transactional
    public SpaceResponse update(Long userId, Long spaceId, SpaceUpdateRequest request) {
        Space space = spaceRepository.findByIdAndDeletedFalse(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        validateOwner(space, userId);

        if (request.getStatus() != null) {
            space.changeStatus(parseUpdatableStatus(request.getStatus()));
        }
        space.update(request.getTitle(), request.getAddress(), request.getArea(),
                request.getMonthlyRent(), request.getFloor(), request.getHasWater(),
                request.getHasElectricity(), request.getHasVentilation(), request.getDescription());

        List<String> imageUrls;
        if (request.getImageUrls() != null) {
            spaceImageRepository.deleteBySpaceId(spaceId);
            imageUrls = saveImages(space, request.getImageUrls());
        } else {
            imageUrls = spaceImageRepository.findBySpaceIdOrderBySortOrderAsc(spaceId).stream()
                    .map(SpaceImage::getImageUrl)
                    .toList();
        }

        // @LastModifiedDate는 flush 시점에 갱신되므로, 응답에 최신 updatedAt을 담기 위해 먼저 flush한다
        spaceRepository.flush();
        return SpaceResponse.from(space, imageUrls);
    }

    // 공간 삭제 — Soft Delete(deleted=true). 이미지는 물리 삭제하지 않는다 (매칭 이력에서 참조 가능).
    // 이미 삭제된 공간은 findByIdAndDeletedFalse에서 걸러져 404가 된다.
    @Transactional
    public SpaceDeleteResponse delete(Long userId, Long spaceId) {
        Space space = spaceRepository.findByIdAndDeletedFalse(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        validateOwner(space, userId);
        space.softDelete();
        return SpaceDeleteResponse.of(spaceId, true);
    }

    // ── BE3(matching) 내부 인터페이스 (작업명세서 5.2 규약 — 임의 변경 금지) ──────

    // 단건 요약 조회 — 공개 API(getDetail)와 달리 deleted 여부와 무관하게 반환한다.
    // BE3가 신청 시 deleted를 보고 거부하고, 매칭 이력에선 삭제된 공간 제목도 노출해야 하기 때문.
    // 존재하지 않는 spaceId만 SPACE_NOT_FOUND.
    public SpaceSummaryDto getSummaryById(Long spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        Map<Long, String> thumbnails = findThumbnails(List.of(space));
        return SpaceSummaryDto.from(space, thumbnails.get(space.getId()));
    }

    // 배치 요약 조회 — BE3 매칭 목록용 (N+1 방지). 존재하는 공간만 담아 반환하며 예외를 던지지 않는다
    public List<SpaceSummaryDto> getSummariesByIds(List<Long> spaceIds) {
        List<Space> spaces = spaceRepository.findAllById(spaceIds);
        Map<Long, String> thumbnails = findThumbnails(spaces);
        return spaces.stream()
                .map(space -> SpaceSummaryDto.from(space, thumbnails.get(space.getId())))
                .toList();
    }

    // 매칭 수락 시 BE3 accept() 트랜잭션 안에서 호출된다.
    // 전파는 반드시 REQUIRED(기본값) — REQUIRES_NEW로 바꾸면 매칭 수락 롤백 시 status만 남는 사고가 난다.
    // 클래스 기본이 readOnly라 쓰기 @Transactional을 별도 부착한다 (작업명세서 5.2).
    @Transactional
    public void markMatched(Long spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        if (space.isDeleted() || space.getStatus() != SpaceStatus.AVAILABLE) {
            throw new BusinessException(ErrorCode.SPACE_NOT_AVAILABLE);
        }
        space.markMatched();
    }

    private void validateOwner(Space space, Long userId) {
        if (!space.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_SPACE_OWNER);
        }
    }

    // OWNER가 직접 전환할 수 있는 상태는 AVAILABLE/CLOSED뿐. MATCHED는 매칭 도메인(BE3) 전용이며,
    // 알 수 없는 문자열도 동일하게 INVALID_STATUS_CHANGE로 응답한다 (명세 2.5)
    private SpaceStatus parseUpdatableStatus(String status) {
        if (SpaceStatus.AVAILABLE.name().equals(status)) {
            return SpaceStatus.AVAILABLE;
        }
        if (SpaceStatus.CLOSED.name().equals(status)) {
            return SpaceStatus.CLOSED;
        }
        throw new BusinessException(ErrorCode.INVALID_STATUS_CHANGE);
    }

    // 여러 공간의 대표 이미지(sortOrder 최솟값)를 한 쿼리로 조회해 N+1을 방지한다.
    // 이미지가 없는 공간은 맵에 없으므로 imageUrl이 null로 내려간다.
    private Map<Long, String> findThumbnails(List<Space> spaces) {
        if (spaces.isEmpty()) {
            return Map.of();
        }
        List<Long> spaceIds = spaces.stream().map(Space::getId).toList();
        Map<Long, String> thumbnails = new HashMap<>();
        for (SpaceImage image : spaceImageRepository.findBySpaceIdInOrderBySortOrderAsc(spaceIds)) {
            thumbnails.putIfAbsent(image.getSpace().getId(), image.getImageUrl());
        }
        return thumbnails;
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
