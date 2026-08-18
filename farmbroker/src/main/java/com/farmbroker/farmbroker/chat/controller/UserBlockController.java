package com.farmbroker.farmbroker.chat.controller;

import com.farmbroker.farmbroker.chat.dto.UserBlockResponse;
import com.farmbroker.farmbroker.chat.service.ChatBlockService;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "사용자 차단", description = "채팅 사용자 차단 및 해제 API")
@RestController
@RequestMapping("/blocks")
@RequiredArgsConstructor
public class UserBlockController {

    private final ChatBlockService blockService;

    @Operation(summary = "사용자 차단")
    @PostMapping("/{userId}")
    public ApiResponse<UserBlockResponse> block(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long userId) {
        return ApiResponse.success("사용자를 차단했습니다.",
                blockService.block(currentUserId, userId));
    }

    @Operation(summary = "사용자 차단 해제")
    @DeleteMapping("/{userId}")
    public ApiResponse<UserBlockResponse> unblock(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long userId) {
        return ApiResponse.success("사용자 차단을 해제했습니다.",
                blockService.unblock(currentUserId, userId));
    }
}
