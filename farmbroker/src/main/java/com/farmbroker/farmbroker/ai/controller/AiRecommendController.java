package com.farmbroker.farmbroker.ai.controller;

import com.farmbroker.farmbroker.ai.dto.AiRecommendOutcome;
import com.farmbroker.farmbroker.ai.dto.AiRecommendRequest;
import com.farmbroker.farmbroker.ai.dto.AiRecommendResponse;
import com.farmbroker.farmbroker.ai.service.AiRecommendService;
import com.farmbroker.farmbroker.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// AI 추천 엔드포인트 컨트롤러.
// 권한은 로그인만 요구(역할 제한 없음) — OWNER도 "내 공간에 뭘 키우면 좋을까"를 조회할 수 있게 열어둔다 (팀 확정).
@Tag(name = "AI 추천", description = "Gemini 2.5 Structured Output 기반 작물·공간 활용 추천 API (로그인 필요, 역할 제한 없음)")
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiRecommendController {

    private final AiRecommendService aiRecommendService;

    // POST /api/ai/recommend — 작물 및 공간 활용 추천
    @Operation(
            summary = "작물 및 공간 활용 추천",
            description = """
                    공간 조건과 사용자 요청, 서버의 작물 백과사전 데이터를 Gemini 2.5 Flash에 한 번 전달하고
                    JSON Schema로 제한된 추천 작물 2~3개, 추천 이유, 배치안, 주의사항을 반환합니다.

                    모델은 백과사전에 존재하는 cropId만 선택하며 서버가 중복·존재 여부·필수 문구를 다시 검증합니다.
                    expectedYieldKg는 `㎡당 수확량 × 공간 면적`으로 서버가 계산하고,
                    avgPricePerKg도 모델이 생성하지 않고 작물 데이터의 기준 단가를 사용합니다.

                    Gemini timeout 또는 quota 초과 시 같은 공간의 이전 추천이 있으면 HTTP 200과
                    `이전 추천 결과를 표시합니다.` 메시지로 반환합니다. 이전 추천이 없으면 원래 AI 오류를 반환합니다.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    description = "spaceId만 필수이며 나머지 값은 추천 개인화를 위한 선택 입력입니다.",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AiRecommendRequest.class),
                            examples = @ExampleObject(
                                    name = "소규모 부업 추천 요청",
                                    value = """
                                            {
                                              "spaceId": 1,
                                              "preferredCrop": "상추",
                                              "purpose": "소규모 부업",
                                              "additionalInfo": "초기 비용을 최대한 줄이고 싶습니다."
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "신규 AI 추천 또는 저장된 이전 추천 반환",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class),
                            examples = {
                                    @ExampleObject(
                                            name = "신규 추천",
                                            value = """
                                                    {
                                                      "success": true,
                                                      "message": "AI 추천이 완료되었습니다.",
                                                      "data": {
                                                        "recommendationId": 15,
                                                        "spaceId": 1,
                                                        "recommendedCrops": [
                                                          {
                                                            "cropName": "상추",
                                                            "cropId": 1,
                                                            "reason": "재배 난도가 낮고 회전이 빨라 초기 비용을 줄이려는 소규모 부업에 적합합니다.",
                                                            "expectedYieldKg": 175,
                                                            "avgPricePerKg": 7000
                                                          },
                                                          {
                                                            "cropName": "루꼴라",
                                                            "cropId": 4,
                                                            "reason": "재배 기간이 짧고 공간 활용 효율이 좋습니다.",
                                                            "expectedYieldKg": 100,
                                                            "avgPricePerKg": 15000
                                                          }
                                                        ],
                                                        "layoutSuggestion": "벽면에 다단 재배대를 배치하고 중앙에 작업 통로를 확보하세요.",
                                                        "cautions": ["고온기에는 환기와 실내 온도를 확인하세요."],
                                                        "createdAt": "2026-07-18T10:30:00"
                                                      }
                                                    }
                                                    """
                                    ),
                                    @ExampleObject(
                                            name = "이전 추천 fallback",
                                            value = """
                                                    {
                                                      "success": true,
                                                      "message": "이전 추천 결과를 표시합니다.",
                                                      "data": {
                                                        "recommendationId": 12,
                                                        "spaceId": 1,
                                                        "recommendedCrops": [
                                                          {
                                                            "cropName": "상추",
                                                            "cropId": 1,
                                                            "reason": "저장된 이전 추천 이유",
                                                            "expectedYieldKg": 175,
                                                            "avgPricePerKg": 7000
                                                          }
                                                        ],
                                                        "layoutSuggestion": "저장된 이전 배치 제안",
                                                        "cautions": [],
                                                        "createdAt": "2026-07-17T15:00:00"
                                                      }
                                                    }
                                                    """
                                    )
                            }
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "요청 필드 검증 실패",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"공간 ID는 필수입니다.","errorCode":"VALIDATION_ERROR"}
                            """))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "JWT 인증 필요"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "사용자 또는 공간을 찾을 수 없음",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"공간을 찾을 수 없습니다.","errorCode":"SPACE_NOT_FOUND"}
                            """))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "429",
                    description = "Gemini quota 초과 및 이전 추천 없음",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"AI 요청 한도를 초과했습니다.","errorCode":"AI_QUOTA_EXCEEDED"}
                            """))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "502",
                    description = "Gemini 응답 형식 또는 의미 검증 실패",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"AI 응답 처리에 실패했습니다.","errorCode":"AI_RESPONSE_INVALID"}
                            """))
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "504",
                    description = "Gemini timeout 및 이전 추천 없음",
                    content = @Content(mediaType = "application/json", examples = @ExampleObject(value = """
                            {"success":false,"message":"AI 응답 시간이 초과되었습니다.","errorCode":"AI_TIMEOUT"}
                            """))
            )
    })
    @PostMapping("/recommend")
    public ApiResponse<AiRecommendResponse> recommend(@RequestBody @Valid AiRecommendRequest request,
                                                      @AuthenticationPrincipal Long userId) {
        AiRecommendOutcome outcome = aiRecommendService.recommend(userId, request);
        String message = outcome.fallback() ? "이전 추천 결과를 표시합니다." : "AI 추천이 완료되었습니다.";
        return ApiResponse.success(message, outcome.response());
    }
}
