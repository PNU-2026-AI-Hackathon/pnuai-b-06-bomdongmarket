package com.farmbroker.farmbroker.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatReadResponse {
    private final Long conversationId;
    private final Long lastReadMessageId;
    private final long unreadCount;
}
