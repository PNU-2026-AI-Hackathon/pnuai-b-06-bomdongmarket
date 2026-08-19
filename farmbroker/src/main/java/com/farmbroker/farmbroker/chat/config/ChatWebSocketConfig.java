package com.farmbroker.farmbroker.chat.config;

import com.farmbroker.farmbroker.common.config.AllowedOrigins;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class ChatWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AllowedOrigins allowedOrigins;

    public ChatWebSocketConfig(
            @Value("${cors.allowed-origins:" + AllowedOrigins.LOCAL_DEFAULT + "}") String allowedOrigins) {
        this.allowedOrigins = AllowedOrigins.parse(allowedOrigins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    // 허용 Origin 은 REST 의 CORS 와 같은 목록(cors.allowed-origins)을 쓴다.
    // 여기에 주소를 따로 박으면 배포 환경에서 핸드셰이크만 403 으로 막힌다.
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOrigins(allowedOrigins.asArray());
    }
}
