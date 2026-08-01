"""계산 블록 6: 환경제어 전력량과 전기비 계산."""

from __future__ import annotations

from statistics import fmean


def calculate_electricity_cost(
    hvac_result: dict[str, float | list[dict[str, float | str]]],
    humidity_result: dict[str, float | list[dict[str, float | str]]],
    standard: dict[str, float],
) -> dict[str, float | list[dict[str, float | str]]]:
    """조명·냉난방·가습·제습 전력을 합산하고 월 산술평균으로 비용을 구한다."""
    hvac_monthly = hvac_result["monthly"]
    humidity_monthly = humidity_result["monthly"]
    if not isinstance(hvac_monthly, list) or not isinstance(humidity_monthly, list):
        raise TypeError("월별 전력량 계산결과 형식이 올바르지 않습니다.")
    if len(hvac_monthly) != len(humidity_monthly):
        raise ValueError("HVAC와 습도제어의 월별 결과 개수가 다릅니다.")

    lighting_energy = float(hvac_result["lighting_energy_kwh_month"])
    monthly_results: list[dict[str, float | str]] = []

    for hvac_month, humidity_month in zip(
        hvac_monthly, humidity_monthly, strict=True
    ):
        if hvac_month["month"] != humidity_month["month"]:
            raise ValueError("HVAC와 습도제어의 월 순서가 일치하지 않습니다.")

        heating = float(hvac_month["heating_energy_kwh"])
        cooling = float(hvac_month["cooling_energy_kwh"])
        dehumidification = float(
            humidity_month["dehumidification_energy_kwh"]
        )
        humidification = float(humidity_month["humidification_energy_kwh"])

        # 다이어그램에서 누락된 조명 전력량을 사용자 확인에 따라 포함한다.
        total = (
            lighting_energy
            + heating
            + cooling
            + dehumidification
            + humidification
        )
        monthly_results.append(
            {
                "month": str(hvac_month["month"]),
                "lighting_energy_kwh": lighting_energy,
                "heating_energy_kwh": heating,
                "cooling_energy_kwh": cooling,
                "dehumidification_energy_kwh": dehumidification,
                "humidification_energy_kwh": humidification,
                "total_environment_energy_kwh": total,
            }
        )

    average_monthly_energy = fmean(
        float(month["total_environment_energy_kwh"])
        for month in monthly_results
    )
    electricity_rate = standard["electricity_rate_krw_kwh"]
    monthly_electricity_cost = average_monthly_energy * electricity_rate

    return {
        "average_monthly_energy_kwh": average_monthly_energy,
        "electricity_rate_krw_kwh": electricity_rate,
        "monthly_electricity_cost_krw": monthly_electricity_cost,
        "monthly": monthly_results,
    }
