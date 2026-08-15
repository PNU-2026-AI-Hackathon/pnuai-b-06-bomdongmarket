package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.ChatContextType;
import com.farmbroker.farmbroker.chat.domain.ChatMessage;
import com.farmbroker.farmbroker.chat.domain.ChatMessageType;
import com.farmbroker.farmbroker.chat.domain.Conversation;
import com.farmbroker.farmbroker.chat.dto.ChatMessageResponse;
import com.farmbroker.farmbroker.chat.repository.ChatMessageRepository;
import com.farmbroker.farmbroker.chat.repository.ConversationRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    private static final long USER_ID = 10L;
    private static final long OTHER_ID = 20L;
    private static final long CONVERSATION_ID = 30L;

    @Mock ChatMessageRepository messageRepository;
    @Mock ConversationRepository conversationRepository;
    @Mock ConversationService conversationService;
    @Mock ChatBlockService blockService;
    @Mock ChatImageStorage imageStorage;
    @Mock ApplicationEventPublisher eventPublisher;

    private ChatMessageService service;

    @BeforeEach
    void setUp() {
        service = new ChatMessageService(messageRepository, conversationRepository,
                conversationService, blockService, imageStorage, eventPublisher);
    }

    @Test
    void sendsTrimmedTextAndMarksSenderAsRead() throws Exception {
        Conversation conversation = conversation();
        stubParticipants();
        given(conversationRepository.findByIdForUpdate(CONVERSATION_ID))
                .willReturn(Optional.of(conversation));
        stubSavedMessage(100L);

        ChatMessageResponse response = service.send(
                USER_ID, CONVERSATION_ID, "  안녕하세요  ", null);

        assertEquals(ChatMessageType.TEXT, response.getType());
        assertEquals("안녕하세요", response.getText());
        assertEquals(100L, conversation.lastReadMessageIdFor(USER_ID));
        verify(conversationRepository).findByIdForUpdate(CONVERSATION_ID);
        verify(eventPublisher).publishEvent(new ChatMessageCreatedEvent(100L));
    }

    @Test
    void storesImageBeforeAcquiringConversationLock() throws Exception {
        Conversation conversation = conversation();
        MockMultipartFile image = image();
        stubParticipants();
        given(imageStorage.store(image)).willReturn(storedImage());
        given(conversationRepository.findByIdForUpdate(CONVERSATION_ID))
                .willReturn(Optional.of(conversation));
        stubSavedMessage(101L);

        ChatMessageResponse response = service.send(USER_ID, CONVERSATION_ID, null, image);

        assertEquals(ChatMessageType.IMAGE, response.getType());
        assertNull(response.getText());
        assertEquals("/chat/messages/101/image", response.getImagePath());
        InOrder order = inOrder(imageStorage, conversationRepository);
        order.verify(imageStorage).store(image);
        order.verify(conversationRepository).findByIdForUpdate(CONVERSATION_ID);
    }

    @Test
    void rejectsEmptyMessageBeforeAcquiringLock() {
        stubParticipants();

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.send(USER_ID, CONVERSATION_ID, "  ", null));

        assertEquals(ErrorCode.CHAT_MESSAGE_EMPTY, caught.getErrorCode());
        verify(conversationRepository, never()).findByIdForUpdate(any());
        verify(messageRepository, never()).saveAndFlush(any());
    }

    @Test
    void blockedConversationCannotSend() {
        stubParticipants();
        org.mockito.Mockito.doThrow(new BusinessException(ErrorCode.CHAT_BLOCKED))
                .when(blockService).validateCanChat(USER_ID, OTHER_ID);

        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.send(USER_ID, CONVERSATION_ID, "메시지", null));

        assertEquals(ErrorCode.CHAT_BLOCKED, caught.getErrorCode());
        verify(conversationRepository, never()).findByIdForUpdate(any());
        verify(messageRepository, never()).saveAndFlush(any());
    }

    @Test
    void markReadAcquiresConversationLockAsFirstEntityLoad() throws Exception {
        Conversation conversation = conversation();
        given(conversationRepository.findByIdForUpdate(CONVERSATION_ID))
                .willReturn(Optional.of(conversation));
        given(messageRepository.findTopByConversationIdOrderByIdDesc(CONVERSATION_ID))
                .willReturn(Optional.empty());

        service.markRead(USER_ID, CONVERSATION_ID);

        verify(conversationRepository).findByIdForUpdate(CONVERSATION_ID);
        verify(conversationService, never()).getAuthorized(any(), any());
    }

    @Test
    void messageReadPathKeepsUsingExistingAuthorizedLoader() {
        given(messageRepository.findByConversationIdOrderByIdDesc(any(), any()))
                .willReturn(List.of());

        service.getMessages(USER_ID, CONVERSATION_ID, null, 20);

        verify(conversationService).getAuthorized(CONVERSATION_ID, USER_ID);
        verify(conversationRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void imageReadPathKeepsUsingExistingAuthorizedLoader() throws Exception {
        Conversation conversation = conversation();
        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .senderId(USER_ID)
                .type(ChatMessageType.IMAGE)
                .storedFileName("stored.png")
                .originalFileName("lettuce.png")
                .imageContentType("image/png")
                .imageSize(3L)
                .build();
        setField(message, "id", 101L);
        given(messageRepository.findById(101L)).willReturn(Optional.of(message));
        given(imageStorage.load("stored.png")).willReturn(new ByteArrayResource(new byte[]{1, 2, 3}));

        service.getImage(USER_ID, 101L);

        verify(conversationService).getAuthorized(CONVERSATION_ID, USER_ID);
        verify(conversationRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void olderMessageDoesNotReplaceLatestPreview() throws Exception {
        Conversation conversation = conversation();
        LocalDateTime latest = LocalDateTime.of(2026, 8, 14, 12, 0);

        conversation.touchMessage(100L, "최근 메시지", latest, USER_ID);
        conversation.touchMessage(101L, "과거 메시지", latest.minusSeconds(1), USER_ID);

        assertEquals("최근 메시지", conversation.getLastMessagePreview());
        assertEquals(latest, conversation.getLastMessageAt());
        assertEquals(101L, conversation.lastReadMessageIdFor(USER_ID));
    }

    @Test
    void rollbackCompletionDeletesStoredImage() throws Exception {
        TransactionSynchronizationManager.initSynchronization();
        try {
            sendImageWithSynchronization();

            TransactionSynchronization synchronization =
                    TransactionSynchronizationManager.getSynchronizations().getFirst();
            synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

            verify(imageStorage).deleteQuietly("stored.png");
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void committedCompletionKeepsStoredImage() throws Exception {
        TransactionSynchronizationManager.initSynchronization();
        try {
            sendImageWithSynchronization();

            TransactionSynchronization synchronization =
                    TransactionSynchronizationManager.getSynchronizations().getFirst();
            synchronization.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);

            verify(imageStorage, never()).deleteQuietly(any());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void failureWithoutTransactionSynchronizationDeletesImageImmediately() throws Exception {
        MockMultipartFile image = image();
        stubParticipants();
        given(imageStorage.store(image)).willReturn(storedImage());
        given(conversationRepository.findByIdForUpdate(CONVERSATION_ID))
                .willThrow(new RuntimeException("database unavailable"));

        assertThrows(RuntimeException.class,
                () -> service.send(USER_ID, CONVERSATION_ID, null, image));

        verify(imageStorage).deleteQuietly("stored.png");
    }

    private void sendImageWithSynchronization() throws Exception {
        Conversation conversation = conversation();
        MockMultipartFile image = image();
        stubParticipants();
        given(imageStorage.store(image)).willReturn(storedImage());
        given(conversationRepository.findByIdForUpdate(CONVERSATION_ID))
                .willReturn(Optional.of(conversation));
        stubSavedMessage(101L);

        service.send(USER_ID, CONVERSATION_ID, null, image);
    }

    private void stubParticipants() {
        given(conversationRepository.findParticipantsById(CONVERSATION_ID))
                .willReturn(Optional.of(participants()));
    }

    private void stubSavedMessage(long messageId) {
        given(messageRepository.saveAndFlush(any(ChatMessage.class))).willAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            setField(message, "id", messageId);
            setField(message, "createdAt", LocalDateTime.now());
            return message;
        });
    }

    private ConversationRepository.ConversationParticipants participants() {
        return new ConversationRepository.ConversationParticipants() {
            @Override
            public Long getParticipant1Id() {
                return USER_ID;
            }

            @Override
            public Long getParticipant2Id() {
                return OTHER_ID;
            }
        };
    }

    private MockMultipartFile image() {
        return new MockMultipartFile(
                "image", "lettuce.png", "image/png", new byte[]{1, 2, 3});
    }

    private ChatImageStorage.StoredImage storedImage() {
        return new ChatImageStorage.StoredImage(
                "stored.png", "lettuce.png", "image/png", 3);
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
