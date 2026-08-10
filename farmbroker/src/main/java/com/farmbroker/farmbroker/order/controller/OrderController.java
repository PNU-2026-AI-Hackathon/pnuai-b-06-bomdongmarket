package com.farmbroker.farmbroker.order.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.order.dto.CartItemRequest;
import com.farmbroker.farmbroker.order.dto.CartQuantityRequest;
import com.farmbroker.farmbroker.order.dto.CartResponse;
import com.farmbroker.farmbroker.order.dto.OrderResponse;
import com.farmbroker.farmbroker.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// 장바구니·결제 엔드포인트. 전부 로그인 필요(SecurityConfig의 anyRequest().authenticated()로 보호).
// 얇게 유지: 서비스 위임 + ApiResponse 래핑만 한다.
//
// [프론트 참고] 담기·수량변경·삭제는 모두 갱신된 장바구니 전체를 돌려주므로 재조회할 필요가 없다.
// [프론트 참고] 결제는 실제 PG 연동 없이 주문 확정 + 재고 차감까지만 한다.
//               재고가 0이 되면 상품이 판매 마감으로 바뀌어 공개 목록에서 빠진다.
@Tag(name = "장바구니·결제", description = "장바구니 담기/조회/수정/삭제, 결제 확정 API")
@RestController
@RequiredArgsConstructor
public class OrderController {

    private static final String MSG_GET_CART_SUCCESS = "장바구니 조회에 성공했습니다.";
    private static final String MSG_ADD_SUCCESS = "장바구니에 담았습니다.";
    private static final String MSG_QUANTITY_SUCCESS = "수량을 변경했습니다.";
    private static final String MSG_REMOVE_SUCCESS = "장바구니에서 뺐습니다.";
    private static final String MSG_CHECKOUT_SUCCESS = "결제가 완료되었습니다.";

    private final OrderService orderService;

    @Operation(summary = "내 장바구니 조회",
            description = "담아 둔 뒤 품절·마감됐을 수 있어 줄마다 purchasable과 현재 재고를 함께 내려준다.")
    @GetMapping("/cart")
    public ApiResponse<CartResponse> getCart(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(MSG_GET_CART_SUCCESS, orderService.getCart(userId));
    }

    @Operation(summary = "장바구니에 담기",
            description = "같은 상품을 다시 담으면 수량을 더한다. 재고를 넘으면 409 OUT_OF_STOCK.")
    @PostMapping("/cart/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CartResponse> addToCart(@AuthenticationPrincipal Long userId,
                                               @RequestBody @Valid CartItemRequest request) {
        return ApiResponse.success(MSG_ADD_SUCCESS, orderService.addToCart(userId, request));
    }

    @Operation(summary = "장바구니 수량 변경", description = "0으로 줄이는 대신 삭제 API를 쓴다.")
    @PatchMapping("/cart/items/{productId}")
    public ApiResponse<CartResponse> changeQuantity(@AuthenticationPrincipal Long userId,
                                                    @PathVariable Long productId,
                                                    @RequestBody @Valid CartQuantityRequest request) {
        return ApiResponse.success(MSG_QUANTITY_SUCCESS,
                orderService.changeQuantity(userId, productId, request.getQuantity()));
    }

    @Operation(summary = "장바구니에서 빼기")
    @DeleteMapping("/cart/items/{productId}")
    public ApiResponse<CartResponse> removeFromCart(@AuthenticationPrincipal Long userId,
                                                    @PathVariable Long productId) {
        return ApiResponse.success(MSG_REMOVE_SUCCESS, orderService.removeFromCart(userId, productId));
    }

    @Operation(summary = "결제 확정",
            description = "장바구니 전체를 주문으로 옮기고 재고를 줄인다. 실제 결제(PG)는 연동하지 않는다. "
                    + "한 줄이라도 재고가 모자라면 전체를 되돌린다(409 OUT_OF_STOCK).")
    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrderResponse> checkout(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(MSG_CHECKOUT_SUCCESS, orderService.checkout(userId));
    }
}
