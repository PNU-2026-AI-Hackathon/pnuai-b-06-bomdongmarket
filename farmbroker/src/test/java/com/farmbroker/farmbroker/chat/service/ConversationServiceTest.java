package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ConversationCreateRequest;
import com.farmbroker.farmbroker.chat.dto.ConversationResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
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

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    private static final long USER_ID = 10L;
    private static final long OWNER_ID = 20L;
    private static final long SPACE_ID = 30L;

    @Mock ConversationRepository conversationRepository;
    @Mock ChatMessageRepository messageRepository;
    @Mock UserRepository userRepository;
    @Mock ChatContextResolver contextResolver;
    @Mock ChatBlockService blockService;

    private ConversationService service;

    @BeforeEach
    void setUp() {
        service = new ConversationService(conversationRepository, messageRepository,
                userRepository, contextResolver, blockService);
    }

    @Test
    void createsOneConversationForContextAndParticipants() throws Exception {
        Conversation conversation = conversation();
        given(userRepository.existsById(USER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(OWNER_ID));
        given(conversationRepository.findByContextTypeAndContextIdAndParticipant1IdAndParticipant2Id(
                ChatContextType.SPACE, SPACE_ID, USER_ID, OWNER_ID)).willReturn(Optional.empty());
        given(conversationRepository.save(any(Conversation.class))).willReturn(conversation);
        given(userRepository.findById(OWNER_ID)).willReturn(Optional.of(user(OWNER_ID)));
        given(messageRepository.countUnread(1L, 0L, USER_ID)).willReturn(0L);

        ConversationResponse response = service.createOrGet(USER_ID, request());

        assertEquals(1L, response.getConversationId());
        assertEquals(OWNER_ID, response.getOtherUserId());
        verify(blockService).validateCanChat(USER_ID, OWNER_ID);
    }

    @Test
    void reusesExistingConversation() throws Exception {
        Conversation existing = conversation();
        given(userRepository.existsById(USER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(OWNER_ID));
        given(conversationRepository.findByContextTypeAndContextIdAndParticipant1IdAndParticipant2Id(
                ChatContextType.SPACE, SPACE_ID, USER_ID, OWNER_ID)).willReturn(Optional.of(existing));
        given(userRepository.findById(OWNER_ID)).willReturn(Optional.of(user(OWNER_ID)));

        service.createOrGet(USER_ID, request());

        verify(conversationRepository, never()).save(any());
    }

    @Test
    void rejectsConversationWithSelf() throws Exception {
        given(userRepository.existsById(USER_ID)).willReturn(true);
        given(contextResolver.resolve("SPACE", SPACE_ID)).willReturn(target(USER_ID));

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.createOrGet(USER_ID, request()));

        assertEquals(ErrorCode.CHAT_SELF_CONVERSATION, caught.getErrorCode());
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

    private Conversation conversation() throws Exception {
        Conversation conversation = Conversation.builder()
                .contextType(ChatContextType.SPACE)
                .contextId(SPACE_ID)
                .contextTitle("도심 공실")
                .participant1Id(USER_ID)
                .participant2Id(OWNER_ID)
                .build();
        setField(conversation, "id", 1L);
        setField(conversation, "createdAt", LocalDateTime.now());
        return conversation;
    }

    private User user(long id) throws Exception {
        User user = User.builder().email("owner@example.com").password("hashed").nickname("공간 제공자").build();
        setField(user, "id", id);
        return user;
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
