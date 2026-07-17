"""계산 블록 10: 일반 방식과 비례배분 방식의 수익 계산."""

from __future__ import annotations


def calculate_profit(
    monthly_revenue_krw: float,
    monthly_electricity_cost_krw: float,
    monthly_water_cost_krw: float,
    monthly_material_cost_krw: float,
    monthly_labor_cost_krw: float,
    standard: dict[str, float],
    contract: dict[str, float],
) -> dict[str, float]:
    """다이어그램의 두 수익배분 방식을 모두 계산한다."""
    depreciation_and_other_cost = standard[
        "depreciation_and_other_cost_krw_month"
    ]
    landlord_ratio = contract["landlord_share_ratio"]
    farmer_ratio = contract["farmer_share_ratio"]

    base_cost = (
        monthly_electricity_cost_krw
        + monthly_water_cost_krw
        + monthly_material_cost_krw
    )

    # 방식 1: 최저시급 인건비를 운영비에 포함한다.
    regular_operating_cost = (
        base_cost + monthly_labor_cost_krw + depreciation_and_other_cost
    )
    regular_operating_profit = monthly_revenue_krw - regular_operating_cost
    # 사용자가 확인한 의도대로 0.6 + 0.2 = 0.8을 일반 방식 배분율로 사용한다.
    regular_landlord_ratio = landlord_ratio + farmer_ratio
    regular_landlord_income = regular_operating_profit * regular_landlord_ratio
    regular_business_profit = (
        regular_operating_profit - regular_landlord_income
    )

    # 방식 2: 농부 인건비 대신 영업이익의 일정 비율을 배분한다.
    shared_operating_cost = base_cost + depreciation_and_other_cost
    shared_operating_profit = monthly_revenue_krw - shared_operating_cost
    shared_landlord_income = shared_operating_profit * landlord_ratio
    shared_farmer_income = shared_operating_profit * farmer_ratio
    shared_business_profit = (
        shared_operating_profit
        - shared_landlord_income
        - shared_farmer_income
    )

    return {
        "monthly_base_cost_krw": base_cost,
        "depreciation_and_other_cost_krw": depreciation_and_other_cost,
        "regular_operating_cost_krw": regular_operating_cost,
        "regular_operating_profit_krw": regular_operating_profit,
        "regular_landlord_share_ratio": regular_landlord_ratio,
        "regular_landlord_income_krw": regular_landlord_income,
        "regular_business_profit_krw": regular_business_profit,
        "shared_operating_cost_krw": shared_operating_cost,
        "shared_operating_profit_krw": shared_operating_profit,
        "shared_landlord_income_krw": shared_landlord_income,
        "shared_farmer_income_krw": shared_farmer_income,
        "shared_business_profit_krw": shared_business_profit,
    }
