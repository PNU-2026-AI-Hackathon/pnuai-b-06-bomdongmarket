package com.farmbroker.farmbroker.profit.kamis;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;

@ExtendWith(MockitoExtension.class)
class KamisPriceCollectorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 13);
    private static final KamisProperties ENABLED_PROPERTIES =
            new KamisProperties("key", null, "02", null, "상품", 7, 14, true,
                    "Asia/Seoul", 3000, 5000);

    @Mock
    private KamisPriceClient client;
    @Mock
    private KamisItemCodes itemCodes;
    @Mock
    private KamisSnapshotWriter writer;

    @Test
    @DisplayName("시세가 있는 작물만 스냅샷을 저장한다")
    void writes_only_crops_with_prices() {
        KamisItemCodes.ItemCode lettuceCode = new KamisItemCodes.ItemCode("200", "212");
        KamisItemCodes.ItemCode strawberryCode = new KamisItemCodes.ItemCode("200", "226");
        KamisPriceClient.DailyPrice lettucePrice = new KamisPriceClient.DailyPrice(TODAY, 9500, 4);
        given(itemCodes.all()).willReturn(items(
                Map.entry("상추", lettuceCode),
                Map.entry("딸기", strawberryCode)));
        given(client.fetchLatest(lettuceCode, TODAY)).willReturn(Optional.of(lettucePrice));
        given(client.fetchLatest(strawberryCode, TODAY)).willReturn(Optional.empty());
        given(client.callInterval()).willReturn(Duration.ZERO);

        int updated = collector(ENABLED_PROPERTIES).collect(TODAY);

        assertThat(updated).isEqualTo(1);
        verify(writer).upsert(
                eq("상추"), eq(lettucePrice), eq("02"), eq(""), eq("상품"), any(LocalDateTime.class));
        verify(writer, never()).upsert(
                eq("딸기"), any(), anyString(), anyString(), anyString(), any(LocalDateTime.class));
        verifyNoMoreInteractions(writer);
    }

    @Test
    @DisplayName("한 작물 저장이 실패해도 다음 작물 수집을 계속한다")
    void continues_after_writer_failure() {
        KamisItemCodes.ItemCode lettuceCode = new KamisItemCodes.ItemCode("200", "212");
        KamisItemCodes.ItemCode spinachCode = new KamisItemCodes.ItemCode("200", "213");
        KamisPriceClient.DailyPrice lettucePrice = new KamisPriceClient.DailyPrice(TODAY, 9500, 4);
        KamisPriceClient.DailyPrice spinachPrice = new KamisPriceClient.DailyPrice(TODAY, 8200, 3);
        given(itemCodes.all()).willReturn(items(
                Map.entry("상추", lettuceCode),
                Map.entry("시금치", spinachCode)));
        given(client.fetchLatest(lettuceCode, TODAY)).willReturn(Optional.of(lettucePrice));
        given(client.fetchLatest(spinachCode, TODAY)).willReturn(Optional.of(spinachPrice));
        given(client.callInterval()).willReturn(Duration.ZERO);
        willThrow(new IllegalStateException("unique constraint"))
                .given(writer).upsert(
                        eq("상추"), eq(lettucePrice), anyString(), anyString(), anyString(), any(LocalDateTime.class));

        int updated = collector(ENABLED_PROPERTIES).collect(TODAY);

        assertThat(updated).isEqualTo(1);
        verify(writer).upsert(
                eq("시금치"), eq(spinachPrice), eq("02"), eq(""), eq("상품"), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("KAMIS 설정을 사용할 수 없으면 수집을 시작하지 않는다")
    void skips_collection_when_properties_are_not_usable() {
        KamisProperties disabledProperties =
                new KamisProperties("", null, "02", null, "상품", 7, 14, true,
                        "Asia/Seoul", 3000, 5000);

        int updated = collector(disabledProperties).collect(TODAY);

        assertThat(updated).isZero();
        verifyNoInteractions(client, itemCodes, writer);
    }

    private KamisPriceCollector collector(KamisProperties properties) {
        return new KamisPriceCollector(client, itemCodes, writer, properties);
    }

    @SafeVarargs
    private static Map<String, KamisItemCodes.ItemCode> items(
            Map.Entry<String, KamisItemCodes.ItemCode>... entries) {
        Map<String, KamisItemCodes.ItemCode> items = new LinkedHashMap<>();
        for (Map.Entry<String, KamisItemCodes.ItemCode> entry : entries) {
            items.put(entry.getKey(), entry.getValue());
        }
        return items;
    }
}
