package com.farmbroker.farmbroker.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// JPA Auditing 활성화 설정.
// User.createdAt 의 @CreatedDate 를 자동으로 채우기 위해 필요하다.
//
// @EnableJpaAuditing 을 메인 애플리케이션 클래스가 아닌 별도 @Configuration 으로 분리한 이유:
// 메인 클래스에 두면 @WebMvcTest 등 JPA 를 로드하지 않는 슬라이스 테스트에서도
// JPA Auditing 빈 생성이 강제되어 "JPA metamodel must not be empty" 오류로 컨텍스트 로딩이 실패한다.
// 별도 설정 클래스로 두면 실제 앱에서는 컴포넌트 스캔으로 로드되지만, 웹 슬라이스 테스트에서는 로드되지 않는다.
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
