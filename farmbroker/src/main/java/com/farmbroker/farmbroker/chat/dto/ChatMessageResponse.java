package com.farmbroker.farmbroker.chat.dto;

import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import com.farmbroker.farmbroker.chat.domain.ChatMessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private final Long messageId;
    private final Long conversationId;
    private final Long senderId;
    private final ChatMessageType type;
    private final String text;
    private final String imagePath;
    private final String imageContentType;
    private final LocalDateTime createdAt;

    public static ChatMessageResponse from(ChatMessage message) {
        return ChatMessageResponse.builder()
                .messageId(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSenderId())
                .type(message.getType())
                .text(message.getText())
                .imagePath(message.hasImage() ? "/chat/messages/" + message.getId() + "/image" : null)
                .imageContentType(message.getImageContentType())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
