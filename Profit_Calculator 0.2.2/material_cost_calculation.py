"""계산 블록 8: 재료비 계산."""

from __future__ import annotations


def calculate_material_cost(
    space_result: dict[str, float],
    crop: dict[str, float | str],
) -> dict[str, float]:
    """재배면적·회전수·면적당 재료비와 기타 재료비를 합산한다."""
    seedling_cost = (
        space_result["cultivation_area_m2"]
        * float(crop["cycles_per_month"])
        * float(crop["material_cost_per_m2_cycle_krw"])
    )
    other_material_cost = float(crop["other_material_cost_month_krw"])
    total_material_cost = seedling_cost + other_material_cost

    return {
        "monthly_seedling_cost_krw": seedling_cost,
        "monthly_other_material_cost_krw": other_material_cost,
        "monthly_material_cost_krw": total_material_cost,
    }
