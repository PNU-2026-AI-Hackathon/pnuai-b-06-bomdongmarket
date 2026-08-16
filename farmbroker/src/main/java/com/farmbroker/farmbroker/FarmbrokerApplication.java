package com.farmbroker.farmbroker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

// JPA Auditing(@CreatedDate 자동 채움)은 common.config.JpaAuditingConfig 에서 활성화한다.
// (@WebMvcTest 등 웹 슬라이스 테스트에서 JPA metamodel 오류가 나지 않도록 메인 클래스에서 분리)
// KAMIS 시세는 요청마다 부르지 않고 하루 한 번 수집해 스냅샷으로 읽는다 — @EnableScheduling 필요.
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class FarmbrokerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FarmbrokerApplication.class, args);
	}
}
