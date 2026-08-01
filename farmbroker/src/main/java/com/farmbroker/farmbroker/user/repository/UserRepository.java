package com.farmbroker.farmbroker.user.repository;

import com.farmbroker.farmbroker.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Spring Data JPA가 구현체를 자동 생성하는 레포지토리 인터페이스.
// - findByEmail: 로그인 시 이메일로 유저를 조회하고, 회원가입 시 중복 여부를 확인하는 데 사용.
// - existsByEmail: 이메일 중복 체크를 count 쿼리 없이 boolean으로 받아 성능을 높임.
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
