package com.farmbroker.farmbroker.order.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.order.dto.WishlistItemRequest;
import com.farmbroker.farmbroker.order.dto.WishlistResponse;
import com.farmbroker.farmbroker.order.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// 찜(좋아요) 엔드포인트. 전부 로그인 필요(SecurityConfig의 anyRequest().authenticated()로 보호).
// 얇게 유지: 서비스 위임 + ApiResponse 래핑만 한다.
//
// [프론트 참고] 추가·삭제 모두 갱신된 찜 목록 전체를 돌려주므로 재조회할 필요가 없다.
// [프론트 참고] 이미 찜한 상품을 다시 추가해도 오류가 아니다 — 하트 연타에 안전하다.
@Tag(name = "찜", description = "찜 추가/조회/삭제 API")
@RestController
@RequiredArgsConstructor
public class WishlistController {

    private static final String MSG_GET_SUCCESS = "찜 목록 조회에 성공했습니다.";
    private static final String MSG_ADD_SUCCESS = "찜했습니다.";
    private static final String MSG_REMOVE_SUCCESS = "찜을 해제했습니다.";

    private final WishlistService wishlistService;

    @Operation(summary = "내 찜 목록 조회",
            description = "찜해 둔 뒤 품절·마감됐을 수 있어 줄마다 purchasable과 현재 재고를 함께 내려준다.")
    @GetMapping("/wishlist")
    public ApiResponse<WishlistResponse> get(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(MSG_GET_SUCCESS, wishlistService.get(userId));
    }

    @Operation(summary = "찜 추가", description = "이미 찜한 상품이면 목록을 그대로 돌려준다.")
    @PostMapping("/wishlist/items")
    public ApiResponse<WishlistResponse> add(@AuthenticationPrincipal Long userId,
                                             @Valid @RequestBody WishlistItemRequest request) {
        return ApiResponse.success(MSG_ADD_SUCCESS, wishlistService.add(userId, request.getProductId()));
    }

    @Operation(summary = "찜 해제")
    @DeleteMapping("/wishlist/items/{productId}")
    public ApiResponse<WishlistResponse> remove(@AuthenticationPrincipal Long userId,
                                                @PathVariable Long productId) {
        return ApiResponse.success(MSG_REMOVE_SUCCESS, wishlistService.remove(userId, productId));
    }
}
