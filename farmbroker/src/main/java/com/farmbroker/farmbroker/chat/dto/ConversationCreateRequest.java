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
}
