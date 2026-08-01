"""계산 블록 9: 인건비 계산."""

from __future__ import annotations


def calculate_labor_cost(
    production_result: dict[str, float],
    crop: dict[str, float | str],
    standard: dict[str, float],
) -> dict[str, float]:
    """판매량을 상품화율로 역산한 전체 생산량을 기준으로 인건비를 계산한다."""
    marketable_rate = float(crop["marketable_rate"])
    if marketable_rate <= 0:
        raise ValueError("상품화율은 0보다 커야 합니다.")

    reconstructed_production = (
        production_result["monthly_sales_kg"] / marketable_rate
    )
    labor_hours = reconstructed_production * standard["labor_hours_per_kg"]
    monthly_labor_cost = labor_hours * standard["minimum_wage_krw_hour"]

    return {
        "reconstructed_monthly_production_kg": reconstructed_production,
        "monthly_labor_hours": labor_hours,
        "monthly_labor_cost_krw": monthly_labor_cost,
    }
