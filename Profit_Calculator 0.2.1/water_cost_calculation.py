"""계산 블록 7: 용수량과 수도비 계산."""

from __future__ import annotations


DAYS_PER_AVERAGE_MONTH = 365.0 / 12.0


def calculate_water_cost(
    space_result: dict[str, float],
    humidity_result: dict[str, float | list[dict[str, float | str]]],
    standard: dict[str, float],
) -> dict[str, float]:
    """증발산량과 공실 전체면적 기준 기타 용수를 합산해 수도비를 계산한다."""
    evapotranspiration_l = float(
        humidity_result["monthly_evapotranspiration_kg"]
    )
    other_water_l = (
        space_result["total_area_m2"]
        * standard["other_water_l_m2_day"]
        * DAYS_PER_AVERAGE_MONTH
    )
    total_water_m3 = (evapotranspiration_l + other_water_l) / 1000.0
    monthly_water_cost = total_water_m3 * standard["water_rate_krw_m3"]

    return {
        "monthly_evapotranspiration_l": evapotranspiration_l,
        "monthly_other_water_l": other_water_l,
        "monthly_total_water_m3": total_water_m3,
        "monthly_water_cost_krw": monthly_water_cost,
    }
