package com.farmbroker.farmbroker.product.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.product.domain.Product;
import com.farmbroker.farmbroker.product.domain.ProductCategory;
import com.farmbroker.farmbroker.product.dto.ProductCreateRequest;
import com.farmbroker.farmbroker.product.dto.ProductDetailResponse;
import com.farmbroker.farmbroker.product.dto.ProductUpdateRequest;
import com.farmbroker.farmbroker.product.repository.ProductRepository;
import com.farmbroker.farmbroker.product.repository.ProductTraceabilityEventRepository;
import com.farmbroker.farmbroker.user.domain.User;
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
import static org.mockito.BDDMockito.given;

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

    @InjectMocks
    private ProductService productService;

    private User seller(String nickname) {
        return User.builder()
                .email("seller@example.com")
                .password("hashed")
                .nickname(nickname)
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
    @DisplayName("생산자명을 입력하지 않으면 판매자 닉네임으로 채운다")
    void createDefaultsProducerNameToNickname() {
        given(userRepository.findById(1L)).willReturn(Optional.of(seller("어반리프")));
        given(productRepository.save(any(Product.class))).willAnswer(inv -> inv.getArgument(0));

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
        given(userRepository.findById(1L)).willReturn(Optional.of(seller("어반리프")));
        given(productRepository.save(any(Product.class))).willAnswer(inv -> inv.getArgument(0));
        given(eventRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

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
        given(productRepository.findByIdAndDeletedFalse(10L)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.update(2L, 10L, updateRequest("{ \"price\": 5000 }")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NOT_PRODUCT_OWNER);
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
        given(userRepository.findById(1L)).willReturn(Optional.of(seller("어반리프")));

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
}
