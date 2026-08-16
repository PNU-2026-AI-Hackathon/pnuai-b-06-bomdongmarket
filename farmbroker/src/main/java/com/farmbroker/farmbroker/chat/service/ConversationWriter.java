package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ConversationWriter {

    private final ConversationRepository conversationRepository;

    @Transactional(readOnly = true)
    public Optional<Conversation> find(ChatContextType contextType, Long contextId,
                                       Long participant1Id, Long participant2Id) {
        return conversationRepository.findByContextTypeAndContextIdAndParticipant1IdAndParticipant2Id(
                contextType, contextId, participant1Id, participant2Id);
    }

    // 유니크 위반은 이 트랜잭션 밖에서 잡아야 rollback-only가 커밋 시점에 다른 예외로 바뀌지 않는다.
    @Transactional
    public Conversation create(ChatContextType contextType, Long contextId, String contextTitle,
                               String contextImageUrl, Long participant1Id, Long participant2Id) {
        return conversationRepository.saveAndFlush(Conversation.builder()
                .contextType(contextType)
                .contextId(contextId)
                .contextTitle(contextTitle)
                .contextImageUrl(contextImageUrl)
                .participant1Id(participant1Id)
                .participant2Id(participant2Id)
                .build());
    }
}
