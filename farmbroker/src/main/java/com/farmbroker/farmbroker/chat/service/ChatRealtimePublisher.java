package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ChatMessageResponse;
import com.farmbroker.farmbroker.chat.dto.ChatRealtimeEvent;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatRealtimePublisher {

    private final ChatMessageRepository messageRepository;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public void publishCreatedMessage(Long messageId) {
        ChatMessage message = messageRepository.findById(messageId).orElse(null);
        if (message == null) {
            return;
        }
        Conversation conversation = message.getConversation();
        ChatMessageResponse response = ChatMessageResponse.from(message);
        publishFor(conversation.getParticipant1Id(), conversation, response);
        publishFor(conversation.getParticipant2Id(), conversation, response);
    }

    public void publishRead(Long userId, Long conversationId) {
        ChatRealtimeEvent event = ChatRealtimeEvent.builder()
                .type("CONVERSATION_READ")
                .conversationId(conversationId)
                .unreadCount(0)
                .build();
        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId), "/queue/chat-events", event);
    }

    private void publishFor(Long userId, Conversation conversation, ChatMessageResponse message) {
        ChatRealtimeEvent event = ChatRealtimeEvent.builder()
                .type("MESSAGE_CREATED")
                .conversationId(conversation.getId())
                .message(message)
                .unreadCount(conversationService.unreadCount(conversation, userId))
                .build();
        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId), "/queue/chat-events", event);
    }
}
