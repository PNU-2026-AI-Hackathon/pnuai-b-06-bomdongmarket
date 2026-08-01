"""Profit Calculator 0.4.1 계산 실행 및 콘솔 진입점."""

from __future__ import annotations

import csv
from pathlib import Path

from console_output import print_site_result, print_total_result
from electricity_cost_calculation import calculate_electricity_cost
from excel_output import write_profit_output
from humidity_calculation import calculate_humidity
from labor_cost_calculation import calculate_labor_cost
from lighting_hvac_calculation import calculate_lighting_hvac
from material_cost_calculation import calculate_material_cost
from production_calculation import calculate_production
from profit_calculation import calculate_profit
from sales_calculation import calculate_sales
from space_calculation import calculate_space
from water_cost_calculation import calculate_water_cost


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


def read_csv_rows(filename: str) -> list[dict[str, str]]:
    path = DATA_DIR / filename
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames:
            raise ValueError(f"CSV 헤더가 없습니다: {path}")
        return list(reader)


def read_key_value_csv(filename: str) -> dict[str, float]:
    rows = read_csv_rows(filename)
    result: dict[str, float] = {}
    for row in rows:
        key = row["key"].strip()
        if key in result:
            raise ValueError(f"중복된 설정 키입니다: {filename} / {key}")
        result[key] = float(row["value"])
    return result


def index_rows(
    rows: list[dict[str, str]], key_name: str
) -> dict[str, dict[str, str]]:
    indexed: dict[str, dict[str, str]] = {}
    for row in rows:
        key = row[key_name].strip()
        if key in indexed:
            raise ValueError(f"중복된 데이터 키입니다: {key_name}={key}")
        indexed[key] = row
    return indexed


def calculate_all_sites() -> list[dict[str, object]]:
    """CSV를 읽어 모든 공간과 작물 조합의 1~10번 결과를 반환한다."""
    spaces = read_csv_rows("space_info.csv")
    crops = index_rows(read_csv_rows("crop_production_info.csv"), "crop_name")
    sales_info = index_rows(read_csv_rows("crop_sale_info.csv"), "crop_name")
    electric_standard = read_key_value_csv("electric_standard_info.csv")
    standard = read_key_value_csv("standard_info.csv")
    contract = read_key_value_csv("contraction_info.csv")
    monthly_environment = read_csv_rows("monthly_environment.csv")

    if len(monthly_environment) != 12:
        raise ValueError("monthly_environment.csv에는 12개월 데이터가 필요합니다.")

    missing_sale_crops = set(crops) - set(sales_info)
    if missing_sale_crops:
        names = ", ".join(sorted(missing_sale_crops))
        raise KeyError(f"판매가격 정보가 없는 작물입니다: {names}")

    site_results: list[dict[str, object]] = []
    for space_input in spaces:
        space_result = calculate_space(space_input)
        desired_monthly_rent = float(
            space_input["desired_monthly_rent_krw"]
        )

        for crop_name, crop in crops.items():
            scenario_row = dict(space_input)
            scenario_row["crop_name"] = crop_name

            production_result = calculate_production(space_result, crop)
            sales_result = calculate_sales(
                production_result, sales_info[crop_name]
            )
            hvac_result = calculate_lighting_hvac(
                space_result,
                crop,
                electric_standard,
                standard,
                monthly_environment,
            )
            humidity_result = calculate_humidity(
                space_result, crop, standard, hvac_result
            )
            electricity_result = calculate_electricity_cost(
                hvac_result, humidity_result, standard
            )
            water_result = calculate_water_cost(
                space_result, humidity_result, standard
            )
            material_result = calculate_material_cost(space_result, crop)
            labor_result = calculate_labor_cost(
                production_result, crop, standard
            )
            profit_result = calculate_profit(
                monthly_revenue_krw=sales_result["monthly_revenue_krw"],
                monthly_electricity_cost_krw=float(
                    electricity_result["monthly_electricity_cost_krw"]
                ),
                monthly_water_cost_krw=water_result[
                    "monthly_water_cost_krw"
                ],
                monthly_material_cost_krw=material_result[
                    "monthly_material_cost_krw"
                ],
                monthly_labor_cost_krw=labor_result[
                    "monthly_labor_cost_krw"
                ],
                desired_monthly_rent_krw=desired_monthly_rent,
                standard=standard,
                contract=contract,
            )

            site_results.append(
                {
                    "scenario_id": f"{space_input['site_id']}-{crop_name}",
                    "space_row": scenario_row,
                    "space": space_result,
                    "production": production_result,
                    "sales": sales_result,
                    "hvac": hvac_result,
                    "humidity": humidity_result,
                    "electricity": electricity_result,
                    "water": water_result,
                    "material": material_result,
                    "labor": labor_result,
                    "profit": profit_result,
                }
            )

    return site_results


def main() -> None:
    """기존 콘솔 출력 방식으로 전체 계산 결과를 표시한다."""
    site_results = calculate_all_sites()
    output_path = write_profit_output(site_results)
    for site_result in site_results:
        print_site_result(site_result)
    print_total_result(site_results)
    print(f"\nExcel 저장 완료: {output_path}")


if __name__ == "__main__":
    main()
