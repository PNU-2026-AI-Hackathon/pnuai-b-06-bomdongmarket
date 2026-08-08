package com.farmbroker.farmbroker.product.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.product.dto.ProductCreateRequest;
import com.farmbroker.farmbroker.product.dto.ProductDeleteResponse;
import com.farmbroker.farmbroker.product.dto.ProductDetailResponse;
import com.farmbroker.farmbroker.product.dto.ProductListItemResponse;
import com.farmbroker.farmbroker.product.dto.ProductUpdateRequest;
import com.farmbroker.farmbroker.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// product(로컬마켓) 도메인 엔드포인트. 얇게 유지: 서비스 위임 + ApiResponse 래핑만 한다.
// 인증 사용자는 @AuthenticationPrincipal Long userId로 주입받는다.
//
// [프론트 참고] 목록/상세는 비로그인 조회 허용, 등록/수정/삭제는 로그인 필요.
//              등록 UI는 이 계약을 기준으로 추후 구현한다(당근마켓 스타일 CRUD).
@Tag(name = "로컬마켓", description = "상품 등록/조회/수정/삭제 API")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private static final String MSG_CREATE_SUCCESS = "상품 등록이 완료되었습니다.";
    private static final String MSG_GET_LIST_SUCCESS = "상품 목록 조회에 성공했습니다.";
    private static final String MSG_GET_MY_LIST_SUCCESS = "내 판매 상품 조회에 성공했습니다.";
    private static final String MSG_GET_DETAIL_SUCCESS = "상품 상세 조회에 성공했습니다.";
    private static final String MSG_UPDATE_SUCCESS = "상품 정보가 수정되었습니다.";
    private static final String MSG_DELETE_SUCCESS = "상품이 삭제되었습니다.";

    private final ProductService productService;

    // POST /api/products — 상품 등록 (로그인 필요)
    @Operation(summary = "상품 등록 (로그인 필요)", description = "인증된 사용자면 누구나 등록할 수 있다. sellerId는 body로 받지 않고 토큰에서 식별한다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductDetailResponse> create(@AuthenticationPrincipal Long userId,
                                                     @RequestBody @Valid ProductCreateRequest request) {
        ProductDetailResponse response = productService.create(userId, request);
        return ApiResponse.success(MSG_CREATE_SUCCESS, response);
    }

    // GET /api/products — 상품 목록 조회 (비로그인 허용). keyword=상품명/생산위치, category='전체' 시 전부
    @Operation(summary = "상품 목록 조회 (비로그인 허용)", description = "keyword 검색(상품명·생산위치), category 필터(전체/잎채소/허브/과채류), 최신순")
    @GetMapping
    public ApiResponse<List<ProductListItemResponse>> getList(@RequestParam(required = false) String keyword,
                                                              @RequestParam(required = false) String category) {
        List<ProductListItemResponse> response = productService.getList(keyword, category);
        return ApiResponse.success(MSG_GET_LIST_SUCCESS, response);
    }

    // GET /api/products/my — 내가 등록한 상품 (인증 필요)
    // /{productId}보다 먼저 선언해 경로 우선순위를 명시한다.
    @Operation(summary = "내 판매 상품 조회 (인증 필요)")
    @GetMapping("/my")
    public ApiResponse<List<ProductListItemResponse>> getMy(@AuthenticationPrincipal Long userId) {
        List<ProductListItemResponse> response = productService.getMy(userId);
        return ApiResponse.success(MSG_GET_MY_LIST_SUCCESS, response);
    }

    // GET /api/products/{productId} — 상품 상세 조회 (비로그인 허용)
    @Operation(summary = "상품 상세 조회 (비로그인 허용)", description = "판매자 닉네임·위치·생산 이력 이벤트를 포함한다.")
    @GetMapping("/{productId}")
    public ApiResponse<ProductDetailResponse> getDetail(@PathVariable Long productId) {
        ProductDetailResponse response = productService.getDetail(productId);
        return ApiResponse.success(MSG_GET_DETAIL_SUCCESS, response);
    }

    // PATCH /api/products/{productId} — 상품 부분수정 (등록자 본인만)
    @Operation(summary = "상품 부분 수정 (등록자 본인만)", description = "null이 아닌 필드만 반영. events가 오면 생산 이력을 전량 교체한다.")
    @PatchMapping("/{productId}")
    public ApiResponse<ProductDetailResponse> update(@AuthenticationPrincipal Long userId,
                                                     @PathVariable Long productId,
                                                     @RequestBody @Valid ProductUpdateRequest request) {
        ProductDetailResponse response = productService.update(userId, productId, request);
        return ApiResponse.success(MSG_UPDATE_SUCCESS, response);
    }

    // DELETE /api/products/{productId} — 상품 삭제 (Soft Delete, 등록자 본인만)
    @Operation(summary = "상품 삭제 (Soft Delete, 등록자 본인만)")
    @DeleteMapping("/{productId}")
    public ApiResponse<ProductDeleteResponse> delete(@AuthenticationPrincipal Long userId,
                                                     @PathVariable Long productId) {
        ProductDeleteResponse response = productService.delete(userId, productId);
        return ApiResponse.success(MSG_DELETE_SUCCESS, response);
    }
}
