package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.repository.UserBlockRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatBlockServiceTest {

    @Mock UserBlockRepository userBlockRepository;
    @Mock UserRepository userRepository;

    private ChatBlockService service;

    @BeforeEach
    void setUp() {
        service = new ChatBlockService(userBlockRepository, userRepository);
    }

    @Test
    void blocksExistingUser() {
        given(userRepository.existsById(2L)).willReturn(true);
        given(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).willReturn(false);

        assertEquals(true, service.block(1L, 2L).isBlocked());

        verify(userBlockRepository).save(any());
    }

    @Test
    void repeatedBlockIsIdempotent() {
        given(userRepository.existsById(2L)).willReturn(true);
        given(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).willReturn(true);

        service.block(1L, 2L);

        verify(userBlockRepository, never()).save(any());
    }

    @Test
    void cannotBlockSelf() {
        BusinessException caught = assertThrows(BusinessException.class,
                () -> service.block(1L, 1L));

        assertEquals(ErrorCode.CHAT_BLOCK_SELF, caught.getErrorCode());
    }
}
