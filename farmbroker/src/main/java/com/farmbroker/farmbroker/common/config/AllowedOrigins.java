package com.farmbroker.farmbroker.common.config;

import java.util.Arrays;
import java.util.List;

// 프런트 Origin 허용 목록을 한 곳에서 해석한다.
//
// REST 의 CORS 와 WebSocket 핸드셰이크의 Origin 검사는 서로 다른 스프링 기능이지만 같은
// 프런트를 상대한다. 목록이 갈리면 한쪽만 열린다 — 실제로 CORS 는 CORS_ALLOWED_ORIGINS 로
// 배포 도메인을 받았는데 STOMP 엔드포인트에는 로컬 주소가 박혀 있어, 배포 환경에서 핸드셰이크만
// 403 으로 막혔다. 클라이언트는 일정 간격으로 다시 붙으므로 콘솔이 실패 로그로 가득 찬다.
//
// 빈으로 두지 않고 값 객체로 둔다. @WebMvcTest 처럼 일부만 띄우는 슬라이스에서
// SecurityConfig 가 이 빈을 찾다가 컨텍스트가 뜨지 않는 일을 피한다.
public final class AllowedOrigins {

    // @Value 기본값에 그대로 넣을 수 있도록 상수로 둔다(애너테이션은 컴파일 상수만 받는다).
    public static final String LOCAL_DEFAULT = "http://localhost:5173,http://localhost:3000";

    private final List<String> origins;

    private AllowedOrigins(List<String> origins) {
        this.origins = origins;
    }

    // 콤마로 나누고 앞뒤 공백과 빈 항목을 걸러낸다.
    public static AllowedOrigins parse(String commaSeparated) {
        return new AllowedOrigins(Arrays.stream(commaSeparated.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
    }

    public List<String> asList() {
        return origins;
    }

    // StompEndpointRegistry.setAllowedOrigins 는 가변 인자를 받는다.
    public String[] asArray() {
        return origins.toArray(String[]::new);
    }
}
