package com.farmbroker.farmbroker.order.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.order.dto.OrderCreateRequest;
import com.farmbroker.farmbroker.order.dto.OrderResponse;
import com.farmbroker.farmbroker.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// 주문 엔드포인트. 로그인 필요(SecurityConfig의 anyRequest().authenticated()로 보호).
// 얇게 유지: 서비스 위임 + ApiResponse 래핑만 한다.
//
// [프론트 참고] 실제 PG 연동 없이 주문 확정 + 재고 차감까지만 한다.
//               재고가 0이 되면 상품이 판매 마감으로 바뀌어 공개 목록에서 빠진다.
// [프론트 참고] 상품 하나가 주문 단위다. 거래는 채팅으로 협의하므로 묶음 결제를 두지 않는다.
@Tag(name = "주문", description = "상품 주문 확정 API")
@RestController
@RequiredArgsConstructor
public class OrderController {

    private static final String MSG_ORDER_SUCCESS = "결제가 완료되었습니다.";

    private final OrderService orderService;

    @Operation(summary = "주문 확정",
            description = "상품 하나를 주문하고 재고를 줄인다. 재고가 모자라면 409로 막는다.")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/orders")
    public ApiResponse<OrderResponse> order(@AuthenticationPrincipal Long userId,
                                            @Valid @RequestBody OrderCreateRequest request) {
        return ApiResponse.success(MSG_ORDER_SUCCESS, orderService.order(userId, request));
    }
}
