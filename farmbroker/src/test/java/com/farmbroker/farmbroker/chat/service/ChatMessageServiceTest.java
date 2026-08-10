package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import com.farmbroker.farmbroker.chat.domain.ChatMessageType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ChatMessageResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    private static final long USER_ID = 10L;
    private static final long OTHER_ID = 20L;
    private static final long CONVERSATION_ID = 30L;

    @Mock ChatMessageRepository messageRepository;
    @Mock ConversationService conversationService;
    @Mock ChatBlockService blockService;
    @Mock ChatImageStorage imageStorage;
    @Mock ApplicationEventPublisher eventPublisher;

    private ChatMessageService service;

    @BeforeEach
    void setUp() {
        service = new ChatMessageService(messageRepository, conversationService,
                blockService, imageStorage, eventPublisher);
    }

    @Test
    void sendsTrimmedTextAndMarksSenderAsRead() throws Exception {
        Conversation conversation = conversation();
        given(conversationService.getAuthorized(CONVERSATION_ID, USER_ID)).willReturn(conversation);
        given(messageRepository.saveAndFlush(any(ChatMessage.class))).willAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            setField(message, "id", 100L);
            setField(message, "createdAt", LocalDateTime.now());
            return message;
        });

        ChatMessageResponse response = service.send(USER_ID, CONVERSATION_ID, "  안녕하세요  ", null);

        assertEquals(ChatMessageType.TEXT, response.getType());
        assertEquals("안녕하세요", response.getText());
        assertEquals(100L, conversation.lastReadMessageIdFor(USER_ID));
        verify(eventPublisher).publishEvent(new ChatMessageCreatedEvent(100L));
    }

    @Test
    void sendsPrivateImageWithOptionalCaption() throws Exception {
        Conversation conversation = conversation();
        MockMultipartFile image = new MockMultipartFile(
                "image", "lettuce.png", "image/png", new byte[]{1, 2, 3});
        given(conversationService.getAuthorized(CONVERSATION_ID, USER_ID)).willReturn(conversation);
        given(imageStorage.store(image)).willReturn(
                new ChatImageStorage.StoredImage("stored.png", "lettuce.png", "image/png", 3));
        given(messageRepository.saveAndFlush(any(ChatMessage.class))).willAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            setField(message, "id", 101L);
            setField(message, "createdAt", LocalDateTime.now());
            return message;
        });

        ChatMessageResponse response = service.send(USER_ID, CONVERSATION_ID, null, image);

        assertEquals(ChatMessageType.IMAGE, response.getType());
        assertNull(response.getText());
        assertEquals("/chat/messages/101/image", response.getImagePath());
    }

    @Test
    void rejectsEmptyMessage() throws Exception {
        given(conversationService.getAuthorized(CONVERSATION_ID, USER_ID)).willReturn(conversation());

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.send(USER_ID, CONVERSATION_ID, "  ", null));

        assertEquals(ErrorCode.CHAT_MESSAGE_EMPTY, caught.getErrorCode());
        verify(messageRepository, never()).saveAndFlush(any());
    }

    @Test
    void blockedConversationCannotSend() throws Exception {
        Conversation conversation = conversation();
        given(conversationService.getAuthorized(CONVERSATION_ID, USER_ID)).willReturn(conversation);
        org.mockito.Mockito.doThrow(new BusinessException(ErrorCode.CHAT_BLOCKED))
                .when(blockService).validateCanChat(USER_ID, OTHER_ID);

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.send(USER_ID, CONVERSATION_ID, "메시지", null));

        assertEquals(ErrorCode.CHAT_BLOCKED, caught.getErrorCode());
        verify(messageRepository, never()).saveAndFlush(any());
    }

    private Conversation conversation() throws Exception {
        Conversation conversation = Conversation.builder()
                .contextType(ChatContextType.SPACE)
                .contextId(1L)
                .contextTitle("도심 공실")
                .participant1Id(USER_ID)
                .participant2Id(OTHER_ID)
                .build();
        setField(conversation, "id", CONVERSATION_ID);
        setField(conversation, "createdAt", LocalDateTime.now());
        return conversation;
    }

    private static void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
