package com.farmbroker.farmbroker.profit.kamis;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;

// KAMIS 일별 도·소매 가격 조회.
// 응답 한 건은 "어느 날, 어느 시장에서, 어떤 등급의 무엇이 얼마였다"는 조사 기록이고
// 한 작물·하루에도 시장·품종·등급별로 여러 건이 온다. 그래서 대표값을 정하는 규칙이 필요하다.
//
// 이 클래스가 적용하는 규칙:
//  1) 무게 단위(g·kg) 조사만 채택한다.
//     kg환산가격(exmn_dd_cnvs_prc) 필드는 이름과 달리 거래 단위가 개수면 환산되지 않고
//     개당 가격이 그대로 들어온다(파프리카 '1개' 1,160원). 그대로 쓰면 매출이 1/10로 잡힌다.
//  2) 등급을 하나로 고정한다. 등급마다 값이 다르다.
//  3) 조사된 날 중 가장 최근 날짜를 고르고, 그날 기록들의 중앙값을 쓴다.
//     같은 날에도 시장별로 12,600~26,500원까지 벌어져 1건만 집으면 최저가에 걸릴 수 있고,
//     평균은 튀는 값에 끌려간다.
@Slf4j
@Component
public class KamisPriceClient {

    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final Set<String> WEIGHT_UNITS = Set.of("g", "kg", "G", "KG");
    private static final int MAX_ROWS = 1000;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final KamisProperties properties;

    public KamisPriceClient(RestClient.Builder builder, ObjectMapper objectMapper, KamisProperties properties) {
        this.objectMapper = objectMapper;
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(properties.connectTimeoutMs()));
        // read timeout은 읽기가 정체된 시간 제한이라 요청 하나의 전체 시간 상한은 아니다.
        // 그래도 이게 없으면 상대가 연결만 붙잡고 응답하지 않을 때 fetchLatest의 fallback까지 가지 못한다.
        factory.setReadTimeout(Duration.ofMillis(properties.readTimeoutMs()));
        this.restClient = builder.requestFactory(factory).build();
    }

    // 조사 기록 한 건에서 우리가 쓰는 값만 추린 것.
    public record PriceRecord(LocalDate surveyedOn, int pricePerKg, String market) {
    }

    // 대표 시세 한 건. 어느 날 조사인지까지 함께 돌려줘야 신선도를 판단할 수 있다.
    public record DailyPrice(LocalDate surveyedOn, int pricePerKgKrw, int sampleCount) {
    }

    public Optional<DailyPrice> fetchLatest(KamisItemCodes.ItemCode code, LocalDate today) {
        if (!properties.usable()) {
            return Optional.empty();
        }

        List<PriceRecord> records;
        try {
            records = fetchRecords(code, today.minusDays(properties.lookbackDays()), today);
        } catch (Exception e) {
            // 외부 API 장애로 수집이 실패해도 서비스는 기존 단가로 계속 동작해야 한다.
            log.warn("KAMIS 조회 실패 (부류 {}, 품목 {}): {}", code.categoryCode(), code.itemCode(), e.toString());
            return Optional.empty();
        }
        if (records.isEmpty()) {
            return Optional.empty();
        }

        LocalDate latest = records.stream()
                .map(PriceRecord::surveyedOn)
                .max(Comparator.naturalOrder())
                .orElseThrow();
        List<Integer> sameDay = records.stream()
                .filter(record -> record.surveyedOn().equals(latest))
                .map(PriceRecord::pricePerKg)
                .sorted()
                .toList();

        return Optional.of(new DailyPrice(latest, median(sameDay), sameDay.size()));
    }

    private List<PriceRecord> fetchRecords(KamisItemCodes.ItemCode code, LocalDate from, LocalDate to) {
        // 질의 파라미터 이름에 대괄호가 들어가는데(cond[...]) UriComponentsBuilder는 이를 허용하지 않아
        // 쿼리 문자열을 직접 조립한다.
        // serviceKey는 발급 값이 이미 URL 인코딩돼 있어 다시 인코딩하면 인증에 실패하므로 그대로 붙인다.
        String query = "serviceKey=" + properties.serviceKey()
                + "&returnType=JSON"
                + "&pageNo=1"
                + "&numOfRows=" + MAX_ROWS
                + "&" + condition("exmn_ymd::GTE", from.format(YMD))
                + "&" + condition("exmn_ymd::LTE", to.format(YMD))
                + "&" + condition("ctgry_cd::EQ", code.categoryCode())
                + "&" + condition("item_cd::EQ", code.itemCode())
                + "&" + condition("se_cd::EQ", properties.saleType());
        URI uri = URI.create(properties.baseUrl() + "?" + query);

        String body = restClient.get()
                .uri(uri)
                .retrieve()
                .body(String.class);

        JsonNode items = objectMapper.readTree(body).path("response").path("body").path("items").path("item");
        List<PriceRecord> records = new ArrayList<>();
        // 조사가 1건뿐이면 배열이 아니라 객체로 온다.
        if (items.isObject()) {
            toRecord(items).ifPresent(records::add);
        } else {
            items.forEach(node -> toRecord(node).ifPresent(records::add));
        }
        return records;
    }

    // cond[이름]=값 형태. 대괄호는 반드시 인코딩해야 서버가 파라미터로 인식한다.
    private static String condition(String name, String value) {
        return "cond%5B" + name + "%5D=" + URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private Optional<PriceRecord> toRecord(JsonNode node) {
        if (!WEIGHT_UNITS.contains(node.path("unit").asString(""))) {
            return Optional.empty();
        }
        if (!properties.grade().equals(node.path("grd_nm").asString(""))) {
            return Optional.empty();
        }
        String region = properties.normalizedRegion();
        if (!region.isEmpty() && !region.equals(node.path("sgg_nm").asString(""))) {
            return Optional.empty();
        }

        String price = node.path("exmn_dd_cnvs_prc").asString("");
        String surveyedOn = node.path("exmn_ymd").asString("");
        if (!price.matches("\\d+") || !surveyedOn.matches("\\d{8}")) {
            return Optional.empty();
        }
        int pricePerKg = Integer.parseInt(price);
        if (pricePerKg <= 0) {
            return Optional.empty();
        }

        return Optional.of(new PriceRecord(
                LocalDate.parse(surveyedOn, YMD), pricePerKg, node.path("mrkt_nm").asString("")));
    }

    // 정렬된 값의 중앙값. 짝수 개면 가운데 두 값의 평균.
    private static int median(List<Integer> sorted) {
        int size = sorted.size();
        int mid = size / 2;
        return size % 2 == 1 ? sorted.get(mid) : (sorted.get(mid - 1) + sorted.get(mid)) / 2;
    }

    // 수집 배치가 작물마다 연속 호출하므로 상대방 서버를 몰아치지 않도록 간격을 둔다.
    public Duration callInterval() {
        return Duration.ofMillis(200);
    }
}
