package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.domain.UserBlock;
import com.farmbroker.farmbroker.chat.dto.ConversationCreateRequest;
import com.farmbroker.farmbroker.chat.dto.ConversationListResponse;
import com.farmbroker.farmbroker.chat.dto.ConversationResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import com.farmbroker.farmbroker.chat.repository.UserBlockRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConversationService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ConversationRepository conversationRepository;
    private final ConversationWriter conversationWriter;
    private final ChatMessageRepository messageRepository;
    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final ChatContextResolver contextResolver;
    private final ChatBlockService blockService;
    // 공간 주인이 먼저 말을 걸 때 상대가 실제 신청자인지 확인하고, 대화에 계약 버튼을 그릴지
    // 판단할 매칭 정보를 함께 읽는다.
    private final MatchingRepository matchingRepository;

    // 한 트랜잭션에서 재조회하면 REPEATABLE READ 스냅샷 때문에 경쟁자가 넣은 행이 보이지 않는다.
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ConversationResponse createOrGet(Long userId, ConversationCreateRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        ChatContextResolver.ContextTarget target =
                contextResolver.resolve(request.getContextType(), request.getContextId());
        Long counterpartId = resolveCounterpart(userId, target, request.getOtherUserId());
        blockService.validateCanChat(userId, counterpartId);

        Long participant1Id = Math.min(userId, counterpartId);
        Long participant2Id = Math.max(userId, counterpartId);
        Optional<Conversation> found = conversationWriter.find(
                target.type(), target.id(), participant1Id, participant2Id);
        if (found.isEmpty()) {
            try {
                return toResponse(conversationWriter.create(
                        target.type(), target.id(), target.title(), target.imageUrl(),
                        participant1Id, participant2Id), userId);
            } catch (DataIntegrityViolationException e) {
                // 거의 동시에 상대도 같은 방을 만들었으므로 새 트랜잭션에서 커밋된 방을 다시 찾는다.
                found = conversationWriter.find(
                        target.type(), target.id(), participant1Id, participant2Id);
            }
        }
        return toResponse(found.orElseThrow(
                () -> new BusinessException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND)), userId);
    }

    // 말을 거는 상대를 정한다.
    // 문의자가 주인에게 거는 기존 경로에서는 상대가 곧 주인이라 otherUserId를 볼 필요가 없다.
    // 주인이 먼저 거는 경로만 상대를 지목받고, 지목한 상대가 실제 신청자인지 확인한다 —
    // 확인 없이 열면 주인이 아무에게나 방을 만들 수 있다.
    private Long resolveCounterpart(Long userId, ChatContextResolver.ContextTarget target,
                                    Long otherUserId) {
        if (!target.ownerId().equals(userId)) {
            return target.ownerId();
        }
        if (otherUserId == null || otherUserId.equals(userId)) {
            throw new BusinessException(ErrorCode.CHAT_SELF_CONVERSATION);
        }
        if (target.type() != ChatContextType.SPACE
                || !matchingRepository.existsBySpaceIdAndFarmerId(target.id(), otherUserId)) {
            throw new BusinessException(ErrorCode.CHAT_FORBIDDEN);
        }
        return otherUserId;
    }

    public ConversationListResponse getConversations(Long userId, int page, int size) {
        if (page < 0 || size < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        int pageSize = Math.min(size, MAX_PAGE_SIZE);
        Page<Conversation> result = conversationRepository.findAllForUser(
                userId, PageRequest.of(page, pageSize));
        return ConversationListResponse.builder()
                .conversations(toResponses(result.getContent(), userId))
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
        return messageRepository.countUnread(
                conversation.getId(), lastReadId == null ? 0L : lastReadId, userId);
    }

    private ConversationResponse toResponse(Conversation conversation, Long userId) {
        return toResponses(List.of(conversation), userId).getFirst();
    }

    private List<ConversationResponse> toResponses(List<Conversation> conversations, Long userId) {
        if (conversations.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> otherUserIdsByConversation = new HashMap<>();
        for (Conversation conversation : conversations) {
            Long otherUserId = conversation.otherParticipantId(userId);
            if (otherUserId == null) {
                throw new BusinessException(ErrorCode.CHAT_FORBIDDEN);
            }
            otherUserIdsByConversation.put(conversation.getId(), otherUserId);
        }

        Set<Long> otherUserIds = new HashSet<>(otherUserIdsByConversation.values());
        Map<Long, User> otherUsersById = new HashMap<>();
        userRepository.findAllById(otherUserIds)
                .forEach(user -> otherUsersById.put(user.getId(), user));

        Set<Long> conversationIds = conversations.stream()
                .map(Conversation::getId)
                .collect(Collectors.toSet());
        Map<Long, Long> unreadCounts = messageRepository
                .countUnreadByConversationIds(conversationIds, userId).stream()
                .collect(Collectors.toMap(
                        ChatMessageRepository.ConversationUnreadCount::getConversationId,
                        ChatMessageRepository.ConversationUnreadCount::getUnreadCount));

        Set<Long> blockedUserIds = userBlockRepository.findBlocksBetween(userId, otherUserIds).stream()
                .map(block -> otherUserId(block, userId))
                .collect(Collectors.toSet());

        Map<SpaceFarmer, Matching> matchings = findMatchings(conversations, userId, otherUserIds);

        return conversations.stream()
                .map(conversation -> toResponse(conversation, userId, otherUserIdsByConversation,
                        otherUsersById, unreadCounts, blockedUserIds, matchings))
                .toList();
    }

    // 매칭을 고르는 키. 공간 하나에 신청자가 여럿일 수 있어(공간 주인이 여러 신청자와 대화하는 경우)
    // spaceId 만으로 잡으면 모든 대화가 그 공간의 최신 매칭 하나를 함께 보게 된다 —
    // 그러면 A 와의 대화에 뜬 계약서 버튼이 B 의 계약으로 연결된다.
    private record SpaceFarmer(Long spaceId, Long farmerId) {
    }

    // 공간 문의 대화에 걸린 매칭을 한 번에 받아 온다(대화마다 조회하면 N+1).
    // 같은 공간·같은 농부로 재신청이 쌓여 있으면 최근 것만 남긴다.
    private Map<SpaceFarmer, Matching> findMatchings(List<Conversation> conversations, Long userId,
                                                     Set<Long> otherUserIds) {
        Set<Long> spaceIds = conversations.stream()
                .filter(conversation -> conversation.getContextType() == ChatContextType.SPACE)
                .map(Conversation::getContextId)
                .collect(Collectors.toSet());
        if (spaceIds.isEmpty()) {
            return Map.of();
        }

        // 둘 중 누가 농부인지 모르므로 양쪽을 다 넘긴다.
        Set<Long> participantIds = new HashSet<>(otherUserIds);
        participantIds.add(userId);

        Map<SpaceFarmer, Matching> latest = new HashMap<>();
        for (Matching matching : matchingRepository
                .findBySpaceIdInAndFarmerIdInOrderByCreatedAtDesc(spaceIds, participantIds)) {
            latest.putIfAbsent(
                    new SpaceFarmer(matching.getSpace().getId(), matching.getFarmer().getId()),
                    matching);
        }
        return latest;
    }

    // 이 대화의 두 사람 중 농부인 쪽 매칭만 이 대화의 것이다.
    private Matching matchingFor(Map<SpaceFarmer, Matching> matchings, Long spaceId,
                                 Long userId, Long otherUserId) {
        Matching asFarmer = matchings.get(new SpaceFarmer(spaceId, userId));
        return asFarmer != null ? asFarmer : matchings.get(new SpaceFarmer(spaceId, otherUserId));
    }

    private ConversationResponse toResponse(
            Conversation conversation,
            Long userId,
            Map<Long, Long> otherUserIdsByConversation,
            Map<Long, User> otherUsersById,
            Map<Long, Long> unreadCounts,
            Set<Long> blockedUserIds,
            Map<SpaceFarmer, Matching> matchings) {
        Long otherUserId = otherUserIdsByConversation.get(conversation.getId());
        User otherUser = Optional.ofNullable(otherUsersById.get(otherUserId))
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Matching matching = conversation.getContextType() == ChatContextType.SPACE
                ? matchingFor(matchings, conversation.getContextId(), userId, otherUserId)
                : null;
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
                .unreadCount(unreadCounts.getOrDefault(conversation.getId(), 0L))
                .blocked(blockedUserIds.contains(otherUserId))
                .matchingId(matching != null ? matching.getId() : null)
                .matchingStatus(matching != null ? matching.getStatus().name() : null)
                .build();
    }

    private Long otherUserId(UserBlock block, Long userId) {
        return block.getBlockerId().equals(userId) ? block.getBlockedId() : block.getBlockerId();
    }
}
