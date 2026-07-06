package com.farmbroker.farmbroker.crop.controller;

import com.farmbroker.farmbroker.common.response.ApiResponse;
import com.farmbroker.farmbroker.crop.dto.CropDetailResponse;
import com.farmbroker.farmbroker.crop.dto.CropListResponse;
import com.farmbroker.farmbroker.crop.service.CropService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 작물 백과사전 공개 API 컨트롤러 (비로그인 접근 허용 — SecurityConfig permitAll 등록).
@RestController
@RequestMapping("/crops")
@RequiredArgsConstructor
public class CropController {

    private final CropService cropService;

    // GET /api/crops?keyword=&category=&difficulty= — 작물 목록 (필터 전부 선택)
    @GetMapping
    public ApiResponse<List<CropListResponse>> getCrops(@RequestParam(required = false) String keyword,
                                                        @RequestParam(required = false) String category,
                                                        @RequestParam(required = false) String difficulty) {
        List<CropListResponse> response = cropService.getCrops(keyword, category, difficulty);
        return ApiResponse.success("작물 목록 조회에 성공했습니다.", response);
    }

    // GET /api/crops/{cropId} — 작물 상세
    @GetMapping("/{cropId}")
    public ApiResponse<CropDetailResponse> getCrop(@PathVariable Long cropId) {
        CropDetailResponse response = cropService.getCrop(cropId);
        return ApiResponse.success("작물 상세 조회에 성공했습니다.", response);
    }
}
