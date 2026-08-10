package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ConversationCreateRequest;
import com.farmbroker.farmbroker.chat.dto.ConversationListResponse;
import com.farmbroker.farmbroker.chat.dto.ConversationResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConversationService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatContextResolver contextResolver;
    private final ChatBlockService blockService;

    @Transactional
    public ConversationResponse createOrGet(Long userId, ConversationCreateRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        ChatContextResolver.ContextTarget target =
                contextResolver.resolve(request.getContextType(), request.getContextId());
        if (target.ownerId().equals(userId)) {
            throw new BusinessException(ErrorCode.CHAT_SELF_CONVERSATION);
        }
        blockService.validateCanChat(userId, target.ownerId());

        Long participant1Id = Math.min(userId, target.ownerId());
        Long participant2Id = Math.max(userId, target.ownerId());
        Conversation conversation = conversationRepository
                .findByContextTypeAndContextIdAndParticipant1IdAndParticipant2Id(
                        target.type(), target.id(), participant1Id, participant2Id)
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .contextType(target.type())
                        .contextId(target.id())
                        .contextTitle(target.title())
                        .contextImageUrl(target.imageUrl())
                        .participant1Id(participant1Id)
                        .participant2Id(participant2Id)
                        .build()));
        return toResponse(conversation, userId);
    }

    public ConversationListResponse getConversations(Long userId, int page, int size) {
        if (page < 0 || size < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        int pageSize = Math.min(size, MAX_PAGE_SIZE);
        Page<Conversation> result = conversationRepository.findAllForUser(
                userId, PageRequest.of(page, pageSize));
        return ConversationListResponse.builder()
                .conversations(result.getContent().stream()
                        .map(conversation -> toResponse(conversation, userId))
                        .toList())
                .page(page)
                .size(pageSize)
                .hasNext(result.hasNext())
                .build();
    }

    public ConversationResponse getConversation(Long userId, Long conversationId) {
        return toResponse(getAuthorized(conversationId, userId), userId);
    }

    public Conversation getAuthorized(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));
        if (!conversation.hasParticipant(userId)) {
            throw new BusinessException(ErrorCode.CHAT_FORBIDDEN);
        }
        return conversation;
    }

    public long unreadCount(Conversation conversation, Long userId) {
        Long lastReadId = conversation.lastReadMessageIdFor(userId);
        return messageRepository.countUnread(conversation.getId(), lastReadId == null ? 0L : lastReadId, userId);
    }

    private ConversationResponse toResponse(Conversation conversation, Long userId) {
        Long otherUserId = conversation.otherParticipantId(userId);
        if (otherUserId == null) {
            throw new BusinessException(ErrorCode.CHAT_FORBIDDEN);
        }
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return ConversationResponse.builder()
                .conversationId(conversation.getId())
                .contextType(conversation.getContextType())
                .contextId(conversation.getContextId())
                .contextTitle(conversation.getContextTitle())
                .contextImageUrl(conversation.getContextImageUrl())
                .otherUserId(otherUserId)
                .otherUserNickname(otherUser.getNickname())
                .lastMessagePreview(conversation.getLastMessagePreview())
                .lastMessageAt(conversation.getLastMessageAt())
                .unreadCount(unreadCount(conversation, userId))
                .blocked(blockService.isBlockedEitherDirection(userId, otherUserId))
                .build();
    }
}
