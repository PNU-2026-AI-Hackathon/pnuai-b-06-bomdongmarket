package com.farmbroker.farmbroker.chat.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_message_conversation", columnList = "conversation_id,id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Column(name = "sender_id")
    private Long senderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatMessageType type;

    @Column(length = 1000)
    private String text;

    @Column(name = "stored_file_name", length = 100)
    private String storedFileName;

    @Column(name = "original_file_name", length = 255)
    private String originalFileName;

    @Column(name = "image_content_type", length = 50)
    private String imageContentType;

    @Column(name = "image_size")
    private Long imageSize;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ChatMessage(Conversation conversation, Long senderId, ChatMessageType type, String text,
                       String storedFileName, String originalFileName, String imageContentType,
                       Long imageSize) {
        this.conversation = conversation;
        this.senderId = senderId;
        this.type = type;
        this.text = text;
        this.storedFileName = storedFileName;
        this.originalFileName = originalFileName;
        this.imageContentType = imageContentType;
        this.imageSize = imageSize;
    }

    public boolean hasImage() {
        return storedFileName != null;
    }
}
