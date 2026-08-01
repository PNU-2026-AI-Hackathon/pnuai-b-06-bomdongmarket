"""계산 블록 2: 생산량과 판매량 계산."""

from __future__ import annotations


def calculate_production(
    space_result: dict[str, float],
    crop: dict[str, float | str],
) -> dict[str, float]:
    """면적당 생산량, 회전수, 상품화율로 월 생산량과 판매량을 계산한다."""
    yield_per_cycle = float(crop["yield_per_cycle_kg_m2"])
    cycles_per_month = float(crop["cycles_per_month"])
    marketable_rate = float(crop["marketable_rate"])

    if yield_per_cycle < 0 or cycles_per_month < 0:
        raise ValueError("생산량과 회전수는 음수가 될 수 없습니다.")
    if not 0 < marketable_rate <= 1:
        raise ValueError("상품화율은 0보다 크고 1 이하여야 합니다.")

    production_per_m2_month = yield_per_cycle * cycles_per_month
    total_production = (
        space_result["cultivation_area_m2"] * production_per_m2_month
    )
    monthly_sales = total_production * marketable_rate

    return {
        "production_per_m2_month_kg": production_per_m2_month,
        "monthly_total_production_kg": total_production,
        "monthly_sales_kg": monthly_sales,
    }
