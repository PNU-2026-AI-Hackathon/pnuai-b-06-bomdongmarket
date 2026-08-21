package com.farmbroker.farmbroker.product.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
import com.farmbroker.farmbroker.product.dto.ProductCreateRequest;
import com.farmbroker.farmbroker.product.dto.ProductDetailResponse;
import com.farmbroker.farmbroker.product.dto.ProductUpdateRequest;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.product.repository.ProductTraceabilityEventRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.domain.UserRole;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

// 로컬마켓 상품 서비스의 핵심 규칙을 검증한다.
// DB 없이 돌도록 레포지토리는 목으로 대체한다(이 프로젝트는 H2 없이 MySQL만 쓴다).
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    // 바인딩 전용(setter 없는) DTO를 실제 요청과 같은 역직렬화 경로로 만든다. LocalDate 처리를 위해 JavaTimeModule 등록.
    private static final ObjectMapper MAPPER = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductTraceabilityEventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MatchingRepository matchingRepository;

    @InjectMocks
    private ProductService productService;

    // 판매자는 매칭이 수락돼 FARMER 역할을 가진 사용자다(상품 등록 자격).
    private User seller(String nickname) {
        return User.builder()
                .email("seller@example.com")
                .password("hashed")
                .nickname(nickname)
                .roles(java.util.Set.of(UserRole.CONSUMER, UserRole.FARMER))
                .build();
    }

    private ProductCreateRequest createRequest(String json) {
        try {
            return MAPPER.readValue(json, ProductCreateRequest.class);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private ProductUpdateRequest updateRequest(String json) {
        try {
            return MAPPER.readValue(json, ProductUpdateRequest.class);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    @DisplayName("생산자명은 요청과 무관하게 판매자 닉네임으로 고정된다")
    void createFixesProducerNameToNickname() {
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(seller("어반리프")));
        given(productRepository.save(any(Product.class))).willAnswer(inv -> inv.getArgument(0));
        given(matchingRepository.countContractsCovering(eq(1L), any(), any())).willReturn(1L);

        ProductDetailResponse response = productService.create(1L, createRequest("""
                {
                  "name": "버터헤드 상추",
                  "category": "잎채소",
                  "price": 4300,
                  "unit": "팩",
                  "stock": 24,
                  "harvestDate": "2026-07-05",
                  "productionLocation": "장전 스마트팜"
                }
                """));

        assertThat(response.getProducerName()).isEqualTo("어반리프");
        assertThat(response.getCategory()).isEqualTo("잎채소");
    }

    @Test
    @DisplayName("오늘 수확·근거리·이력 조건을 만족하면 freshnessTags가 모두 파생된다")
    void createDerivesFreshnessTags() {
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(seller("어반리프")));
        given(productRepository.save(any(Product.class))).willAnswer(inv -> inv.getArgument(0));
        given(eventRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));
        given(matchingRepository.countContractsCovering(eq(1L), any(), any())).willReturn(1L);

        String today = LocalDate.now().toString();
        ProductDetailResponse response = productService.create(1L, createRequest("""
                {
                  "name": "버터헤드 상추",
                  "category": "잎채소",
                  "price": 4300,
                  "unit": "팩",
                  "stock": 24,
                  "harvestDate": "%s",
                  "productionLocation": "장전 스마트팜",
                  "foodMileageKm": 3.2,
                  "events": [
                    { "stage": "수확", "occurredAt": "%s" }
                  ]
                }
                """.formatted(today, today)));

        assertThat(response.getFreshnessTags())
                .containsExactlyInAnyOrder("오늘 수확", "이력 확인", "근거리 농장", "낮은 푸드 마일리지");
        assertThat(response.getTraceabilityEvents()).hasSize(1);
    }

    @Test
    @DisplayName("등록자가 아닌 사용자가 수정하면 NOT_PRODUCT_OWNER")
    void updateByNonOwnerThrows() {
        User owner = seller("어반리프");
        ReflectionTestUtils.setField(owner, "id", 1L);
        Product product = Product.builder()
                .seller(owner)
                .name("버터헤드 상추")
                .category(ProductCategory.LEAFY)
                .price(4300)
                .unit("팩")
                .stock(24)
                .harvestDate(LocalDate.of(2026, 7, 5))
                .producerName("어반리프")
                .productionLocation("장전 스마트팜")
                .build();
        given(userRepository.findActiveByIdForUpdate(2L)).willReturn(Optional.of(seller("다른 사용자")));
        given(productRepository.findForUpdate(10L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.update(2L, 10L, updateRequest("{ \"price\": 5000 }")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_PRODUCT_OWNER);
    }

    @Test
    @DisplayName("대표 사진 제거를 요청하면 이미지 URL을 비운다")
    void updateClearsImageUrl() {
        User owner = seller("어반리프");
        ReflectionTestUtils.setField(owner, "id", 1L);
        Product product = product(owner, 3, "https://example.com/files/product.jpg");
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(owner));
        given(productRepository.findForUpdate(10L)).willReturn(Optional.of(product));

        productService.update(1L, 10L, updateRequest("{ \"removeImageUrl\": true }"));

        assertThat(product.getImageUrl()).isNull();
    }

    @Test
    @DisplayName("대표 사진 URL과 제거 요청을 함께 보내면 VALIDATION_ERROR")
    void updateRejectsImageUrlAndRemovalTogether() {
        User owner = seller("어반리프");
        ReflectionTestUtils.setField(owner, "id", 1L);
        Product product = product(owner, 3, "https://example.com/files/old.jpg");
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(owner));
        given(productRepository.findForUpdate(10L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.update(1L, 10L, updateRequest("""
                {
                  "imageUrl": "https://example.com/files/new.jpg",
                  "removeImageUrl": true
                }
                """)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.VALIDATION_ERROR);
    }

    @Test
    @DisplayName("재고가 0인 상품은 판매를 재개할 수 없다")
    void updateRejectsReopeningWithoutStock() {
        User owner = seller("어반리프");
        ReflectionTestUtils.setField(owner, "id", 1L);
        Product product = product(owner, 1, null);
        product.reduceStock(1);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(owner));
        given(productRepository.findForUpdate(10L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.update(
                1L, 10L, updateRequest("{ \"status\": \"ON_SALE\" }")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.VALIDATION_ERROR);
    }

    @Test
    @DisplayName("존재하지 않는 상품 상세 조회는 PRODUCT_NOT_FOUND")
    void getDetailNotFound() {
        given(productRepository.findByIdAndDeletedFalse(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getDetail(99L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.PRODUCT_NOT_FOUND);
    }

    @Test
    @DisplayName("잘못된 카테고리는 VALIDATION_ERROR")
    void createInvalidCategory() {
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(seller("어반리프")));

        assertThatThrownBy(() -> productService.create(1L, createRequest("""
                {
                  "name": "버터헤드 상추",
                  "category": "존재하지않는카테고리",
                  "price": 4300,
                  "unit": "팩",
                  "stock": 24,
                  "harvestDate": "2026-07-05",
                  "productionLocation": "장전 스마트팜"
                }
                """)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.VALIDATION_ERROR);
    }

    @Test
    @DisplayName("FARMER 역할이 없는 사용자가 등록하면 FORBIDDEN_ROLE")
    void createByNonFarmerThrows() {
        User consumer = User.builder()
                .email("consumer@example.com")
                .password("hashed")
                .nickname("소비자")
                .roles(java.util.Set.of(UserRole.CONSUMER))
                .build();
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(consumer));

        assertThatThrownBy(() -> productService.create(1L, createRequest("""
                {
                  "name": "버터헤드 상추",
                  "category": "잎채소",
                  "price": 4300,
                  "unit": "팩",
                  "stock": 24,
                  "harvestDate": "2026-07-05",
                  "productionLocation": "장전 스마트팜"
                }
                """)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN_ROLE);
    }

    @Test
    @DisplayName("수확일이 계약 기간 밖이면 등록할 수 없다")
    void createRejectsHarvestDateOutsideContract() {
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(seller("어반리프")));
        given(matchingRepository.countContractsCovering(eq(1L), eq(7L), eq(LocalDate.of(2027, 1, 1)))).willReturn(0L);

        assertThatThrownBy(() -> productService.create(1L, createRequest("""
                {
                  "name": "버터헤드 상추",
                  "category": "잎채소",
                  "price": 4300,
                  "unit": "팩",
                  "stock": 24,
                  "harvestDate": "2027-01-01",
                  "productionLocation": "장전 스마트팔",
                  "spaceId": 7
                }
                """)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.HARVEST_DATE_OUT_OF_CONTRACT);
    }

    @Test
    @DisplayName("확정 계약이 하나도 없는 판매자는 등록할 수 없다")
    void createRejectsSellerWithoutContract() {
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(seller("어반리프")));
        // spaceId를 안 보낸 요청은 판매자의 계약 전체를 보지만, 그러고도 0건이면 막힌다.
        given(matchingRepository.countContractsCovering(eq(1L), eq(null), any())).willReturn(0L);

        assertThatThrownBy(() -> productService.create(1L, createRequest("""
                {
                  "name": "버터헤드 상추",
                  "category": "잎채소",
                  "price": 4300,
                  "unit": "팩",
                  "stock": 24,
                  "harvestDate": "2026-07-05",
                  "productionLocation": "장전 스마트팔"
                }
                """)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.HARVEST_DATE_OUT_OF_CONTRACT);
    }

    @Test
    @DisplayName("수확일을 계약 기간 밖으로 수정할 수 없다")
    void updateRejectsHarvestDateOutsideContract() {
        User owner = seller("어반리프");
        ReflectionTestUtils.setField(owner, "id", 1L);
        Product product = product(owner, 3, null);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(owner));
        given(productRepository.findForUpdate(10L)).willReturn(Optional.of(product));
        given(matchingRepository.countContractsCovering(eq(1L), any(), eq(LocalDate.of(2027, 1, 1)))).willReturn(0L);

        assertThatThrownBy(() -> productService.update(
                1L, 10L, updateRequest("{ \"harvestDate\": \"2027-01-01\" }")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.HARVEST_DATE_OUT_OF_CONTRACT);
    }

    @Test
    @DisplayName("수확일·공간을 건드리지 않는 수정은 계약을 조회하지 않는다")
    void updateWithoutHarvestDateSkipsContractCheck() {
        User owner = seller("어반리프");
        ReflectionTestUtils.setField(owner, "id", 1L);
        Product product = product(owner, 3, null);
        given(userRepository.findActiveByIdForUpdate(1L)).willReturn(Optional.of(owner));
        given(productRepository.findForUpdate(10L)).willReturn(Optional.of(product));

        productService.update(1L, 10L, updateRequest("{ \"stock\": 10 }"));

        assertThat(product.getStock()).isEqualTo(10);
        verifyNoInteractions(matchingRepository);
    }

    private Product product(User owner, int stock, String imageUrl) {
        return Product.builder()
                .seller(owner)
                .name("버터헤드 상추")
                .category(ProductCategory.LEAFY)
                .price(4300)
                .unit("팩")
                .stock(stock)
                .imageUrl(imageUrl)
                .harvestDate(LocalDate.of(2026, 7, 5))
                .producerName("어반리프")
                .productionLocation("장전 스마트팜")
                .build();
    }
}
