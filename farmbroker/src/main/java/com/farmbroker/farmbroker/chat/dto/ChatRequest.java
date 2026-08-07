package com.farmbroker.farmbroker.chat.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 자연어 조회 챗봇 요청.
// 대화 이력은 아직 받지 않는다 — 이번 범위는 한 번의 질문을 한 번의 조회로 처리하는 단발성 조회다.
@Getter
@NoArgsConstructor
@Schema(description = "자연어 조회 요청")
public class ChatRequest {

    @Schema(description = "사용자 질문", example = "키우기 쉬운 작물 뭐가 있어?",
            requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "질문을 입력해 주세요.")
    @Size(max = 300, message = "질문은 300자 이하여야 합니다.")
    private String message;
}
