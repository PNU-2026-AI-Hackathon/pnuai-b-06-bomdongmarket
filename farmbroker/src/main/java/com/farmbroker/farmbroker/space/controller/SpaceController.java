package com.farmbroker.farmbroker.space.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.space.dto.SpaceCreateRequest;
import com.farmbroker.farmbroker.space.dto.SpaceResponse;
import com.farmbroker.farmbroker.space.service.SpaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// space 도메인 엔드포인트. 얇게 유지: 서비스 위임 + ApiResponse 래핑만 한다.
// context-path(/api)는 설정에서 처리되므로 매핑에는 /spaces만 쓴다.
// 인증 사용자는 @AuthenticationPrincipal Long userId로 주입받는다 (JWT 필터가 principal에 userId 저장).
@RestController
@RequestMapping("/spaces")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;

    // POST /api/spaces — 공간 등록 (OWNER만)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SpaceResponse> create(@AuthenticationPrincipal Long userId,
                                             @RequestBody @Valid SpaceCreateRequest request) {
        SpaceResponse response = spaceService.create(userId, request);
        return ApiResponse.success("공간 등록이 완료되었습니다.", response);
    }
}
