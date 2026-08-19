package com.farmbroker.farmbroker.chat.config;

import com.farmbroker.farmbroker.common.config.AllowedOrigins;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// 핸드셰이크 Origin 목록이 REST 의 CORS 목록과 갈리면 배포 환경에서 채팅만 막힌다.
// 실제로 로컬 주소가 박혀 있어 배포된 프런트의 핸드셰이크가 403 으로 거절됐고,
// 클라이언트는 3초마다 다시 붙어 콘솔이 실패 로그로 가득 찼다.
class ChatWebSocketConfigTest {

    @Test
    @DisplayName("STOMP 엔드포인트는 cors.allowed-origins 에 준 Origin 을 그대로 허용한다")
    void usesConfiguredOrigins() {
        StompEndpointRegistry registry = mock(StompEndpointRegistry.class);
        StompWebSocketEndpointRegistration registration = mock(StompWebSocketEndpointRegistration.class);
        when(registry.addEndpoint(anyString())).thenReturn(registration);

        new ChatWebSocketConfig("https://bomdong.vercel.app, http://localhost:5173")
                .registerStompEndpoints(registry);

        verify(registry).addEndpoint("/ws-chat");
        verify(registration).setAllowedOrigins("https://bomdong.vercel.app", "http://localhost:5173");
    }

    @Test
    @DisplayName("설정이 없으면 로컬 개발 주소만 허용한다")
    void fallsBackToLocalOrigins() {
        assertThat(AllowedOrigins.parse(AllowedOrigins.LOCAL_DEFAULT).asList())
                .containsExactly("http://localhost:5173", "http://localhost:3000");
    }

    @Test
    @DisplayName("공백과 빈 항목은 목록에서 걸러낸다")
    void trimsAndDropsEmptyEntries() {
        assertThat(AllowedOrigins.parse(" https://a.example , , https://b.example ,").asList())
                .containsExactly("https://a.example", "https://b.example");
    }
}
