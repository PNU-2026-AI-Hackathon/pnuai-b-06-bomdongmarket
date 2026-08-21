package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ConversationCreateRequest;
import com.farmbroker.farmbroker.chat.dto.ConversationListResponse;
import com.farmbroker.farmbroker.chat.dto.ConversationResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import com.farmbroker.farmbroker.chat.repository.UserBlockRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.matching.domain.Matching;
import com.farmbroker.farmbroker.matching.domain.MatchingStatus;
import com.farmbroker.farmbroker.matching.repository.MatchingRepository;
import com.farmbroker.farmbroker.space.domain.Space;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    private static final long USER_ID = 10L;
    private static final long OWNER_ID = 20L;
    private static final long SPACE_ID = 30L;

    @Mock ConversationRepository conversationRepository;
    @Mock ConversationWriter conversationWriter;
    @Mock ChatMessageRepository messageRepository;
    @Mock UserBlockRepository userBlockRepository;
    @Mock UserRepository userRepository;
    @Mock ChatContextResolver contextResolver;
    @Mock ChatBlockService blockService;
    @Mock MatchingRepository matchingRepository;

    private ConversationService service;

    @BeforeEach
    void setUp() {
        service = new ConversationService(conversationRepository, conversationWriter,
                messageRepository, userBlockRepository, userRepository, contextResolver, blockService,
                matchingRepository);
    }

    @Test
    void createsOneConversationForContextAndParticipants() throws Exception {
        Conversation conversation = conversation(1L);
        given(userRepository.existsById(USER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(OWNER_ID));
        given(conversationWriter.find(
                ChatContextType.SPACE, SPACE_ID, USER_ID, OWNER_ID)).willReturn(Optional.empty());
        given(conversationWriter.create(
                ChatContextType.SPACE, SPACE_ID, "도심 공실", null, USER_ID, OWNER_ID))
                .willReturn(conversation);
        stubResponseData();

        ConversationResponse response = service.createOrGet(USER_ID, request());

        assertEquals(1L, response.getConversationId());
        assertEquals(OWNER_ID, response.getOtherUserId());
        verify(blockService).validateCanChat(USER_ID, OWNER_ID);
    }

    @Test
    void reusesConversationCommittedByConcurrentCreator() throws Exception {
        Conversation existing = conversation(1L);
        given(userRepository.existsById(USER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(OWNER_ID));
        given(conversationWriter.find(ChatContextType.SPACE, SPACE_ID, USER_ID, OWNER_ID))
                .willReturn(Optional.empty(), Optional.of(existing));
        given(conversationWriter.create(
                ChatContextType.SPACE, SPACE_ID, "도심 공실", null, USER_ID, OWNER_ID))
                .willThrow(new DataIntegrityViolationException("duplicate conversation"));
        stubResponseData();

        ConversationResponse response = service.createOrGet(USER_ID, request());

        assertEquals(existing.getId(), response.getConversationId());
        verify(conversationWriter, times(2)).find(
                ChatContextType.SPACE, SPACE_ID, USER_ID, OWNER_ID);
    }

    @Test
    void reusesExistingConversation() throws Exception {
        Conversation existing = conversation(1L);
        given(userRepository.existsById(USER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(OWNER_ID));
        given(conversationWriter.find(
                ChatContextType.SPACE, SPACE_ID, USER_ID, OWNER_ID)).willReturn(Optional.of(existing));
        stubResponseData();

        service.createOrGet(USER_ID, request());

        verify(conversationWriter, never()).create(any(), any(), any(), any(), any(), any());
    }

    @Test
    void loadsConversationPageWithThreeFixedBatchCalls() throws Exception {
        List<Conversation> conversations = new ArrayList<>();
        for (long id = 1; id <= 10; id++) {
            conversations.add(conversation(id));
        }
        given(conversationRepository.findAllForUser(USER_ID, PageRequest.of(0, 10)))
                .willReturn(new PageImpl<>(conversations, PageRequest.of(0, 10), 10));
        stubResponseData();

        ConversationListResponse response = service.getConversations(USER_ID, 0, 10);

        assertEquals(10, response.getConversations().size());
        verify(userRepository, times(1)).findAllById(any());
        verify(messageRepository, times(1)).countUnreadByConversationIds(any(), eq(USER_ID));
        verify(userBlockRepository, times(1)).findBlocksBetween(eq(USER_ID), any());
        verify(userRepository, never()).findById(any());
        verify(messageRepository, never()).countUnread(any(), any(), any());
        verify(userBlockRepository, never()).existsByBlockerIdAndBlockedId(any(), any());
    }

    @Test
    void skipsBatchCallsForEmptyConversationPage() {
        given(conversationRepository.findAllForUser(USER_ID, PageRequest.of(0, 10)))
                .willReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        ConversationListResponse response = service.getConversations(USER_ID, 0, 10);

        assertEquals(0, response.getConversations().size());
        verify(userRepository, never()).findAllById(any());
        verify(messageRepository, never()).countUnreadByConversationIds(any(), any());
        verify(userBlockRepository, never()).findBlocksBetween(any(), any());
    }

    @Test
    void conversationReadPathDoesNotAcquireWriteLock() throws Exception {
        Conversation conversation = conversation(1L);
        given(conversationRepository.findById(1L)).willReturn(Optional.of(conversation));
        stubResponseData();

        service.getConversation(USER_ID, 1L);

        verify(conversationRepository).findById(1L);
        verify(conversationRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void rejectsConversationWithSelf() throws Exception {
        given(userRepository.existsById(USER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(USER_ID));

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.createOrGet(USER_ID, request()));

        assertEquals(ErrorCode.CHAT_SELF_CONVERSATION, caught.getErrorCode());
    }

    // 공간 주인이 신청자에게 먼저 말을 거는 경로. 상대를 지목하고, 그 상대가 실제 신청자여야 한다.
    @Test
    void ownerCanOpenConversationWithApplicant() throws Exception {
        Conversation conversation = conversation(1L);
        given(userRepository.existsById(OWNER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(OWNER_ID));
        given(matchingRepository.existsBySpaceIdAndFarmerId(SPACE_ID, USER_ID)).willReturn(true);
        given(conversationWriter.find(
                ChatContextType.SPACE, SPACE_ID, USER_ID, OWNER_ID)).willReturn(Optional.of(conversation));
        given(userRepository.findAllById(any())).willReturn(List.of(user(USER_ID)));
        given(messageRepository.countUnreadByConversationIds(any(), eq(OWNER_ID))).willReturn(List.of());
        given(userBlockRepository.findBlocksBetween(eq(OWNER_ID), any())).willReturn(List.of());

        ConversationResponse response = service.createOrGet(OWNER_ID, requestTargeting(USER_ID));

        assertEquals(USER_ID, response.getOtherUserId());
        verify(blockService).validateCanChat(OWNER_ID, USER_ID);
    }

    @Test
    void ownerCannotOpenConversationWithNonApplicant() throws Exception {
        given(userRepository.existsById(OWNER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(OWNER_ID));
        given(matchingRepository.existsBySpaceIdAndFarmerId(SPACE_ID, USER_ID)).willReturn(false);

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.createOrGet(OWNER_ID, requestTargeting(USER_ID)));

        assertEquals(ErrorCode.CHAT_FORBIDDEN, caught.getErrorCode());
    }

    // 공간 주인이 같은 공간에서 신청자 둘과 대화할 수 있다. 매칭을 spaceId 만으로 잡으면
    // 두 대화가 같은 matchingId 를 물어, A 와의 대화에서 B 의 계약서가 열린다.
    @Test
    void mapsMatchingToTheFarmerOfEachConversation() throws Exception {
        long farmerA = 11L;
        long farmerB = 12L;
        Conversation withA = conversationBetween(1L, farmerA);
        Conversation withB = conversationBetween(2L, farmerB);
        given(conversationRepository.findAllForUser(OWNER_ID, PageRequest.of(0, 10)))
                .willReturn(new PageImpl<>(List.of(withA, withB), PageRequest.of(0, 10), 2));
        given(userRepository.findAllById(any())).willReturn(List.of(user(farmerA), user(farmerB)));
        given(messageRepository.countUnreadByConversationIds(any(), eq(OWNER_ID))).willReturn(List.of());
        given(userBlockRepository.findBlocksBetween(eq(OWNER_ID), any())).willReturn(List.of());
        given(matchingRepository.findBySpaceIdInAndFarmerIdInOrderByCreatedAtDesc(any(), any()))
                .willReturn(List.of(matching(200L, farmerB), matching(100L, farmerA)));

        List<ConversationResponse> responses =
                service.getConversations(OWNER_ID, 0, 10).getConversations();

        Map<Long, Long> matchingIdByConversation = new HashMap<>();
        responses.forEach(response ->
                matchingIdByConversation.put(response.getConversationId(), response.getMatchingId()));
        assertEquals(100L, matchingIdByConversation.get(1L));
        assertEquals(200L, matchingIdByConversation.get(2L));
    }

    private Conversation conversationBetween(long id, long farmerId) throws Exception {
        Conversation conversation = Conversation.builder()
                .contextType(ChatContextType.SPACE)
                .contextId(SPACE_ID)
                .contextTitle("도심 공실")
                .participant1Id(farmerId)
                .participant2Id(OWNER_ID)
                .build();
        setField(conversation, "id", id);
        setField(conversation, "createdAt", LocalDateTime.now());
        return conversation;
    }

    private Matching matching(long matchingId, long farmerId) throws Exception {
        Space space = newInstance(Space.class);
        setField(space, "id", SPACE_ID);

        Matching matching = newInstance(Matching.class);
        setField(matching, "id", matchingId);
        setField(matching, "space", space);
        setField(matching, "farmer", user(farmerId));
        setField(matching, "status", MatchingStatus.ACCEPTED);
        return matching;
    }

    private <T> T newInstance(Class<T> type) throws Exception {
        Constructor<T> constructor = type.getDeclaredConstructor();
        constructor.setAccessible(true);
        return constructor.newInstance();
    }

    private void stubResponseData() throws Exception {
        given(userRepository.findAllById(any())).willReturn(List.of(user(OWNER_ID)));
        given(messageRepository.countUnreadByConversationIds(any(), eq(USER_ID))).willReturn(List.of());
        given(userBlockRepository.findBlocksBetween(eq(USER_ID), any())).willReturn(List.of());
    }

    private ConversationCreateRequest request() throws Exception {
        return new ObjectMapper().readValue(
                "{\"contextType\":\"SPACE\",\"contextId\":" + SPACE_ID + "}",
                ConversationCreateRequest.class);
    }

    private ConversationCreateRequest requestTargeting(long otherUserId) throws Exception {
        return new ObjectMapper().readValue(
                "{\"contextType\":\"SPACE\",\"contextId\":" + SPACE_ID
                        + ",\"otherUserId\":" + otherUserId + "}",
                ConversationCreateRequest.class);
    }

    private ChatContextResolver.ContextTarget target(long ownerId) {
        return new ChatContextResolver.ContextTarget(
                ChatContextType.SPACE, SPACE_ID, "도심 공실", null, ownerId);
    }

    private Conversation conversation(long id) throws Exception {
        Conversation conversation = Conversation.builder()
                .contextType(ChatContextType.SPACE)
                .contextId(SPACE_ID)
                .contextTitle("도심 공실")
                .participant1Id(USER_ID)
                .participant2Id(OWNER_ID)
                .build();
        setField(conversation, "id", id);
        setField(conversation, "createdAt", LocalDateTime.now());
        return conversation;
    }

    private User user(long id) throws Exception {
        User user = User.builder()
                .email("owner@example.com")
                .password("hashed")
                .nickname("공간 제공자")
                .build();
        setField(user, "id", id);
        return user;
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
