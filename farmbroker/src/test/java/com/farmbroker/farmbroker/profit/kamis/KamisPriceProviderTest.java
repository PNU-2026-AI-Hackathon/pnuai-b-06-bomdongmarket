package com.farmbroker.farmbroker.profit.kamis;

import com.farmbroker.farmbroker.profit.MarketPrice;
import com.farmbroker.farmbroker.profit.PriceSource;
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

@ExtendWith(MockitoExtension.class)
class KamisPriceProviderTest {

    private static final KamisProperties PROPERTIES =
            new KamisProperties("key", null, "02", null, "상품", 7, 14, true,
                    "Asia/Seoul", 3000, 5000);

    @Mock
    private MarketPriceSnapshotRepository snapshotRepository;

    @Test
    @DisplayName("현재 수집 기준과 같은 스냅샷은 KAMIS 단가로 내려준다")
    void returns_snapshot_matching_current_criteria() {
        given(snapshotRepository.findByCropName("상추"))
                .willReturn(Optional.of(snapshot("02", "", "상품")));

        MarketPrice price = provider().findByCropName("상추").orElseThrow();

        assertThat(price.pricePerKgKrw()).isEqualTo(9500);
        assertThat(price.source()).isEqualTo(PriceSource.KAMIS);
    }

    @Test
    @DisplayName("판매 구분이 다른 스냅샷은 사용하지 않는다")
    void ignores_snapshot_with_different_sale_type() {
        given(snapshotRepository.findByCropName("상추"))
                .willReturn(Optional.of(snapshot("01", "", "상품")));

        assertThat(provider().findByCropName("상추")).isEmpty();
    }

    @Test
    @DisplayName("수집 기준이 없는 레거시 스냅샷은 사용하지 않는다")
    void ignores_legacy_snapshot_without_criteria() {
        given(snapshotRepository.findByCropName("상추"))
                .willReturn(Optional.of(snapshot(null, null, null)));

        assertThat(provider().findByCropName("상추")).isEmpty();
    }

    @Test
    @DisplayName("전국 지역 기준에서는 null과 빈 문자열을 같게 취급한다")
    void treats_null_and_empty_region_as_the_same_criteria() {
        given(snapshotRepository.findByCropName("상추"))
                .willReturn(
                        Optional.of(snapshot("02", null, "상품")),
                        Optional.of(snapshot("02", "", "상품")));

        assertThat(provider().findByCropName("상추")).isPresent();
        assertThat(provider().findByCropName("상추")).isPresent();
    }

    private KamisPriceProvider provider() {
        return new KamisPriceProvider(snapshotRepository, PROPERTIES);
    }

    private static MarketPriceSnapshot snapshot(String saleType, String region, String grade) {
        return new MarketPriceSnapshot(
                "상추",
                9500,
                LocalDate.now(PROPERTIES.zone()).minusDays(1),
                4,
                LocalDateTime.now(PROPERTIES.zone()),
                saleType,
                region,
                grade);
    }
}
