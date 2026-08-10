package com.farmbroker.farmbroker.chat.repository;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByContextTypeAndContextIdAndParticipant1IdAndParticipant2Id(
            ChatContextType contextType, Long contextId, Long participant1Id, Long participant2Id);

    @Query("""
            select c from Conversation c
            where c.participant1Id = :userId or c.participant2Id = :userId
            order by coalesce(c.lastMessageAt, c.createdAt) desc, c.id desc
            """)
    Page<Conversation> findAllForUser(@Param("userId") Long userId, Pageable pageable);
}
