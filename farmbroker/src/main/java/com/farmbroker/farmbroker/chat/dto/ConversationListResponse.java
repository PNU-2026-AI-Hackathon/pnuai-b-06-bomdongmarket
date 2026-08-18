package com.farmbroker.farmbroker.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ConversationListResponse {
    private final List<ConversationResponse> conversations;
    private final int page;
    private final int size;
    private final boolean hasNext;
}
