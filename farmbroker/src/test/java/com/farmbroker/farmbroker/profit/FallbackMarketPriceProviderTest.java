package com.farmbroker.farmbroker.profit;

import com.farmbroker.farmbroker.profit.kamis.KamisPriceProvider;
import com.farmbroker.farmbroker.profit.kamis.KamisProperties;
import com.farmbroker.farmbroker.profit.kamis.MarketPriceSnapshot;
import com.farmbroker.farmbroker.profit.kamis.MarketPriceSnapshotRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

// 단가 fallback 순서를 검증한다: KAMIS 스냅샷 → 백과사전 기준값 → 없음.
@ExtendWith(MockitoExtension.class)
class FallbackMarketPriceProviderTest {

    private static final KamisProperties PROPERTIES =
            KamisProperties.of("key", null, null, null, null, 7, 14, true);

    @Mock
    private MarketPriceSnapshotRepository snapshotRepository;
    @Mock
    private SeedPriceProvider seedPriceProvider;

    private FallbackMarketPriceProvider provider() {
        return new FallbackMarketPriceProvider(
                new KamisPriceProvider(snapshotRepository, PROPERTIES), seedPriceProvider);
    }

    private static MarketPriceSnapshot snapshot(LocalDate surveyedOn) {
        return new MarketPriceSnapshot("상추", 9500, surveyedOn, 4, LocalDateTime.now());
    }

    @Test
    @DisplayName("최근 조사된 KAMIS 시세가 있으면 그 값을 쓴다")
    void prefers_fresh_kamis_price() {
        given(snapshotRepository.findByCropName("상추"))
                .willReturn(Optional.of(snapshot(LocalDate.now().minusDays(1))));

        MarketPrice price = provider().findByCropName("상추").orElseThrow();

        assertThat(price.pricePerKgKrw()).isEqualTo(9500);
        assertThat(price.source()).isEqualTo(PriceSource.KAMIS);
    }

    // 오래된 시세를 계속 쓰는 것보다 검토해 둔 기준단가가 낫다는 팀 결정(#68 리뷰).
    @Test
    @DisplayName("조사일이 오래된 KAMIS 시세는 버리고 백과사전 기준단가로 내려간다")
    void falls_back_to_seed_when_kamis_price_is_old() {
        given(snapshotRepository.findByCropName("상추"))
                .willReturn(Optional.of(snapshot(LocalDate.now().minusDays(30))));
        given(seedPriceProvider.findByCropName("상추"))
                .willReturn(Optional.of(MarketPrice.seed(9000, LocalDate.of(2026, 7, 4))));

        MarketPrice price = provider().findByCropName("상추").orElseThrow();

        assertThat(price.source()).isEqualTo(PriceSource.SEED);
        assertThat(price.pricePerKgKrw()).isEqualTo(9000);
    }

    // 비제철 작물은 조사 자체가 없다(예: 8월의 딸기).
    @Test
    @DisplayName("KAMIS 시세가 없으면 작물 백과사전 기준값으로 내려간다")
    void falls_back_to_seed_price() {
        given(snapshotRepository.findByCropName("딸기")).willReturn(Optional.empty());
        given(seedPriceProvider.findByCropName("딸기"))
                .willReturn(Optional.of(MarketPrice.seed(30000, LocalDate.of(2026, 7, 4))));

        MarketPrice price = provider().findByCropName("딸기").orElseThrow();

        assertThat(price.pricePerKgKrw()).isEqualTo(30000);
        assertThat(price.source()).isEqualTo(PriceSource.SEED);
    }

    // 단가를 모르는 작물에 추측값을 만들지 않는다 — 호출부가 계산 대상에서 뺀다.
    @Test
    @DisplayName("두 출처 모두 없으면 빈 값을 돌려준다")
    void returns_empty_when_no_source_has_price() {
        given(snapshotRepository.findByCropName("고사리")).willReturn(Optional.empty());
        given(seedPriceProvider.findByCropName("고사리")).willReturn(Optional.empty());

        assertThat(provider().findByCropName("고사리")).isEmpty();
    }
}
