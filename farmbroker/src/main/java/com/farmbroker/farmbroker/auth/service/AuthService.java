package com.farmbroker.farmbroker.auth.service;

import com.farmbroker.farmbroker.auth.dto.LoginRequest;
import com.farmbroker.farmbroker.auth.dto.LoginResponse;
import com.farmbroker.farmbroker.auth.dto.SignupRequest;
import com.farmbroker.farmbroker.auth.dto.SignupResponse;
import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import com.farmbroker.farmbroker.security.JwtTokenProvider;
import com.farmbroker.farmbroker.user.domain.User;
import com.farmbroker.farmbroker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 회원가입 · 로그인 비즈니스 로직을 담당하는 서비스.
// 컨트롤러는 요청을 받아 이 서비스에 위임하고, 이 서비스는 도메인 규칙(중복 체크 등)을
// 검증한 뒤 레포지토리에 저장한다. 예외는 BusinessException으로 던져 전역 핸들러가 처리한다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public SignupResponse signup(SignupRequest request) {
        // 이메일 중복 체크 — 이미 가입된 이메일이면 409 반환
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        // 비밀번호 BCrypt 해싱 — 평문을 DB에 저장하지 않는다
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .nickname(request.getNickname())
                .role(request.getRole())
                .build();

        User savedUser = userRepository.save(user);

        return SignupResponse.from(savedUser);
    }

    public LoginResponse login(LoginRequest request) {
        // 이메일로 유저 조회 — 없거나 비밀번호 불일치 시 동일하게 401 반환 (사용자 존재 여부 노출 방지)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getRole());

        return LoginResponse.of(accessToken, user);
    }

    // 로그아웃 — 현재는 Access Token만 쓰는 stateless 구조라 서버가 보관하는 세션/토큰이 없다.
    // 따라서 실제 토큰 폐기는 클라이언트가 저장한 토큰을 삭제하는 방식으로 처리하고,
    // 서버는 인증된 사용자의 요청임을 확인하는 역할만 한다.
    // (추후 토큰 블랙리스트 방식으로 확장할 경우, 이 메서드에서 해당 토큰을 무효화하면 된다.
    //  이때 JwtAuthenticationFilter의 검증 로직도 함께 수정이 필요하므로 공용 계약 변경에 주의할 것.)
    public void logout(Long userId) {
        // no-op: 클라이언트 방식 로그아웃이라 서버 측 상태 변경이 없다.
    }
}
