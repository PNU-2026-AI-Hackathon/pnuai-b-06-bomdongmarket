package com.farmbroker.farmbroker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// JPA Auditing(@CreatedDate 자동 채움)은 common.config.JpaAuditingConfig 에서 활성화한다.
// (@WebMvcTest 등 웹 슬라이스 테스트에서 JPA metamodel 오류가 나지 않도록 메인 클래스에서 분리)
@SpringBootApplication
public class FarmbrokerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FarmbrokerApplication.class, args);
	}
}
