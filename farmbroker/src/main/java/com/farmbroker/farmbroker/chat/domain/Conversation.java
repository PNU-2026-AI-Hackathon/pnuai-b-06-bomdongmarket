package com.farmbroker.farmbroker.chat.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_conversations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chat_context_participants",
                columnNames = {"context_type", "context_id", "participant1_id", "participant2_id"}),
        indexes = {
                @Index(name = "idx_chat_participant1", columnList = "participant1_id,last_message_at"),
                @Index(name = "idx_chat_participant2", columnList = "participant2_id,last_message_at")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "context_type", nullable = false, length = 20)
    private ChatContextType contextType;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "context_title", nullable = false, length = 120)
    private String contextTitle;

    @Column(name = "context_image_url", length = 500)
    private String contextImageUrl;

    @Column(name = "participant1_id", nullable = false)
    private Long participant1Id;

    @Column(name = "participant2_id", nullable = false)
    private Long participant2Id;

    @Column(name = "participant1_last_read_message_id")
    private Long participant1LastReadMessageId;

    @Column(name = "participant2_last_read_message_id")
    private Long participant2LastReadMessageId;

    @Column(name = "last_message_preview", length = 200)
    private String lastMessagePreview;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Conversation(ChatContextType contextType, Long contextId, String contextTitle,
                        String contextImageUrl, Long participant1Id, Long participant2Id) {
        this.contextType = contextType;
        this.contextId = contextId;
        this.contextTitle = contextTitle;
        this.contextImageUrl = contextImageUrl;
        this.participant1Id = participant1Id;
        this.participant2Id = participant2Id;
    }

    public boolean hasParticipant(Long userId) {
        return participant1Id.equals(userId) || participant2Id.equals(userId);
    }

    public Long otherParticipantId(Long userId) {
        if (participant1Id.equals(userId)) {
            return participant2Id;
        }
        if (participant2Id.equals(userId)) {
            return participant1Id;
        }
        return null;
    }

    public Long lastReadMessageIdFor(Long userId) {
        if (participant1Id.equals(userId)) {
            return participant1LastReadMessageId;
        }
        if (participant2Id.equals(userId)) {
            return participant2LastReadMessageId;
        }
        return null;
    }

    public void markRead(Long userId, Long messageId) {
        if (participant1Id.equals(userId)) {
            participant1LastReadMessageId = max(participant1LastReadMessageId, messageId);
        } else if (participant2Id.equals(userId)) {
            participant2LastReadMessageId = max(participant2LastReadMessageId, messageId);
        }
    }

    public void touchMessage(Long messageId, String preview, LocalDateTime sentAt, Long senderId) {
        this.lastMessagePreview = preview;
        this.lastMessageAt = sentAt;
        markRead(senderId, messageId);
    }

    private Long max(Long current, Long candidate) {
        if (candidate == null) {
            return current;
        }
        return current == null || candidate > current ? candidate : current;
    }
}
