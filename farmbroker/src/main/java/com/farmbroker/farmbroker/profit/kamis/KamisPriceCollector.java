package com.farmbroker.farmbroker.profit.kamis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// 하루 한 번 KAMIS 시세를 받아 스냅샷 표에 반영한다.
// 조사는 매일 있지 않으므로(주말·공휴일 공백) 매번 며칠치를 거슬러 조회해 가장 최근 조사일을 찾는다.
// 시세를 못 받은 작물은 기존 스냅샷을 지우지 않는다 — 지우면 백과사전 기준값으로 떨어져
// 예상 수익이 이유 없이 출렁인다.
@Slf4j
@Component
@RequiredArgsConstructor
public class KamisPriceCollector {

    private final KamisPriceClient client;
    private final KamisItemCodes itemCodes;
    private final KamisSnapshotWriter writer;
    private final KamisProperties properties;

    // 매일 새벽 4시. KAMIS 조사 결과가 전날 오후에 올라오므로 그 이후 시간대로 둔다.
    // 주기를 설정으로 뺀 이유 — 배포 후 수집이 실제로 도는지 확인하려면 4시까지 기다릴 수 없다.
    @Scheduled(cron = "${kamis.cron:0 0 4 * * *}", zone = "${kamis.timezone:Asia/Seoul}")
    public void collectDaily() {
        collect(LocalDate.now(properties.zone()));
    }

    public int collect(LocalDate today) {
        if (!properties.usable()) {
            log.info("KAMIS 수집 건너뜀 — 비활성화 상태이거나 서비스 키가 없습니다.");
            return 0;
        }

        int updated = 0;
        int missing = 0;
        int failed = 0;
        List<Map.Entry<String, KamisItemCodes.ItemCode>> entries = List.copyOf(itemCodes.all().entrySet());
        for (int i = 0; i < entries.size(); i++) {
            Map.Entry<String, KamisItemCodes.ItemCode> entry = entries.get(i);
            Optional<KamisPriceClient.DailyPrice> price = client.fetchLatest(entry.getValue(), today);
            if (price.isEmpty()) {
                // 제철이 아니면 조사 자체가 없다(예: 8월의 딸기). 실패가 아니라 정상 상황이다.
                missing++;
            } else {
                try {
                    writer.upsert(
                            entry.getKey(), price.get(), properties.saleType(), properties.normalizedRegion(),
                            properties.grade(), LocalDateTime.now(properties.zone()));
                    updated++;
                } catch (Exception e) {
                    // 동시 배치의 유니크 충돌도 이 작물만 롤백한 뒤 다음 작물 수집을 이어 간다.
                    failed++;
                    log.warn("KAMIS 스냅샷 저장 실패 (작물 {}): {}", entry.getKey(), e.toString());
                }
            }

            if (i < entries.size() - 1 && !sleepBetweenCalls()) {
                log.info("KAMIS 시세 수집 중단 — 갱신 {}건, 시세 없음 {}건, 저장 실패 {}건", updated, missing, failed);
                return updated;
            }
        }

        log.info("KAMIS 시세 수집 완료 — 갱신 {}건, 시세 없음 {}건, 저장 실패 {}건", updated, missing, failed);
        return updated;
    }

    private boolean sleepBetweenCalls() {
        try {
            Thread.sleep(client.callInterval().toMillis());
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
