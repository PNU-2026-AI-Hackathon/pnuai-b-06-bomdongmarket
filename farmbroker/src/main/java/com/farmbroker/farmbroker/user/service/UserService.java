package com.farmbroker.farmbroker.user.service;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.dto.UserResponse;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 유저 도메인 비즈니스 로직 서비스.
// JWT 필터가 SecurityContext에 저장한 userId를 받아 DB에서 유저를 조회하고
// 응답 DTO로 변환해 반환한다. 유저가 없으면 USER_NOT_FOUND(404)를 던진다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }
}
