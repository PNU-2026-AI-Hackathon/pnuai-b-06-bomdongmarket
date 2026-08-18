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

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

    private ConversationService service;

    @BeforeEach
    void setUp() {
        service = new ConversationService(conversationRepository, conversationWriter,
                messageRepository, userBlockRepository, userRepository, contextResolver, blockService);
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
