package com.farmbroker.farmbroker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// @EnableJpaAuditing: User.createdAt 필드의 @CreatedDate가 자동으로 채워지도록 JPA Auditing 기능을 활성화.
@EnableJpaAuditing
@SpringBootApplication
public class FarmbrokerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FarmbrokerApplication.class, args);
	}

}
