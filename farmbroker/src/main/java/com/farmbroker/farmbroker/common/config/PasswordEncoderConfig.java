package com.farmbroker.farmbroker.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// BCryptPasswordEncoder를 Spring Bean으로 등록하는 설정 클래스.
// SecurityConfig와 분리해 두는 이유: AuthService가 SecurityConfig 완성 전에도
// PasswordEncoder를 주입받아 사용할 수 있도록 의존 관계를 단순하게 유지하기 위함.
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
