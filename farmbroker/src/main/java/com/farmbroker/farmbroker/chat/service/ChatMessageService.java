package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import com.farmbroker.farmbroker.chat.domain.ChatMessageType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ChatMessageListResponse;
import com.farmbroker.farmbroker.chat.dto.ChatMessageResponse;
import com.farmbroker.farmbroker.chat.dto.ChatReadResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
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
    private final ConversationService conversationService;
    private final ChatBlockService blockService;
    private final ChatImageStorage imageStorage;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ChatMessageResponse send(Long userId, Long conversationId, String text, MultipartFile image) {
        Conversation conversation = conversationService.getAuthorized(conversationId, userId);
        Long otherUserId = conversation.otherParticipantId(userId);
        blockService.validateCanChat(userId, otherUserId);

        String normalizedText = normalizeText(text);
        boolean hasImage = image != null && !image.isEmpty();
        if (normalizedText == null && !hasImage) {
            throw new BusinessException(ErrorCode.CHAT_MESSAGE_EMPTY);
        }

        ChatImageStorage.StoredImage storedImage = hasImage ? imageStorage.store(image) : null;
        try {
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
        Conversation conversation = conversationService.getAuthorized(conversationId, userId);
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

    public record ChatImageResource(Resource resource, String contentType, String originalName) {
    }
}
