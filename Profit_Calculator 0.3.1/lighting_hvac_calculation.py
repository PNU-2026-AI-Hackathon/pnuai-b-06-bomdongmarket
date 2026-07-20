"""계산 블록 4: 조명과 냉난방 전력량 계산."""

from __future__ import annotations


DAYS_PER_AVERAGE_MONTH = 365.0 / 12.0


def calculate_lighting_hvac(
    space_result: dict[str, float],
    crop: dict[str, float | str],
    electric_standard: dict[str, float],
    standard: dict[str, float],
    monthly_environment: list[dict[str, float | str]],
) -> dict[str, float | list[dict[str, float | str]]]:
    """월별 외기조건을 반영해 조명, 난방, 냉방 전력량을 계산한다."""
    cultivation_area = space_result["cultivation_area_m2"]
    required_light = float(crop["required_ppfd_umol_m2_s"])
    lighting_hours_day = float(crop["lighting_hours_day"])
    target_temperature = float(crop["target_temperature_c"])

    led_efficiency = electric_standard["led_photon_efficiency_umol_j"]
    heat_conversion_rate = electric_standard["heat_conversion_rate"]
    wall_u_value = electric_standard["wall_u_value_w_m2_k"]
    air_density = standard["air_density_kg_m3"]
    air_specific_heat = standard["air_specific_heat_j_kg_k"]
    ach = standard["air_changes_per_hour"]
    cop = standard["hvac_cop"]
    shr = standard["sensible_heat_ratio"]

    if not 0 <= lighting_hours_day <= 24:
        raise ValueError("하루 조명 점등시간은 0~24시간이어야 합니다.")
    if led_efficiency <= 0 or cop <= 0 or not 0 < shr <= 1:
        raise ValueError("LED 효율, COP, SHR 입력값을 확인해 주세요.")

    lighting_power_w = cultivation_area * required_light / led_efficiency
    lighting_on_hours = lighting_hours_day * DAYS_PER_AVERAGE_MONTH
    lighting_off_hours = (24.0 - lighting_hours_day) * DAYS_PER_AVERAGE_MONTH
    lighting_energy_kwh = lighting_power_w * lighting_on_hours / 1000.0
    lighting_heat_w = lighting_power_w * heat_conversion_rate

    monthly_results: list[dict[str, float | str]] = []
    for environment in monthly_environment:
        outside_temperature = float(environment["outdoor_temperature_c"])
        delta_temperature = target_temperature - outside_temperature

        # 외부에 노출된 벽면은 두 개라고 가정한다.
        wall_load_w = (
            delta_temperature
            * space_result["wall_area_one_side_m2"]
            * wall_u_value
            * 2.0
        )
        ventilation_load_w = (
            delta_temperature
            * space_result["volume_m3"]
            * air_density
            * air_specific_heat
            * ach
            / 3600.0
        )
        maintain_load_w = wall_load_w + ventilation_load_w

        heat_on_w = max(maintain_load_w - lighting_heat_w, 0.0)
        cool_on_w = max(lighting_heat_w - maintain_load_w, 0.0)
        heat_off_w = max(maintain_load_w, 0.0)
        cool_off_w = max(-maintain_load_w, 0.0)

        heating_energy_kwh = (
            heat_on_w * lighting_on_hours + heat_off_w * lighting_off_hours
        ) / (cop * 1000.0)
        cooling_energy_kwh = (
            cool_on_w * lighting_on_hours + cool_off_w * lighting_off_hours
        ) / (shr * cop * 1000.0)
        sensible_cooling_kwh = cooling_energy_kwh * shr * cop

        monthly_results.append(
            {
                "month": str(environment["month"]),
                "outdoor_temperature_c": outside_temperature,
                "outdoor_relative_humidity": float(
                    environment["outdoor_relative_humidity"]
                ),
                "wall_load_w": wall_load_w,
                "ventilation_load_w": ventilation_load_w,
                "maintain_load_w": maintain_load_w,
                "heating_energy_kwh": heating_energy_kwh,
                "cooling_energy_kwh": cooling_energy_kwh,
                "sensible_cooling_kwh": sensible_cooling_kwh,
            }
        )

    return {
        "lighting_power_w": lighting_power_w,
        "lighting_heat_w": lighting_heat_w,
        "lighting_on_hours_month": lighting_on_hours,
        "lighting_off_hours_month": lighting_off_hours,
        "lighting_energy_kwh_month": lighting_energy_kwh,
        "monthly": monthly_results,
    }
