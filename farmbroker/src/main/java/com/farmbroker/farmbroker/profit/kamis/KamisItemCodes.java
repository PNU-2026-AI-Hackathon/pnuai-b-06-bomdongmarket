package com.farmbroker.farmbroker.profit.kamis;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

// 작물명 → KAMIS 부류코드·품목코드 표.
// KAMIS는 작물명이 아니라 코드로만 조회할 수 있고, 두 코드가 모두 필수 파라미터다.
// 백과사전 작물 중 KAMIS에 대응 품목이 없는 것은 여기 없으면 수집 대상에서 빠진다.
@Slf4j
@Component
public class KamisItemCodes {

    public record ItemCode(String categoryCode, String itemCode) {
    }

    private final Map<String, ItemCode> codes = new LinkedHashMap<>();

    @PostConstruct
    void load() {
        ClassPathResource resource = new ClassPathResource("profit/kamis_item_codes.csv");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            reader.readLine(); // 헤더
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] parts = line.split(",");
                if (parts.length < 3) continue;
                codes.put(parts[0].trim(), new ItemCode(parts[1].trim(), parts[2].trim()));
            }
        } catch (IOException e) {
            throw new IllegalStateException("KAMIS 품목코드 표를 읽지 못했습니다.", e);
        }
        log.info("KAMIS 품목코드 {}건 로드", codes.size());
    }

    public Map<String, ItemCode> all() {
        return Map.copyOf(codes);
    }
}
