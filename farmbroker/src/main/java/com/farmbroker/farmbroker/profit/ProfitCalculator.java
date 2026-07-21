package com.farmbroker.farmbroker.profit;

import com.farmbroker.farmbroker.profit.ProfitReferenceData.CropProduction;
import com.farmbroker.farmbroker.profit.ProfitReferenceData.MonthlyEnvironment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

// hbin Profit_Calculator 0.3.1(Python)의 계산 블록 1~10을 자바로 포팅한 결정론적 계산기.
// LLM 도구(function calling)가 아니라 서버가 추천 작물명으로 직접 호출한다.
// 기간 기준: 월평균(전력은 12개월 시나리오의 산술평균). Python 원본과 수치가 일치하도록 계산 순서를 유지한다.
@Component
@RequiredArgsConstructor
public class ProfitCalculator {

    private static final double DAYS_PER_AVERAGE_MONTH = 365.0 / 12.0;
    private static final double HOURS_PER_AVERAGE_MONTH = 24.0 * DAYS_PER_AVERAGE_MONTH;

    private final ProfitReferenceData data;

    public boolean supports(String cropName) {
        return data.hasCrop(cropName);
    }

    // 공간 입력 + 작물명으로 월평균 수익성을 계산한다. 참조 데이터에 없는 작물이면 예외 대신 호출 전 supports()로 걸러야 한다.
    public ProfitEstimate estimate(SpaceInputs space, String cropName) {
        CropProduction crop = data.cropProduction(cropName);
        double pricePerKg = data.salePriceKrwKg(cropName);

        Space s = calculateSpace(space);
        Production production = calculateProduction(s, crop);
        double revenue = production.monthlySalesKg() * pricePerKg;               // 블록3 매출

        Lighting lighting = calculateLighting(s, crop);
        Energy energy = calculateEnergy(s, crop, lighting);                      // 블록4~6 전력
        double electricityCost = energy.averageMonthlyEnergyKwh() * data.standard("electricity_rate_krw_kwh");

        double waterCost = calculateWaterCost(s, crop);                          // 블록7 용수
        double materialCost = calculateMaterialCost(s, crop);                    // 블록8 재료
        double laborCost = calculateLaborCost(production, crop);                 // 블록9 인건

        return calculateProfit(space, cropName, s, production, pricePerKg, revenue,
                lighting, energy, electricityCost, waterCost, materialCost, laborCost); // 블록10 손익
    }

    // 블록1: 공간 면적·체적
    private Space calculateSpace(SpaceInputs in) {
        if (in.totalAreaM2() <= 0) {
            throw new IllegalArgumentException("공실 전체면적은 0보다 커야 합니다.");
        }
        if (in.cultivableRatio() < 0 || in.cultivableRatio() > 1) {
            throw new IllegalArgumentException("재배가능 비율은 0과 1 사이여야 합니다.");
        }
        if (in.moduleLayers() <= 0 || in.ceilingHeightM() <= 0) {
            throw new IllegalArgumentException("재배모듈 층 수와 천장 높이는 0보다 커야 합니다.");
        }
        double availableFloor = in.totalAreaM2() * in.cultivableRatio();
        double cultivation = availableFloor * in.moduleLayers();
        double volume = in.totalAreaM2() * in.ceilingHeightM();
        double length = Math.sqrt(in.totalAreaM2());
        double wallOneSide = length * in.ceilingHeightM();
        return new Space(in.totalAreaM2(), availableFloor, cultivation, volume, wallOneSide);
    }

    // 블록2: 생산량
    private Production calculateProduction(Space s, CropProduction crop) {
        if (crop.yieldPerCycleKgM2() < 0 || crop.cyclesPerMonth() < 0) {
            throw new IllegalArgumentException("생산량과 회전수는 음수가 될 수 없습니다.");
        }
        if (crop.marketableRate() <= 0 || crop.marketableRate() > 1) {
            throw new IllegalArgumentException("상품화율은 0보다 크고 1 이하여야 합니다.");
        }
        double perM2Month = crop.yieldPerCycleKgM2() * crop.cyclesPerMonth();
        double total = s.cultivationAreaM2() * perM2Month;
        double sales = total * crop.marketableRate();
        return new Production(total, sales);
    }

    // 블록4: 조명 정격/에너지/발열 (월 무관)
    private Lighting calculateLighting(Space s, CropProduction crop) {
        double ledEfficiency = data.electricStandard("led_photon_efficiency_umol_j");
        double heatConversion = data.electricStandard("heat_conversion_rate");
        double lightingHoursDay = crop.lightingHoursDay();
        if (lightingHoursDay < 0 || lightingHoursDay > 24) {
            throw new IllegalArgumentException("하루 조명 점등시간은 0~24시간이어야 합니다.");
        }
        if (ledEfficiency <= 0) {
            throw new IllegalArgumentException("LED 효율 입력값을 확인해 주세요.");
        }
        double powerW = s.cultivationAreaM2() * crop.requiredPpfdUmolM2S() / ledEfficiency;
        double onHours = lightingHoursDay * DAYS_PER_AVERAGE_MONTH;
        double offHours = (24.0 - lightingHoursDay) * DAYS_PER_AVERAGE_MONTH;
        double energyKwh = powerW * onHours / 1000.0;
        double heatW = powerW * heatConversion;
        return new Lighting(powerW, heatW, onHours, offHours, energyKwh);
    }

    // 블록4~6: 월별 냉난방·가습/제습을 계산하고 조명까지 더해 월평균 전력량을 구한다
    private Energy calculateEnergy(Space s, CropProduction crop, Lighting lighting) {
        double wallU = data.electricStandard("wall_u_value_w_m2_k");
        double airDensity = data.standard("air_density_kg_m3");
        double airSpecificHeat = data.standard("air_specific_heat_j_kg_k");
        double ach = data.standard("air_changes_per_hour");
        double cop = data.standard("hvac_cop");
        double shr = data.standard("sensible_heat_ratio");
        if (cop <= 0 || shr <= 0 || shr > 1) {
            throw new IllegalArgumentException("COP, SHR 입력값을 확인해 주세요.");
        }

        double atmospheric = data.standard("atmospheric_pressure_pa");
        double dryAirGasConstant = data.standard("dry_air_gas_constant_j_kg_k");
        double humidityRatioConstant = data.standard("humidity_ratio_constant");
        double latentHeat = data.standard("latent_heat_kwh_kg");
        double dehumidificationSec = data.standard("dehumidification_sec_kwh_kg");
        double humidificationSec = data.standard("humidification_sec_kwh_kg");

        double targetTemp = crop.targetTemperatureC();
        if (crop.targetRelativeHumidity() < 0 || crop.targetRelativeHumidity() > 1) {
            throw new IllegalArgumentException("목표 상대습도는 0과 1 사이여야 합니다.");
        }
        double targetHumidityRatio = humidityRatio(targetTemp, crop.targetRelativeHumidity(),
                atmospheric, humidityRatioConstant).ratio();
        double monthlyEvapotranspirationKg =
                s.cultivationAreaM2() * crop.dailyEvapotranspirationMm() * DAYS_PER_AVERAGE_MONTH;

        double energySum = 0.0;
        List<MonthlyEnvironment> months = data.monthlyEnvironment();
        for (MonthlyEnvironment env : months) {
            double delta = targetTemp - env.outdoorTemperatureC();

            // 외부 노출 벽면 2면 가정 (블록4)
            double wallLoadW = delta * s.wallAreaOneSideM2() * wallU * 2.0;
            double ventilationLoadW = delta * s.volumeM3() * airDensity * airSpecificHeat * ach / 3600.0;
            double maintainLoadW = wallLoadW + ventilationLoadW;

            double heatOnW = Math.max(maintainLoadW - lighting.heatW(), 0.0);
            double coolOnW = Math.max(lighting.heatW() - maintainLoadW, 0.0);
            double heatOffW = Math.max(maintainLoadW, 0.0);
            double coolOffW = Math.max(-maintainLoadW, 0.0);

            double heatingKwh = (heatOnW * lighting.onHours() + heatOffW * lighting.offHours()) / (cop * 1000.0);
            double coolingKwh = (coolOnW * lighting.onHours() + coolOffW * lighting.offHours()) / (shr * cop * 1000.0);
            double sensibleCoolingKwh = coolingKwh * shr * cop;

            // 블록5: 가습/제습
            HumidityRatio outside = humidityRatio(env.outdoorTemperatureC(), env.outdoorRelativeHumidity(),
                    atmospheric, humidityRatioConstant);
            double dryAirDensity = (atmospheric - outside.vaporPressure())
                    / (dryAirGasConstant * (env.outdoorTemperatureC() + 273.15));
            double monthlyDryAirMass = s.volumeM3() * ach * dryAirDensity * HOURS_PER_AVERAGE_MONTH;
            double ventilationMoistureKg = monthlyDryAirMass * (outside.ratio() - targetHumidityRatio);
            double baseNetMoistureKg = monthlyEvapotranspirationKg + ventilationMoistureKg;

            double latentCoolingKwh = sensibleCoolingKwh * (1.0 - shr) / shr;
            double coolingDehumidificationKg = latentCoolingKwh / latentHeat;
            double remainingMoistureKg = baseNetMoistureKg - coolingDehumidificationKg;

            double dehumidificationKwh = Math.max(0.0, remainingMoistureKg) * dehumidificationSec;
            double humidificationKwh = Math.max(0.0, -remainingMoistureKg) * humidificationSec;

            // 블록6: 조명 포함 월 총 환경제어 전력량
            double monthTotal = lighting.energyKwh() + heatingKwh + coolingKwh
                    + dehumidificationKwh + humidificationKwh;
            energySum += monthTotal;
        }

        double averageMonthlyEnergy = energySum / months.size();
        return new Energy(monthlyEvapotranspirationKg, averageMonthlyEnergy);
    }

    // 블록7: 용수비
    private double calculateWaterCost(Space s, CropProduction crop) {
        double evapotranspirationL = s.cultivationAreaM2() * crop.dailyEvapotranspirationMm() * DAYS_PER_AVERAGE_MONTH;
        double otherWaterL = s.totalAreaM2() * data.standard("other_water_l_m2_day") * DAYS_PER_AVERAGE_MONTH;
        double totalWaterM3 = (evapotranspirationL + otherWaterL) / 1000.0;
        return totalWaterM3 * data.standard("water_rate_krw_m3");
    }

    // 블록8: 재료비
    private double calculateMaterialCost(Space s, CropProduction crop) {
        double seedling = s.cultivationAreaM2() * crop.cyclesPerMonth() * crop.materialCostPerM2CycleKrw();
        return seedling + crop.otherMaterialCostMonthKrw();
    }

    // 블록9: 인건비 (판매량을 상품화율로 역산한 전체 생산량 기준)
    private double calculateLaborCost(Production production, CropProduction crop) {
        if (crop.marketableRate() <= 0) {
            throw new IllegalArgumentException("상품화율은 0보다 커야 합니다.");
        }
        double reconstructedProduction = production.monthlySalesKg() / crop.marketableRate();
        double laborHours = reconstructedProduction * data.standard("labor_hours_per_kg");
        return laborHours * data.standard("minimum_wage_krw_hour");
    }

    // 블록10: 손익·수익배분·계약형태 추천
    private ProfitEstimate calculateProfit(SpaceInputs in, String cropName, Space s, Production production,
                                           double pricePerKg, double revenue, Lighting lighting, Energy energy,
                                           double electricityCost, double waterCost, double materialCost,
                                           double laborCost) {
        double depreciation = data.standard("depreciation_and_other_cost_krw_month");
        double landlordRatio = data.contraction("landlord_share_ratio");
        if (landlordRatio < 0 || landlordRatio > 1) {
            throw new IllegalArgumentException("공간 대여자 배분비율은 0과 1 사이여야 합니다.");
        }
        if (in.desiredMonthlyRentKrw() < 0) {
            throw new IllegalArgumentException("원하는 월세는 음수가 될 수 없습니다.");
        }

        double baseCost = electricityCost + waterCost + materialCost;
        double operatingCost = baseCost + laborCost + depreciation;
        double operatingProfit = revenue - operatingCost;
        double landlordExpectedIncome = operatingProfit * landlordRatio;
        double businessOperatingProfit = operatingProfit - landlordExpectedIncome;
        double rentIncomeDifference = landlordExpectedIncome - in.desiredMonthlyRentKrw();

        boolean operatingLoss = operatingProfit < 0;
        boolean longTermRecommended = !operatingLoss && landlordExpectedIncome >= in.desiredMonthlyRentKrw();
        String recommendation = longTermRecommended
                ? "도심형 대량생산 스마트팜 방식 추천" : "개인취미 대여 방식 추천";
        String contractType = longTermRecommended ? "장기계약형" : "단기계약형";

        return new ProfitEstimate(
                cropName,
                s.totalAreaM2(), in.cultivableRatio(), in.moduleLayers(), in.ceilingHeightM(),
                s.availableFloorAreaM2(), s.cultivationAreaM2(),
                lighting.powerW(), energy.averageMonthlyEnergyKwh(),
                production.monthlyTotalProductionKg(), production.monthlySalesKg(), pricePerKg, revenue,
                electricityCost, waterCost, materialCost, laborCost, depreciation, operatingCost,
                operatingProfit, landlordRatio, landlordExpectedIncome, in.desiredMonthlyRentKrw(),
                rentIncomeDifference, businessOperatingProfit, operatingLoss, longTermRecommended,
                recommendation, contractType);
    }

    // 마그누스 근사식 포화수증기압 → 습공기비 + 수증기압
    private HumidityRatio humidityRatio(double temperatureC, double relativeHumidity,
                                        double atmosphericPressurePa, double humidityRatioConstant) {
        double saturation = 610.94 * Math.exp(17.625 * temperatureC / (temperatureC + 243.04));
        double vapor = relativeHumidity * saturation;
        double ratio = humidityRatioConstant * vapor / (atmosphericPressurePa - vapor);
        return new HumidityRatio(ratio, vapor);
    }

    // ── 내부 중간 계산 결과 ──
    private record Space(double totalAreaM2, double availableFloorAreaM2, double cultivationAreaM2,
                         double volumeM3, double wallAreaOneSideM2) {
    }

    private record Production(double monthlyTotalProductionKg, double monthlySalesKg) {
    }

    private record Lighting(double powerW, double heatW, double onHours, double offHours, double energyKwh) {
    }

    private record Energy(double monthlyEvapotranspirationKg, double averageMonthlyEnergyKwh) {
    }

    private record HumidityRatio(double ratio, double vaporPressure) {
    }
}
