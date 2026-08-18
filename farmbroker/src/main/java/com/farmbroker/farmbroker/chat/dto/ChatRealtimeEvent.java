package com.farmbroker.farmbroker.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRealtimeEvent {
    private final String type;
    private final Long conversationId;
    private final ChatMessageResponse message;
    private final long unreadCount;
}
