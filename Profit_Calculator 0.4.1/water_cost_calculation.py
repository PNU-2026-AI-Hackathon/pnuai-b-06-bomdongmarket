"""계산 블록 7: 배액을 포함한 용수량과 수도비 계산."""

from __future__ import annotations


DAYS_PER_AVERAGE_MONTH = 365.0 / 12.0


def calculate_water_cost(
    space_result: dict[str, float],
    humidity_result: dict[str, float | list[dict[str, float | str]]],
    standard: dict[str, float],
) -> dict[str, float]:
    """작물 관수량과 공실 전체면적 기준 기타 용수를 합산한다.

    배액률은 ``배액량 / 작물 관수량``으로 정의한다. 따라서 작물이
    실제로 소비한 증발산량을 ``1 - 배액률``로 나누어 배액을 포함한
    작물 관수량을 구한다.
    """
    crop_evapotranspiration_l = float(
        humidity_result["monthly_evapotranspiration_kg"]
    )
    drainage_ratio = float(standard["drainage_ratio"])
    if not 0.0 <= drainage_ratio < 1.0:
        raise ValueError("배액률은 0 이상 1 미만이어야 합니다.")

    crop_irrigation_l = crop_evapotranspiration_l / (1.0 - drainage_ratio)
    drainage_l = crop_irrigation_l - crop_evapotranspiration_l
    other_water_l = (
        space_result["total_area_m2"]
        * standard["other_water_l_m2_day"]
        * DAYS_PER_AVERAGE_MONTH
    )
    total_water_m3 = (crop_irrigation_l + other_water_l) / 1000.0
    water_rate = float(standard["water_rate_krw_m3"])
    monthly_water_cost = total_water_m3 * water_rate

    return {
        "drainage_ratio": drainage_ratio,
        "monthly_evapotranspiration_l": crop_evapotranspiration_l,
        "monthly_crop_irrigation_l": crop_irrigation_l,
        "monthly_drainage_l": drainage_l,
        "monthly_other_water_l": other_water_l,
        "monthly_total_water_m3": total_water_m3,
        "water_rate_krw_m3": water_rate,
        "monthly_water_cost_krw": monthly_water_cost,
    }
