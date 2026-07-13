package com.farmbroker.farmbroker.crop.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.crop.dto.CropDetailResponse;
import com.farmbroker.farmbroker.crop.dto.CropListResponse;
import com.farmbroker.farmbroker.crop.service.CropService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 작물 백과사전 공개 API 컨트롤러 (비로그인 접근 허용 — SecurityConfig permitAll 등록).
@Tag(name = "작물 백과", description = "작물 백과사전 공개 조회 API (비로그인 허용)")
@RestController
@RequestMapping("/crops")
@RequiredArgsConstructor
public class CropController {

    private final CropService cropService;

    // GET /api/crops?keyword=&category=&difficulty= — 작물 목록 (필터 전부 선택)
    @Operation(summary = "작물 목록 조회", description = "keyword · category · difficulty 필터는 모두 선택값")
    @GetMapping
    public ApiResponse<List<CropListResponse>> getCrops(@RequestParam(required = false) String keyword,
                                                        @RequestParam(required = false) String category,
                                                        @RequestParam(required = false) String difficulty) {
        List<CropListResponse> response = cropService.getCrops(keyword, category, difficulty);
        return ApiResponse.success("작물 목록 조회에 성공했습니다.", response);
    }

    // GET /api/crops/{cropId} — 작물 상세
    @Operation(summary = "작물 상세 조회")
    @GetMapping("/{cropId}")
    public ApiResponse<CropDetailResponse> getCrop(@PathVariable Long cropId) {
        CropDetailResponse response = cropService.getCrop(cropId);
        return ApiResponse.success("작물 상세 조회에 성공했습니다.", response);
    }
}
