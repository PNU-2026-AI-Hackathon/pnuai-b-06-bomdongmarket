package com.farmbroker.farmbroker.space.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.space.dto.SpaceCreateRequest;
import com.farmbroker.farmbroker.space.dto.SpaceDeleteResponse;
import com.farmbroker.farmbroker.space.dto.SpaceDetailResponse;
import com.farmbroker.farmbroker.space.dto.SpaceListItemResponse;
import com.farmbroker.farmbroker.space.dto.SpaceListResponse;
import com.farmbroker.farmbroker.space.dto.SpaceResponse;
import com.farmbroker.farmbroker.space.dto.SpaceUpdateRequest;
import com.farmbroker.farmbroker.space.service.SpaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

// space 도메인 엔드포인트. 얇게 유지: 서비스 위임 + ApiResponse 래핑만 한다.
// context-path(/api)는 설정에서 처리되므로 매핑에는 /spaces만 쓴다.
// 인증 사용자는 @AuthenticationPrincipal Long userId로 주입받는다 (JWT 필터가 principal에 userId 저장).
@Tag(name = "공간", description = "유휴 공간 등록/조회/수정/삭제 API")
@RestController
@RequestMapping("/spaces")
@RequiredArgsConstructor
public class SpaceController {

    // 응답 메시지 상수 — 문구 변경 시 여기만 수정한다
    private static final String MSG_CREATE_SUCCESS = "공간 등록이 완료되었습니다.";
    private static final String MSG_GET_LIST_SUCCESS = "공간 목록 조회에 성공했습니다.";
    private static final String MSG_GET_MY_LIST_SUCCESS = "내 공간 목록 조회에 성공했습니다.";
    private static final String MSG_GET_DETAIL_SUCCESS = "공간 상세 조회에 성공했습니다.";
    private static final String MSG_UPDATE_SUCCESS = "공간 정보가 수정되었습니다.";
    private static final String MSG_DELETE_SUCCESS = "공간이 삭제되었습니다.";

    private final SpaceService spaceService;

    // POST /api/spaces — 공간 등록 (OWNER만)
    @Operation(summary = "공간 등록 (OWNER 전용)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SpaceResponse> create(@AuthenticationPrincipal Long userId,
                                             @RequestBody @Valid SpaceCreateRequest request) {
        SpaceResponse response = spaceService.create(userId, request);
        return ApiResponse.success(MSG_CREATE_SUCCESS, response);
    }

    // GET /api/spaces — 공간 목록 조회: 검색/필터/정렬/페이징 (비로그인 허용)
    @Operation(summary = "공간 목록 조회 (비로그인 허용)", description = "keyword 검색, minArea/maxRent 필터, sort 정렬(latest 등), page/size 페이징")
    @GetMapping
    public ApiResponse<SpaceListResponse> getList(@RequestParam(required = false) String keyword,
                                                  @RequestParam(required = false) BigDecimal minArea,
                                                  @RequestParam(required = false) Integer maxRent,
                                                  @RequestParam(defaultValue = "latest") String sort,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        SpaceListResponse response = spaceService.getList(keyword, minArea, maxRent, sort, page, size);
        return ApiResponse.success(MSG_GET_LIST_SUCCESS, response);
    }

    // GET /api/spaces/my — 내가 등록한 공간 목록 (인증 필요)
    // /{spaceId}보다 먼저 선언해 경로 우선순위를 명시한다 (Spring은 정확 매칭을 우선하지만 가독성 목적)
    @Operation(summary = "내 공간 목록 조회 (인증 필요)")
    @GetMapping("/my")
    public ApiResponse<List<SpaceListItemResponse>> getMy(@AuthenticationPrincipal Long userId) {
        List<SpaceListItemResponse> response = spaceService.getMy(userId);
        return ApiResponse.success(MSG_GET_MY_LIST_SUCCESS, response);
    }

    // GET /api/spaces/{spaceId} — 공간 상세 조회 (비로그인 허용)
    @Operation(summary = "공간 상세 조회 (비로그인 허용)")
    @GetMapping("/{spaceId}")
    public ApiResponse<SpaceDetailResponse> getDetail(@PathVariable Long spaceId) {
        SpaceDetailResponse response = spaceService.getDetail(spaceId);
        return ApiResponse.success(MSG_GET_DETAIL_SUCCESS, response);
    }

    // PATCH /api/spaces/{spaceId} — 공간 부분수정 (등록자 본인만)
    @Operation(summary = "공간 부분 수정 (등록자 본인만)")
    @PatchMapping("/{spaceId}")
    public ApiResponse<SpaceResponse> update(@AuthenticationPrincipal Long userId,
                                             @PathVariable Long spaceId,
                                             @RequestBody @Valid SpaceUpdateRequest request) {
        SpaceResponse response = spaceService.update(userId, spaceId, request);
        return ApiResponse.success(MSG_UPDATE_SUCCESS, response);
    }

    // DELETE /api/spaces/{spaceId} — 공간 삭제 (Soft Delete, 등록자 본인만)
    @Operation(summary = "공간 삭제 (Soft Delete, 등록자 본인만)")
    @DeleteMapping("/{spaceId}")
    public ApiResponse<SpaceDeleteResponse> delete(@AuthenticationPrincipal Long userId,
                                                   @PathVariable Long spaceId) {
        SpaceDeleteResponse response = spaceService.delete(userId, spaceId);
        return ApiResponse.success(MSG_DELETE_SUCCESS, response);
    }
}
