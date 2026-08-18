package com.farmbroker.farmbroker.chat.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ChatRealtimeEventListener {

    private final ChatRealtimePublisher realtimePublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMessageCreated(ChatMessageCreatedEvent event) {
        realtimePublisher.publishCreatedMessage(event.messageId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onConversationRead(ChatConversationReadEvent event) {
        realtimePublisher.publishRead(event.userId(), event.conversationId());
    }
}
