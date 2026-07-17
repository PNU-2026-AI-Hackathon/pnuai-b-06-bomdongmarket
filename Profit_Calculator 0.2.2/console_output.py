"""Profit Calculator의 기존 콘솔 출력 형식."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from statistics import fmean


def format_number(value: float, decimals: int = 2) -> str:
    return f"{value:,.{decimals}f}"


def format_krw(value: float) -> str:
    rounded = Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return f"{rounded:,.0f}원"


def format_kwh(value: float) -> str:
    rounded = Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return f"{rounded:,.0f}"


def average_month_value(
    rows: list[dict[str, float | str]], key: str
) -> float:
    return fmean(float(row[key]) for row in rows)


def print_site_result(site: dict[str, object]) -> None:
    """한 사업장의 1~10번 계산과 12개월 상세 결과를 출력한다."""
    space_row = site["space_row"]
    space = site["space"]
    production = site["production"]
    sales = site["sales"]
    hvac = site["hvac"]
    humidity = site["humidity"]
    electricity = site["electricity"]
    water = site["water"]
    material = site["material"]
    labor = site["labor"]
    profit = site["profit"]

    assert isinstance(space_row, dict)
    assert isinstance(space, dict)
    assert isinstance(production, dict)
    assert isinstance(sales, dict)
    assert isinstance(hvac, dict)
    assert isinstance(humidity, dict)
    assert isinstance(electricity, dict)
    assert isinstance(water, dict)
    assert isinstance(material, dict)
    assert isinstance(labor, dict)
    assert isinstance(profit, dict)

    hvac_monthly = hvac["monthly"]
    humidity_monthly = humidity["monthly"]
    electricity_monthly = electricity["monthly"]
    assert isinstance(hvac_monthly, list)
    assert isinstance(humidity_monthly, list)
    assert isinstance(electricity_monthly, list)

    print("\n" + "=" * 104)
    print(
        f"사업장 {space_row['site_id']} | {space_row['site_name']} | "
        f"재배작물: {space_row['crop_name']}"
    )
    print("=" * 104)
    print(
        "[1 공간] "
        f"전체 {format_number(float(space['total_area_m2']))}m² | "
        f"사용가능 바닥 {format_number(float(space['available_floor_area_m2']))}m² | "
        f"재배 {format_number(float(space['cultivation_area_m2']))}m² | "
        f"체적 {format_number(float(space['volume_m3']))}m³ | "
        f"벽 한 면 {format_number(float(space['wall_area_one_side_m2']))}m²"
    )
    print(
        "[2 생산] "
        f"월 총생산 {format_number(float(production['monthly_total_production_kg']))}kg | "
        f"월 판매 {format_number(float(production['monthly_sales_kg']))}kg"
    )
    print(
        "[3 매출] "
        f"판매단가 {format_krw(float(sales['price_krw_kg']))}/kg | "
        f"월 매출 {format_krw(float(sales['monthly_revenue_krw']))}"
    )
    print(
        "[4 조명·냉난방] "
        f"조명전력 {format_number(float(hvac['lighting_power_w']))}W | "
        f"월 조명사용량 {format_kwh(float(hvac['lighting_energy_kwh_month']))}kWh | "
        f"월평균 난방 {format_kwh(average_month_value(hvac_monthly, 'heating_energy_kwh'))}kWh | "
        f"월평균 냉방 {format_kwh(average_month_value(hvac_monthly, 'cooling_energy_kwh'))}kWh"
    )
    print(
        "[5 습도] "
        f"월 증발산 {format_number(float(humidity['monthly_evapotranspiration_kg']))}kg | "
        f"월평균 제습 {format_kwh(average_month_value(humidity_monthly, 'dehumidification_energy_kwh'))}kWh | "
        f"월평균 가습 {format_kwh(average_month_value(humidity_monthly, 'humidification_energy_kwh'))}kWh"
    )
    print(
        "[6 전기비] "
        f"월평균 총 전력량 {format_kwh(float(electricity['average_monthly_energy_kwh']))}kWh | "
        f"월 전기비 {format_krw(float(electricity['monthly_electricity_cost_krw']))}"
    )
    print(
        "[7 수도비] "
        f"월 용수량 {format_number(float(water['monthly_total_water_m3']), 3)}m³ | "
        f"월 수도비 {format_krw(float(water['monthly_water_cost_krw']))}"
    )
    print(
        "[8 재료비] "
        f"월 모종비 {format_krw(float(material['monthly_seedling_cost_krw']))} | "
        f"기타 {format_krw(float(material['monthly_other_material_cost_krw']))} | "
        f"합계 {format_krw(float(material['monthly_material_cost_krw']))}"
    )
    print(
        "[9 인건비] "
        f"월 노동 {format_number(float(labor['monthly_labor_hours']))}시간 | "
        f"월 인건비 {format_krw(float(labor['monthly_labor_cost_krw']))}"
    )

    print("\n월별 환경제어 전력량 [kWh/month]")
    print(
        f"{'월':>3} {'외기℃':>7} {'RH':>6} {'조명':>10} {'난방':>10} "
        f"{'냉방':>10} {'제습':>10} {'가습':>10} {'총합':>11}"
    )
    for hvac_month, electricity_month in zip(
        hvac_monthly, electricity_monthly, strict=True
    ):
        print(
            f"{str(hvac_month['month']):>3} "
            f"{float(hvac_month['outdoor_temperature_c']):>7.1f} "
            f"{float(hvac_month['outdoor_relative_humidity']):>6.2f} "
            f"{format_kwh(float(electricity_month['lighting_energy_kwh'])):>10} "
            f"{format_kwh(float(electricity_month['heating_energy_kwh'])):>10} "
            f"{format_kwh(float(electricity_month['cooling_energy_kwh'])):>10} "
            f"{format_kwh(float(electricity_month['dehumidification_energy_kwh'])):>10} "
            f"{format_kwh(float(electricity_month['humidification_energy_kwh'])):>10} "
            f"{format_kwh(float(electricity_month['total_environment_energy_kwh'])):>11}"
        )

    print("\n[10 수익 - 방식 1: 최저시급 지급]")
    print(
        f"  월 기초비용 {format_krw(float(profit['monthly_base_cost_krw']))} | "
        f"월 운영비용 {format_krw(float(profit['regular_operating_cost_krw']))} | "
        f"월 영업이익 {format_krw(float(profit['regular_operating_profit_krw']))}"
    )
    print(
        f"  공간 대여자 예상수익(배분율 0.8) "
        f"{format_krw(float(profit['regular_landlord_income_krw']))} | "
        f"사업장 영업이익 {format_krw(float(profit['regular_business_profit_krw']))}"
    )

    print("[10 수익 - 방식 2: 농부 비례배분]")
    print(
        f"  월 운영비용 {format_krw(float(profit['shared_operating_cost_krw']))} | "
        f"배분 전 영업이익 {format_krw(float(profit['shared_operating_profit_krw']))}"
    )
    print(
        f"  공간 대여자(0.6) {format_krw(float(profit['shared_landlord_income_krw']))} | "
        f"농부(0.2) {format_krw(float(profit['shared_farmer_income_krw']))} | "
        f"사업장(잔여 0.2) {format_krw(float(profit['shared_business_profit_krw']))}"
    )


def print_total_result(sites: list[dict[str, object]]) -> None:
    """전체 사업장의 두 수익 방식 합계를 출력한다."""

    def total(section: str, key: str) -> float:
        return sum(float(site[section][key]) for site in sites)  # type: ignore[index]

    print("\n" + "#" * 104)
    print(f"{len(sites)}개 사업장 전체 월 합계")
    print("#" * 104)
    print(f"전체 월 매출: {format_krw(total('sales', 'monthly_revenue_krw'))}")
    print(
        "방식 1 | "
        f"공간 대여자 예상수익 {format_krw(total('profit', 'regular_landlord_income_krw'))} | "
        f"사업 영업이익 {format_krw(total('profit', 'regular_business_profit_krw'))}"
    )
    print(
        "방식 2 | "
        f"공간 대여자 예상수익 {format_krw(total('profit', 'shared_landlord_income_krw'))} | "
        f"농부 예상수익 {format_krw(total('profit', 'shared_farmer_income_krw'))} | "
        f"사업 영업이익 {format_krw(total('profit', 'shared_business_profit_krw'))}"
    )
