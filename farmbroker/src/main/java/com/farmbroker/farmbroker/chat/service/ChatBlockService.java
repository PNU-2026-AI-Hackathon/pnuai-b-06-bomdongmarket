package com.farmbroker.farmbroker.chat.service;

import com.farmbroker.farmbroker.chat.domain.UserBlock;
import com.farmbroker.farmbroker.chat.dto.UserBlockResponse;
import com.farmbroker.farmbroker.chat.repository.UserBlockRepository;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;

    @Transactional
    public UserBlockResponse block(Long blockerId, Long blockedId) {
        validateTarget(blockerId, blockedId);
        if (!userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            userBlockRepository.save(UserBlock.builder()
                    .blockerId(blockerId)
                    .blockedId(blockedId)
                    .build());
        }
        return UserBlockResponse.builder().userId(blockedId).blocked(true).build();
    }

    @Transactional
    public UserBlockResponse unblock(Long blockerId, Long blockedId) {
        userBlockRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
                .ifPresent(userBlockRepository::delete);
        return UserBlockResponse.builder().userId(blockedId).blocked(false).build();
    }

    public boolean isBlockedEitherDirection(Long user1, Long user2) {
        return userBlockRepository.existsByBlockerIdAndBlockedId(user1, user2)
                || userBlockRepository.existsByBlockerIdAndBlockedId(user2, user1);
    }

    public void validateCanChat(Long user1, Long user2) {
        if (isBlockedEitherDirection(user1, user2)) {
            throw new BusinessException(ErrorCode.CHAT_BLOCKED);
        }
    }

    private void validateTarget(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new BusinessException(ErrorCode.CHAT_BLOCK_SELF);
        }
        if (!userRepository.existsById(blockedId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
    }
}
