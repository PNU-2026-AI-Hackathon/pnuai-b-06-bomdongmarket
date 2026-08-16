package com.farmbroker.farmbroker.chat.repository;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    interface ConversationParticipants {
        Long getParticipant1Id();

        Long getParticipant2Id();
    }

    Optional<Conversation> findByContextTypeAndContextIdAndParticipant1IdAndParticipant2Id(
            ChatContextType contextType, Long contextId, Long participant1Id, Long participant2Id);

    @Query("""
            select c.participant1Id as participant1Id, c.participant2Id as participant2Id
            from Conversation c
            where c.id = :id
            """)
    Optional<ConversationParticipants> findParticipantsById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Conversation c where c.id = :id")
    Optional<Conversation> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select c from Conversation c
            where c.participant1Id = :userId or c.participant2Id = :userId
            order by coalesce(c.lastMessageAt, c.createdAt) desc, c.id desc
            """)
    Page<Conversation> findAllForUser(@Param("userId") Long userId, Pageable pageable);
}
