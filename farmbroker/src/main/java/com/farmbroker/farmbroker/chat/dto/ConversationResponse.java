package com.farmbroker.farmbroker.chat.dto;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ConversationResponse {
    private final Long conversationId;
    private final ChatContextType contextType;
    private final Long contextId;
    private final String contextTitle;
    private final String contextImageUrl;
    private final Long otherUserId;
    private final String otherUserNickname;
    private final String lastMessagePreview;
    private final LocalDateTime lastMessageAt;
    private final long unreadCount;
    private final boolean blocked;
}
