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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConversationService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ConversationRepository conversationRepository;
    private final ConversationWriter conversationWriter;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatContextResolver contextResolver;
    private final ChatBlockService blockService;

    // 조회-없으면-삽입 구조라 한 트랜잭션으로 묶으면 안 된다.
    // 삽입이 유니크 제약에 걸린 뒤 같은 트랜잭션에서 다시 찾아도 REPEATABLE READ 스냅샷 때문에
    // 경쟁자가 커밋한 행이 보이지 않는다. 그래서 단계마다 트랜잭션을 끊는다.
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
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
        Optional<Conversation> found = conversationWriter.find(
                target.type(), target.id(), participant1Id, participant2Id);
        if (found.isEmpty()) {
            try {
                return toResponse(conversationWriter.create(
                        target.type(), target.id(), target.title(), target.imageUrl(),
                        participant1Id, participant2Id), userId);
            } catch (DataIntegrityViolationException e) {
                // 거의 동시에 상대도 같은 방을 만들었다. 새 트랜잭션이라 이번엔 커밋된 행이 보인다.
                found = conversationWriter.find(
                        target.type(), target.id(), participant1Id, participant2Id);
            }
        }
        return toResponse(found.orElseThrow(
                () -> new BusinessException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND)), userId);
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
