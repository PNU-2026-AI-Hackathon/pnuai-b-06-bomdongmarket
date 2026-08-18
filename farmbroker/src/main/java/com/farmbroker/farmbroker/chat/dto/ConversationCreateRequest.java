package com.farmbroker.farmbroker.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ConversationCreateRequest {

    @NotBlank
    private String contextType;

    @NotNull
    @Positive
    private Long contextId;

    // 말을 걸 상대. 문의자가 주인에게 걸 때는 상대가 자명해서 비워 보낸다.
    // 공간 주인이 신청자에게 먼저 걸 때만 지목이 필요하다.
    @Positive
    private Long otherUserId;
}
