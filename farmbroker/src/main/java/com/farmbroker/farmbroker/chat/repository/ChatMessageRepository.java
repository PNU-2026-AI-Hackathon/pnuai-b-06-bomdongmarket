package com.farmbroker.farmbroker.chat.repository;

import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderByIdDesc(Long conversationId, Pageable pageable);

    List<ChatMessage> findByConversationIdAndIdLessThanOrderByIdDesc(
            Long conversationId, Long beforeId, Pageable pageable);

    Optional<ChatMessage> findTopByConversationIdOrderByIdDesc(Long conversationId);

    @Query("""
            select count(m) from ChatMessage m
            where m.conversation.id = :conversationId
              and m.id > :lastReadMessageId
              and m.senderId is not null
              and m.senderId <> :userId
            """)
    long countUnread(@Param("conversationId") Long conversationId,
                     @Param("lastReadMessageId") Long lastReadMessageId,
                     @Param("userId") Long userId);
}
