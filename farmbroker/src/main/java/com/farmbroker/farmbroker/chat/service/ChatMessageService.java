package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import com.farmbroker.farmbroker.chat.domain.ChatMessageType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ChatMessageListResponse;
import com.farmbroker.farmbroker.chat.dto.ChatMessageResponse;
import com.farmbroker.farmbroker.chat.dto.ChatReadResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {

    private static final int MAX_TEXT_LENGTH = 1_000;
    private static final int MAX_PAGE_SIZE = 100;

    private final ChatMessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final ChatBlockService blockService;
    private final ChatImageStorage imageStorage;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ChatMessageResponse send(Long userId, Long conversationId, String text, MultipartFile image) {
        ConversationRepository.ConversationParticipants participants = conversationRepository
                .findParticipantsById(conversationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));
        Long otherUserId = otherParticipantId(participants, userId);
        blockService.validateCanChat(userId, otherUserId);

        String normalizedText = normalizeText(text);
        boolean hasImage = image != null && !image.isEmpty();
        if (normalizedText == null && !hasImage) {
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_EMPTY);
        }

        // 잠금을 쥐기 전에 저장한다 — 최대 5MB 파일 쓰기 동안 대화 행을 붙잡지 않기 위함이다.
        ChatImageStorage.StoredImage storedImage = hasImage ? imageStorage.store(image) : null;
        try {
            return saveMessage(userId, conversationId, normalizedText, hasImage, storedImage);
        } catch (RuntimeException e) {
            if (storedImage != null) {
                imageStorage.deleteQuietly(storedImage.storedName());
            }
            throw e;
        }
    }

    public ChatMessageListResponse getMessages(Long userId, Long conversationId,
                                               Long beforeId, int size) {
        conversationService.getAuthorized(conversationId, userId);
        if (size < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        int pageSize = Math.min(size, MAX_PAGE_SIZE);
        PageRequest limit = PageRequest.of(0, pageSize + 1);
        List<ChatMessage> descending = beforeId == null
                ? messageRepository.findByConversationIdOrderByIdDesc(conversationId, limit)
                : messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(
                        conversationId, beforeId, limit);
        boolean hasNext = descending.size() > pageSize;
        List<ChatMessage> page = new ArrayList<>(descending.subList(0, Math.min(pageSize, descending.size())));
        Long nextBeforeId = hasNext && !page.isEmpty() ? page.getLast().getId() : null;
        Collections.reverse(page);
        return ChatMessageListResponse.builder()
                .messages(page.stream().map(ChatMessageResponse::from).toList())
                .nextBeforeId(nextBeforeId)
                .hasNext(hasNext)
                .build();
    }

    @Transactional
    public ChatReadResponse markRead(Long userId, Long conversationId) {
        Conversation conversation = getAuthorizedForUpdate(conversationId, userId);
        Long latestMessageId = messageRepository.findTopByConversationIdOrderByIdDesc(conversationId)
                .map(ChatMessage::getId)
                .orElse(null);
        conversation.markRead(userId, latestMessageId);
        eventPublisher.publishEvent(new ChatConversationReadEvent(userId, conversationId));
        return ChatReadResponse.builder()
                .conversationId(conversationId)
                .lastReadMessageId(latestMessageId)
                .unreadCount(0)
                .build();
    }

    public ChatImageResource getImage(Long userId, Long messageId) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        conversationService.getAuthorized(message.getConversation().getId(), userId);
        if (!message.hasImage()) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        Resource resource = imageStorage.load(message.getStoredFileName());
        return new ChatImageResource(resource, message.getImageContentType(), message.getOriginalFileName());
    }

    private String normalizeText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String normalized = text.trim();
        if (normalized.length() > MAX_TEXT_LENGTH) {
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_TOO_LONG);
        }
        return normalized;
    }

    private String preview(String text, boolean hasImage) {
        if (text == null) {
            return "사진";
        }
        String prefix = hasImage ? "사진 · " : "";
        int maxTextLength = 200 - prefix.length();
        return prefix + (text.length() <= maxTextLength ? text : text.substring(0, maxTextLength));
    }

    private ChatMessageResponse saveMessage(Long userId, Long conversationId, String normalizedText,
                                            boolean hasImage,
                                            ChatImageStorage.StoredImage storedImage) {
        Conversation conversation = conversationRepository.findByIdForUpdate(conversationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));
        ChatMessage message = messageRepository.saveAndFlush(ChatMessage.builder()
                .conversation(conversation)
                .senderId(userId)
                .type(hasImage ? ChatMessageType.IMAGE : ChatMessageType.TEXT)
                .text(normalizedText)
                .storedFileName(storedImage == null ? null : storedImage.storedName())
                .originalFileName(storedImage == null ? null : storedImage.originalName())
                .imageContentType(storedImage == null ? null : storedImage.contentType())
                .imageSize(storedImage == null ? null : storedImage.size())
                .build());
        conversation.touchMessage(message.getId(), preview(normalizedText, hasImage),
                message.getCreatedAt(), userId);
        eventPublisher.publishEvent(new ChatMessageCreatedEvent(message.getId()));
        return ChatMessageResponse.from(message);
    }

    private Long otherParticipantId(ConversationRepository.ConversationParticipants participants,
                                    Long userId) {
        if (participants.getParticipant1Id().equals(userId)) {
            return participants.getParticipant2Id();
        }
        if (participants.getParticipant2Id().equals(userId)) {
            return participants.getParticipant1Id();
        }
        throw new BusinessException(ErrorCode.CHAT_FORBIDDEN);
    }

    private Conversation getAuthorizedForUpdate(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findByIdForUpdate(conversationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));
        if (!conversation.hasParticipant(userId)) {
            throw new BusinessException(ErrorCode.CHAT_FORBIDDEN);
        }
        return conversation;
    }


    public record ChatImageResource(Resource resource, String contentType, String originalName) {
    }
}
