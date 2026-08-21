package com.farmbroker.farmbroker.product.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
import com.farmbroker.farmbroker.product.domain.ProductStatus;
import com.farmbroker.farmbroker.product.domain.ProductTraceabilityEvent;
import com.farmbroker.farmbroker.product.dto.ProductCreateRequest;
import com.farmbroker.farmbroker.product.dto.ProductDeleteResponse;
import com.farmbroker.farmbroker.product.dto.ProductDetailResponse;
import com.farmbroker.farmbroker.product.dto.ProductListItemResponse;
import com.farmbroker.farmbroker.product.dto.ProductUpdateRequest;
import com.farmbroker.farmbroker.product.dto.TraceabilityEventRequest;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.product.repository.ProductTraceabilityEventRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// 로컬마켓 상품 비즈니스 로직.
// 판매자 자격은 FARMER 역할 보유자로 한정한다 — 매칭이 수락돼 도심 농부가 된 사용자만 생산물을 등록할 수 있다.
// (역할은 활동에 따라 누적된다: 가입 시 CONSUMER, 공간 등록 시 OWNER, 매칭 수락 시 FARMER — User.addRole 참고.)
// 클래스 기본은 readOnly 트랜잭션 — 쓰기 메서드에는 개별 @Transactional을 부착한다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    // freshnessTags 파생 임계값(km). 튜닝 가능.
    private static final double NEAR_FARM_KM = 5.0;
    private static final double LOW_MILEAGE_KM = 10.0;

    // 목록 category 필터에서 '전체'는 필터 미적용(전부)을 의미하는 특수값이다.
    private static final String CATEGORY_ALL = "전체";

    private final ProductRepository productRepository;
    private final ProductTraceabilityEventRepository eventRepository;
    private final UserRepository userRepository;
    private final MatchingRepository matchingRepository;

    // 상품 등록 — FARMER 역할 보유자만. sellerId는 항상 인증 컨텍스트의 userId를 쓴다.
    @Transactional
    public ProductDetailResponse create(Long userId, ProductCreateRequest request) {
        User seller = getActiveUserForUpdate(userId);
        if (!seller.hasRole(UserRole.FARMER)) {
            throw new BusinessException(ErrorCode.FORBIDDEN_ROLE);
        }

        ProductCategory category = parseCategory(request.getCategory());
        // 생산자명은 입력받지 않고 항상 판매자 닉네임으로 고정한다.
        String producerName = seller.getNickname();
        validateHarvestDateInContract(userId, request.getSpaceId(), request.getHarvestDate());

        Product product = productRepository.save(Product.builder()
                .seller(seller)
                .name(request.getName())
                .category(category)
                .price(request.getPrice())
                .unit(request.getUnit())
                .stock(request.getStock())
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .harvestDate(request.getHarvestDate())
                .producerName(producerName)
                .productionLocation(request.getProductionLocation())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .spaceId(request.getSpaceId())
                .foodMileageKm(request.getFoodMileageKm())
                .build());

        List<ProductTraceabilityEvent> events = saveEvents(product, request.getEvents());
        return ProductDetailResponse.from(product, seller.getNickname(),
                freshnessTags(product, !events.isEmpty()), events);
    }

    // 공개 목록 조회 — deleted=false, keyword(상품명/생산위치), category('전체'/미지정=전부), 최신순.
    public List<ProductListItemResponse> getList(String keyword, String category) {
        List<Product> products = productRepository.search(emptyToNull(keyword), parseListCategory(category));
        Set<Long> withEvents = findProductIdsWithEvents(products);
        return products.stream()
                .map(product -> ProductListItemResponse.from(product,
                        freshnessTags(product, withEvents.contains(product.getId()))))
                .toList();
    }

    // 공개 상세 조회 — 삭제된 상품은 404.
    public ProductDetailResponse getDetail(Long productId) {
        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        List<ProductTraceabilityEvent> events =
                eventRepository.findByProductIdOrderBySortOrderAscOccurredAtAsc(productId);
        return ProductDetailResponse.from(product, product.getSeller().getNickname(),
                freshnessTags(product, !events.isEmpty()), events);
    }

    // 내가 등록한 상품 — 상태 무관 전부, 삭제 제외, 최신순.
    public List<ProductListItemResponse> getMy(Long userId) {
        List<Product> products = productRepository.findBySellerIdAndDeletedFalseOrderByCreatedAtDesc(userId);
        Set<Long> withEvents = findProductIdsWithEvents(products);
        return products.stream()
                .map(product -> ProductListItemResponse.from(product,
                        freshnessTags(product, withEvents.contains(product.getId()))))
                .toList();
    }

    // 상품 부분수정 — 등록자 본인만. events가 오면 이력을 전량 교체한다.
    @Transactional
    public ProductDetailResponse update(Long userId, Long productId, ProductUpdateRequest request) {
        getActiveUserForUpdate(userId);
        Product product = productRepository.findForUpdate(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        validateOwner(product, userId);
        if (request.getImageUrl() != null && Boolean.TRUE.equals(request.getRemoveImageUrl())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        // 수확일이나 생산 공간을 바꾸는 요청일 때만 재검증한다 —
        // 계약이 끝난 뒤에도 재고·상태 같은 나머지 항목은 계속 수정할 수 있어야 한다.
        // PATCH의 'null = 변경 없음' 규약을 따라 적용 후 최종값으로 본다.
        if (request.getHarvestDate() != null || request.getSpaceId() != null) {
            LocalDate harvestDate = request.getHarvestDate() != null
                    ? request.getHarvestDate() : product.getHarvestDate();
            Long spaceId = request.getSpaceId() != null
                    ? request.getSpaceId() : product.getSpaceId();
            validateHarvestDateInContract(userId, spaceId, harvestDate);
        }

        ProductCategory category = request.getCategory() == null ? null : parseCategory(request.getCategory());
        ProductStatus status = request.getStatus() == null ? null : parseStatus(request.getStatus());
        // producerName은 수정 대상이 아니다(등록 시 닉네임으로 고정) — null을 넘겨 기존 값을 유지한다.
        product.update(request.getName(), category, request.getPrice(), request.getUnit(),
                request.getStock(), request.getImageUrl(), request.getDescription(),
                request.getHarvestDate(), null, request.getProductionLocation(),
                request.getAddress(), request.getLatitude(), request.getLongitude(),
                request.getSpaceId(), request.getFoodMileageKm(), status);
        if (Boolean.TRUE.equals(request.getRemoveImageUrl())) {
            product.clearImageUrl();
        }
        // 재고를 함께 보충하는 요청은 허용하되, 적용 결과가 0이면 공개 판매를 재개할 수 없다.
        if (status == ProductStatus.ON_SALE && product.getStock() <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        List<ProductTraceabilityEvent> events;
        if (request.getEvents() != null) {
            eventRepository.deleteByProductId(productId);
            events = saveEvents(product, request.getEvents());
        } else {
            events = eventRepository.findByProductIdOrderBySortOrderAscOccurredAtAsc(productId);
        }

        // @LastModifiedDate를 응답에 반영하기 위해 flush
        productRepository.flush();
        return ProductDetailResponse.from(product, product.getSeller().getNickname(),
                freshnessTags(product, !events.isEmpty()), events);
    }

    // 상품 삭제 — Soft Delete. 등록자 본인만.
    @Transactional
    public ProductDeleteResponse delete(Long userId, Long productId) {
        getActiveUserForUpdate(userId);
        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        validateOwner(product, userId);
        product.softDelete();
        return ProductDeleteResponse.of(productId, true);
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────────

    private void validateOwner(Product product, Long userId) {
        if (!product.getSeller().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_PRODUCT_OWNER);
        }
    }

    // 수확일은 판매자의 확정 계약 기간 안이어야 한다 — 계약하지 않은 기간에 수확한 생산물이 마켓에 오르는 것을 막는다.
    // spaceId가 지정되면 그 공간의 계약만, 없으면 판매자의 확정 계약 전체를 본다(하나라도 품으면 통과).
    // FARMER 역할은 매칭 수락으로만 얻으므로 확정 계약이 0건이면 그 자체가 비정상이다 — 같은 코드로 막는다.
    private void validateHarvestDateInContract(Long sellerId, Long spaceId, LocalDate harvestDate) {
        if (matchingRepository.countContractsCovering(sellerId, spaceId, harvestDate) == 0) {
            throw new BusinessException(ErrorCode.HARVEST_DATE_OUT_OF_CONTRACT);
        }
    }

    private User getActiveUserForUpdate(Long userId) {
        return userRepository.findActiveByIdForUpdate(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    // 등록/수정용 카테고리 파싱 — 유효하지 않으면 400.
    private ProductCategory parseCategory(String value) {
        ProductCategory category = ProductCategory.fromLabel(value);
        if (category == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        return category;
    }

    // 목록 필터용 카테고리 파싱 — 미지정/'전체'면 null(전부), 그 외는 검증.
    private ProductCategory parseListCategory(String value) {
        if (!hasText(value) || CATEGORY_ALL.equals(value)) {
            return null;
        }
        return parseCategory(value);
    }

    private ProductStatus parseStatus(String value) {
        try {
            return ProductStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }

    // 이력 이벤트 저장 — 배열 순서대로 sortOrder를 매긴다(요청에 sortOrder가 있으면 그 값 우선). null/빈 배열이면 빈 목록.
    private List<ProductTraceabilityEvent> saveEvents(Product product, List<TraceabilityEventRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        List<ProductTraceabilityEvent> events = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            TraceabilityEventRequest req = requests.get(i);
            int sortOrder = req.getSortOrder() != null ? req.getSortOrder() : i;
            events.add(ProductTraceabilityEvent.builder()
                    .product(product)
                    .stage(req.getStage())
                    .description(req.getDescription())
                    .occurredAt(req.getOccurredAt())
                    .sortOrder(sortOrder)
                    .build());
        }
        return eventRepository.saveAll(events);
    }

    // 목록 카드의 '이력 확인' 뱃지 계산용 — 이벤트가 있는 상품 id 집합을 한 번에 조회.
    private Set<Long> findProductIdsWithEvents(List<Product> products) {
        if (products.isEmpty()) {
            return Set.of();
        }
        List<Long> productIds = products.stream().map(Product::getId).toList();
        return new HashSet<>(eventRepository.findProductIdsWithEvents(productIds));
    }

    // freshnessTags 파생 — 저장하지 않고 응답 생성 시 규칙으로 만든다.
    private List<String> freshnessTags(Product product, boolean hasTrace) {
        List<String> tags = new ArrayList<>();
        if (product.getHarvestDate() != null && product.getHarvestDate().isEqual(LocalDate.now())) {
            tags.add("오늘 수확");
        }
        if (hasTrace) {
            tags.add("이력 확인");
        }
        Double km = product.getFoodMileageKm();
        if (km != null && km <= NEAR_FARM_KM) {
            tags.add("근거리 농장");
        }
        if (km != null && km <= LOW_MILEAGE_KM) {
            tags.add("낮은 푸드 마일리지");
        }
        return tags;
    }

    private String emptyToNull(String value) {
        return hasText(value) ? value : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
