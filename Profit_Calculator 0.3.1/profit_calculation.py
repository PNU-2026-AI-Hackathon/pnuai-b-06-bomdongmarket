"""계산 블록 10: 수익 배분과 계약형태 추천 계산."""

from __future__ import annotations


LONG_TERM_RECOMMENDATION = "도심형 대량생산 스마트팜 방식 추천"
SHORT_TERM_RECOMMENDATION = "개인취미 대여 방식 추천"


def calculate_profit(
    monthly_revenue_krw: float,
    monthly_electricity_cost_krw: float,
    monthly_water_cost_krw: float,
    monthly_material_cost_krw: float,
    monthly_labor_cost_krw: float,
    desired_monthly_rent_krw: float,
    standard: dict[str, float],
    contract: dict[str, float],
) -> dict[str, float | str | bool]:
    """장기형 영업이익을 계산하고 공실 월세와 비교해 계약형태를 추천한다."""
    depreciation_and_other_cost = standard[
        "depreciation_and_other_cost_krw_month"
    ]
    landlord_ratio = contract["landlord_share_ratio"]

    if not 0 <= landlord_ratio <= 1:
        raise ValueError("공간 대여자 배분비율은 0과 1 사이여야 합니다.")
    if desired_monthly_rent_krw < 0:
        raise ValueError("원하는 월세는 음수가 될 수 없습니다.")

    base_cost = (
        monthly_electricity_cost_krw
        + monthly_water_cost_krw
        + monthly_material_cost_krw
    )
    monthly_operating_cost = (
        base_cost + monthly_labor_cost_krw + depreciation_and_other_cost
    )
    monthly_operating_profit = monthly_revenue_krw - monthly_operating_cost
    landlord_expected_income = monthly_operating_profit * landlord_ratio
    business_operating_profit = (
        monthly_operating_profit - landlord_expected_income
    )
    rent_income_difference = landlord_expected_income - desired_monthly_rent_krw

    is_operating_loss = monthly_operating_profit < 0
    is_long_term_recommended = (
        not is_operating_loss
        and landlord_expected_income >= desired_monthly_rent_krw
    )
    if is_long_term_recommended:
        recommendation = LONG_TERM_RECOMMENDATION
        contract_type = "장기계약형"
    else:
        recommendation = SHORT_TERM_RECOMMENDATION
        contract_type = "단기계약형"

    return {
        "monthly_base_cost_krw": base_cost,
        "depreciation_and_other_cost_krw": depreciation_and_other_cost,
        "monthly_operating_cost_krw": monthly_operating_cost,
        "monthly_operating_profit_krw": monthly_operating_profit,
        "landlord_share_ratio": landlord_ratio,
        "landlord_expected_income_krw": landlord_expected_income,
        "desired_monthly_rent_krw": desired_monthly_rent_krw,
        "rent_income_difference_krw": rent_income_difference,
        "business_operating_profit_krw": business_operating_profit,
        "is_operating_loss": is_operating_loss,
        "is_long_term_recommended": is_long_term_recommended,
        "recommendation": recommendation,
        "contract_type": contract_type,
    }
