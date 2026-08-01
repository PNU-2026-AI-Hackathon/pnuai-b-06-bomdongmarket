"""계산 블록 5: 습도 제어 전력량 계산."""

from __future__ import annotations

from math import exp


DAYS_PER_AVERAGE_MONTH = 365.0 / 12.0
HOURS_PER_AVERAGE_MONTH = 24.0 * DAYS_PER_AVERAGE_MONTH


def _saturation_vapor_pressure_pa(temperature_c: float) -> float:
    """마그누스 근사식으로 포화수증기압을 계산한다."""
    return 610.94 * exp(17.625 * temperature_c / (temperature_c + 243.04))


def _humidity_ratio(
    temperature_c: float,
    relative_humidity: float,
    atmospheric_pressure_pa: float,
    humidity_ratio_constant: float,
) -> tuple[float, float]:
    saturation_pressure = _saturation_vapor_pressure_pa(temperature_c)
    vapor_pressure = relative_humidity * saturation_pressure
    ratio = (
        humidity_ratio_constant
        * vapor_pressure
        / (atmospheric_pressure_pa - vapor_pressure)
    )
    return ratio, vapor_pressure


def calculate_humidity(
    space_result: dict[str, float],
    crop: dict[str, float | str],
    standard: dict[str, float],
    hvac_result: dict[str, float | list[dict[str, float | str]]],
) -> dict[str, float | list[dict[str, float | str]]]:
    """증발산, 환기, 냉방제습을 반영해 월별 가습·제습 전력을 계산한다."""
    target_temperature = float(crop["target_temperature_c"])
    target_relative_humidity = float(crop["target_relative_humidity"])
    daily_evapotranspiration = float(crop["daily_evapotranspiration_mm"])

    atmospheric_pressure = standard["atmospheric_pressure_pa"]
    dry_air_gas_constant = standard["dry_air_gas_constant_j_kg_k"]
    humidity_ratio_constant = standard["humidity_ratio_constant"]
    ach = standard["air_changes_per_hour"]
    shr = standard["sensible_heat_ratio"]
    latent_heat = standard["latent_heat_kwh_kg"]
    dehumidification_sec = standard["dehumidification_sec_kwh_kg"]
    humidification_sec = standard["humidification_sec_kwh_kg"]

    if not 0 <= target_relative_humidity <= 1:
        raise ValueError("목표 상대습도는 0과 1 사이여야 합니다.")

    target_humidity_ratio, _ = _humidity_ratio(
        target_temperature,
        target_relative_humidity,
        atmospheric_pressure,
        humidity_ratio_constant,
    )
    monthly_evapotranspiration_kg = (
        space_result["cultivation_area_m2"]
        * daily_evapotranspiration
        * DAYS_PER_AVERAGE_MONTH
    )

    monthly_results: list[dict[str, float | str]] = []
    hvac_monthly = hvac_result["monthly"]
    if not isinstance(hvac_monthly, list):
        raise TypeError("HVAC 월별 계산결과 형식이 올바르지 않습니다.")

    for hvac_month in hvac_monthly:
        outside_temperature = float(hvac_month["outdoor_temperature_c"])
        outside_relative_humidity = float(
            hvac_month["outdoor_relative_humidity"]
        )
        outside_humidity_ratio, outside_vapor_pressure = _humidity_ratio(
            outside_temperature,
            outside_relative_humidity,
            atmospheric_pressure,
            humidity_ratio_constant,
        )

        dry_air_density = (
            atmospheric_pressure - outside_vapor_pressure
        ) / (dry_air_gas_constant * (outside_temperature + 273.15))
        monthly_dry_air_mass = (
            space_result["volume_m3"]
            * ach
            * dry_air_density
            * HOURS_PER_AVERAGE_MONTH
        )
        ventilation_moisture_kg = monthly_dry_air_mass * (
            outside_humidity_ratio - target_humidity_ratio
        )
        base_net_moisture_kg = (
            monthly_evapotranspiration_kg + ventilation_moisture_kg
        )

        sensible_cooling_kwh = float(hvac_month["sensible_cooling_kwh"])
        latent_cooling_kwh = sensible_cooling_kwh * (1.0 - shr) / shr
        cooling_dehumidification_kg = latent_cooling_kwh / latent_heat
        remaining_moisture_kg = (
            base_net_moisture_kg - cooling_dehumidification_kg
        )

        dehumidification_energy_kwh = (
            max(0.0, remaining_moisture_kg) * dehumidification_sec
        )
        humidification_energy_kwh = (
            max(0.0, -remaining_moisture_kg) * humidification_sec
        )

        monthly_results.append(
            {
                "month": str(hvac_month["month"]),
                "target_humidity_ratio": target_humidity_ratio,
                "outside_humidity_ratio": outside_humidity_ratio,
                "monthly_dry_air_mass_kg": monthly_dry_air_mass,
                "ventilation_moisture_kg": ventilation_moisture_kg,
                "base_net_moisture_kg": base_net_moisture_kg,
                "cooling_dehumidification_kg": cooling_dehumidification_kg,
                "remaining_moisture_kg": remaining_moisture_kg,
                "dehumidification_energy_kwh": dehumidification_energy_kwh,
                "humidification_energy_kwh": humidification_energy_kwh,
            }
        )

    return {
        "monthly_evapotranspiration_kg": monthly_evapotranspiration_kg,
        "target_humidity_ratio": target_humidity_ratio,
        "monthly": monthly_results,
    }
