"""계산 블록 3: 매출 계산."""

from __future__ import annotations


def calculate_sales(
    production_result: dict[str, float],
    sale_info: dict[str, float | str],
) -> dict[str, float]:
    """월 판매량과 kg당 판매가격으로 월 매출을 계산한다."""
    price = float(sale_info["price_krw_kg"])
    if price < 0:
        raise ValueError("판매가격은 음수가 될 수 없습니다.")

    monthly_revenue = production_result["monthly_sales_kg"] * price
    return {
        "price_krw_kg": price,
        "monthly_revenue_krw": monthly_revenue,
    }
