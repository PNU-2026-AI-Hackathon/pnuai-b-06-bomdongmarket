package com.farmbroker.farmbroker.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ChatMessageListResponse {
    private final List<ChatMessageResponse> messages;
    private final Long nextBeforeId;
    private final boolean hasNext;
}
