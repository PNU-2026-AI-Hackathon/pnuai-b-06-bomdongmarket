package com.farmbroker.farmbroker.profit;

import com.farmbroker.farmbroker.common.exception.BusinessException;
import com.farmbroker.farmbroker.common.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 수익 계산기 참조 데이터 — hbin Profit_Calculator 0.3.1의 data/*.csv를 그대로 자바 리소스로 옮겨 로드한다.
// Python 원본이 crop_name(한글)으로 조회하므로 여기서도 작물명 키를 유지한다.
// CSV는 UTF-8(BOM 포함)로 저장돼 있어 첫 열 헤더의 BOM을 제거한다.
@Component
public class ProfitReferenceData {

    // 작물 재배 파라미터 (crop_production_info.csv)
    public record CropProduction(
            double yieldPerCycleKgM2,
            double cyclesPerMonth,
            double marketableRate,
            double requiredPpfdUmolM2S,
            double lightingHoursDay,
            double targetTemperatureC,
            double targetRelativeHumidity,
            double dailyEvapotranspirationMm,
            double materialCostPerM2CycleKrw,
            double otherMaterialCostMonthKrw) {
    }

    // 월별 외기 조건 (monthly_environment.csv)
    public record MonthlyEnvironment(
            String month,
            double outdoorTemperatureC,
            double outdoorRelativeHumidity) {
    }

    private Map<String, CropProduction> cropProduction;
    private Map<String, Double> cropSalePrice;   // crop_name -> price_krw_kg
    private Map<String, Double> standard;        // key -> value
    private Map<String, Double> electricStandard;
    private Map<String, Double> contraction;
    private List<MonthlyEnvironment> monthlyEnvironment;

    @PostConstruct
    void load() {
        try {
            this.cropProduction = loadCropProduction();
            this.cropSalePrice = loadCropSalePrice();
            this.standard = loadKeyValue("standard_info.csv");
            this.electricStandard = loadKeyValue("electric_standard_info.csv");
            this.contraction = loadKeyValue("contraction_info.csv");
            this.monthlyEnvironment = loadMonthlyEnvironment();
            if (monthlyEnvironment.size() != 12) {
                throw new IllegalStateException("monthly_environment.csv에는 12개월 데이터가 필요합니다.");
            }
        } catch (IOException e) {
            throw new IllegalStateException("수익 계산기 참조 데이터 로드 실패", e);
        }
    }

    // ── 조회 API ──

    public boolean hasCrop(String cropName) {
        return cropName != null
                && cropProduction.containsKey(cropName)
                && cropSalePrice.containsKey(cropName);
    }

    public CropProduction cropProduction(String cropName) {
        CropProduction crop = cropProduction.get(cropName);
        if (crop == null) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        }
        return crop;
    }

    public double salePriceKrwKg(String cropName) {
        Double price = cropSalePrice.get(cropName);
        if (price == null) {
            throw new BusinessException(ErrorCode.AI_RESPONSE_INVALID);
        }
        return price;
    }

    public double standard(String key) {
        return require(standard, key, "standard_info.csv");
    }

    public double electricStandard(String key) {
        return require(electricStandard, key, "electric_standard_info.csv");
    }

    public double contraction(String key) {
        return require(contraction, key, "contraction_info.csv");
    }

    public List<MonthlyEnvironment> monthlyEnvironment() {
        return monthlyEnvironment;
    }

    private double require(Map<String, Double> map, String key, String file) {
        Double value = map.get(key);
        if (value == null) {
            throw new IllegalStateException(file + "에 설정 키가 없습니다: " + key);
        }
        return value;
    }

    // ── CSV 로더 ──

    private Map<String, CropProduction> loadCropProduction() throws IOException {
        Map<String, CropProduction> result = new LinkedHashMap<>();
        for (Map<String, String> row : readRows("crop_production_info.csv")) {
            result.put(row.get("crop_name").strip(), new CropProduction(
                    parse(row, "yield_per_cycle_kg_m2"),
                    parse(row, "cycles_per_month"),
                    parse(row, "marketable_rate"),
                    parse(row, "required_ppfd_umol_m2_s"),
                    parse(row, "lighting_hours_day"),
                    parse(row, "target_temperature_c"),
                    parse(row, "target_relative_humidity"),
                    parse(row, "daily_evapotranspiration_mm"),
                    parse(row, "material_cost_per_m2_cycle_krw"),
                    parse(row, "other_material_cost_month_krw")));
        }
        return result;
    }

    private Map<String, Double> loadCropSalePrice() throws IOException {
        Map<String, Double> result = new LinkedHashMap<>();
        for (Map<String, String> row : readRows("crop_sale_info.csv")) {
            result.put(row.get("crop_name").strip(), parse(row, "price_krw_kg"));
        }
        return result;
    }

    private Map<String, Double> loadKeyValue(String file) throws IOException {
        Map<String, Double> result = new LinkedHashMap<>();
        for (Map<String, String> row : readRows(file)) {
            String key = row.get("key").strip();
            if (result.containsKey(key)) {
                throw new IllegalStateException("중복된 설정 키입니다: " + file + " / " + key);
            }
            result.put(key, Double.parseDouble(row.get("value").strip()));
        }
        return result;
    }

    private List<MonthlyEnvironment> loadMonthlyEnvironment() throws IOException {
        List<MonthlyEnvironment> result = new ArrayList<>();
        for (Map<String, String> row : readRows("monthly_environment.csv")) {
            result.add(new MonthlyEnvironment(
                    row.get("month").strip(),
                    parse(row, "outdoor_temperature_c"),
                    parse(row, "outdoor_relative_humidity")));
        }
        return result;
    }

    private double parse(Map<String, String> row, String column) {
        return Double.parseDouble(row.get(column).strip());
    }

    // 헤더 기반 행 파싱. 첫 셀의 UTF-8 BOM(﻿)을 제거한다.
    private List<Map<String, String>> readRows(String file) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("profit/" + file).getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new IllegalStateException("CSV 헤더가 없습니다: " + file);
            }
            String[] headers = stripBom(headerLine).split(",", -1);
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] values = line.split(",", -1);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i].strip(), i < values.length ? values[i] : "");
                }
                rows.add(row);
            }
        }
        return rows;
    }

    private String stripBom(String value) {
        return (!value.isEmpty() && value.charAt(0) == '﻿') ? value.substring(1) : value;
    }
}
