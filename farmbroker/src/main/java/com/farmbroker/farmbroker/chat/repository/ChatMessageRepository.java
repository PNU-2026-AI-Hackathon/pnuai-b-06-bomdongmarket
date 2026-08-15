package com.farmbroker.farmbroker.chat.repository;

import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    interface ConversationUnreadCount {
        Long getConversationId();

        long getUnreadCount();
    }

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

    @Query("""
            select c.id as conversationId, count(m) as unreadCount
            from ChatMessage m join m.conversation c
            where c.id in :conversationIds
              and m.senderId <> :userId
              and (
                (c.participant1Id = :userId
                  and (c.participant1LastReadMessageId is null
                    or m.id > c.participant1LastReadMessageId))
                or
                (c.participant2Id = :userId
                  and (c.participant2LastReadMessageId is null
                    or m.id > c.participant2LastReadMessageId))
              )
            group by c.id
            """)
    List<ConversationUnreadCount> countUnreadByConversationIds(
            @Param("conversationIds") Collection<Long> conversationIds,
            @Param("userId") Long userId);
}
