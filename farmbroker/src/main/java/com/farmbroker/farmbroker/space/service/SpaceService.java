package com.farmbroker.farmbroker.space.service;

import com.farmbroker.farmbroker.space.repository.SpaceImageRepository;
import com.farmbroker.farmbroker.space.repository.SpaceRepository;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// space 도메인 비즈니스 로직.
// 역할(OWNER) 체크는 시큐리티 authorities가 아닌 여기서 수동으로 수행한다 (JWT 필터가 권한을 싣지 않는 팀 정책).
// 클래스 기본은 readOnly 트랜잭션 — 쓰기 메서드에는 개별 @Transactional을 부착한다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final SpaceImageRepository spaceImageRepository;
    private final UserRepository userRepository;
}
