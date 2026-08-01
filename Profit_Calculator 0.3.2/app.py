"""Profit Calculator 0.3.2 Streamlit 대시보드."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from html import escape
from statistics import fmean
from typing import Any

import pandas as pd
import streamlit as st

from excel_output import OUTPUT_PATH, write_profit_output
from main import DATA_DIR, calculate_all_sites


st.set_page_config(
    page_title="Profit Calculator 0.3.2",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded",
)


CUSTOM_CSS = """
<style>
    :root {
        --navy: #071a2b;
        --navy-soft: #12334a;
        --emerald: #0f9f7b;
        --mint: #dff8ee;
        --cyan: #20b8cd;
        --amber: #f4b740;
        --rose: #e8586a;
        --slate: #526274;
        --line: #dce6ec;
        --canvas: #f3f7f9;
        --surface: rgba(255,255,255,.94);
    }

    .stApp {
        background:
            radial-gradient(circle at 0% 0%, rgba(15,159,123,.11), transparent 28rem),
            radial-gradient(circle at 100% 4%, rgba(32,184,205,.10), transparent 31rem),
            var(--canvas);
    }

    .block-container {
        max-width: 1580px;
        padding-top: 1.4rem;
        padding-bottom: 4rem;
    }

    section[data-testid="stSidebar"] {
        background: rgba(255,255,255,.94);
        border-right: 1px solid var(--line);
        box-shadow: 10px 0 34px rgba(7,26,43,.05);
    }

    .sidebar-brand {
        padding: 1.2rem 1.1rem;
        border-radius: 20px;
        color: white;
        background: linear-gradient(145deg, #071a2b 0%, #0f4c4a 70%, #0f9f7b 145%);
        box-shadow: 0 16px 34px rgba(7,26,43,.17);
        margin-bottom: 1.3rem;
    }

    .sidebar-brand small {
        color: #9debd3;
        font-weight: 800;
        letter-spacing: .13em;
        text-transform: uppercase;
    }

    .sidebar-brand h2 {
        color: white;
        font-size: 1.28rem;
        margin: .3rem 0 .35rem;
    }

    .sidebar-brand p {
        color: #d4f8ec;
        font-size: .82rem;
        line-height: 1.5;
        margin: 0;
    }

    .hero {
        position: relative;
        overflow: hidden;
        padding: 2.2rem 2.35rem;
        margin-bottom: 1.25rem;
        border-radius: 28px;
        color: white;
        background: linear-gradient(116deg, #071a2b 0%, #12334a 56%, #0a6e64 118%);
        box-shadow: 0 24px 62px rgba(7,26,43,.18);
    }

    .hero::after {
        content: "";
        position: absolute;
        right: -6rem;
        top: -9rem;
        width: 26rem;
        height: 26rem;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(72,224,180,.34), transparent 67%);
    }

    .hero-kicker {
        color: #75e8c6;
        font-size: .75rem;
        font-weight: 850;
        letter-spacing: .14em;
        text-transform: uppercase;
    }

    .hero h1 {
        color: white;
        font-size: clamp(2rem, 4vw, 3.15rem);
        line-height: 1.05;
        letter-spacing: -.045em;
        margin: .55rem 0 .8rem;
    }

    .hero p {
        color: #d5e6ec;
        max-width: 820px;
        line-height: 1.68;
        margin: 0;
    }

    .hero-badge {
        display: inline-flex;
        margin-top: 1.25rem;
        padding: .48rem .78rem;
        border: 1px solid rgba(255,255,255,.17);
        border-radius: 999px;
        background: rgba(255,255,255,.09);
        color: #effffa;
        font-size: .79rem;
        font-weight: 750;
    }

    .metric-card {
        min-height: 144px;
        padding: 1.15rem 1.2rem;
        border: 1px solid rgba(220,230,236,.95);
        border-top: 4px solid var(--accent);
        border-radius: 20px;
        background: var(--surface);
        box-shadow: 0 12px 30px rgba(7,26,43,.07);
    }

    .metric-label {
        color: var(--slate);
        font-size: .78rem;
        font-weight: 800;
    }

    .metric-value {
        color: var(--navy);
        font-size: clamp(1.25rem, 2.1vw, 1.85rem);
        font-weight: 880;
        letter-spacing: -.04em;
        margin: .55rem 0 .35rem;
        white-space: nowrap;
    }

    .metric-helper {
        color: #66788a;
        font-size: .75rem;
        line-height: 1.45;
    }

    .section-title {
        margin: .35rem 0 .25rem;
        color: var(--navy);
        font-size: 1.28rem;
        font-weight: 870;
        letter-spacing: -.025em;
    }

    .section-copy {
        margin: 0 0 1rem;
        color: #68798a;
        font-size: .88rem;
    }

    .recommend-card {
        min-height: 150px;
        padding: 1rem 1.1rem;
        border: 1px solid var(--line);
        border-left: 5px solid var(--accent);
        border-radius: 17px;
        background: var(--surface);
        box-shadow: 0 10px 24px rgba(7,26,43,.055);
    }

    .recommend-card h4 { color: var(--navy); margin: 0 0 .5rem; }
    .recommend-card p { color: var(--slate); margin: .2rem 0; font-size: .83rem; }
    .recommend-card strong { color: var(--navy); }

    div[data-testid="stDataFrame"] {
        border: 1px solid var(--line);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 26px rgba(7,26,43,.05);
    }

    div[data-testid="stTabs"] button { font-weight: 780; }
    div[data-testid="stExpander"] {
        border: 1px solid var(--line);
        border-radius: 15px;
        background: rgba(255,255,255,.82);
    }

    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
</style>
"""


def section(site: dict[str, object], name: str) -> dict[str, Any]:
    value = site[name]
    if not isinstance(value, dict):
        raise TypeError(f"사업장 결과의 {name} 영역이 dict가 아닙니다.")
    return value


def value(site: dict[str, object], group: str, key: str) -> float:
    return float(section(site, group)[key])


def scenario_label(site: dict[str, object]) -> str:
    meta = section(site, "space_row")
    return f"{meta['site_id']} · {meta['site_name']} · {meta['crop_name']}"


def rounded_currency(amount: float) -> int:
    rounded = Decimal(str(amount)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(rounded)


def rounded_kwh(amount: float) -> int:
    rounded = Decimal(str(amount)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(rounded)


def money(amount: float) -> str:
    return f"{rounded_currency(amount):,}원"


def kwh(amount: float) -> str:
    return f"{rounded_kwh(amount):,} kWh"


def metric_card(label: str, metric_value: str, helper: str, accent: str) -> None:
    st.markdown(
        f"""
        <div class="metric-card" style="--accent:{escape(accent)}">
            <div class="metric-label">{escape(label)}</div>
            <div class="metric-value">{escape(metric_value)}</div>
            <div class="metric-helper">{escape(helper)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def average_month(site: dict[str, object], group: str, key: str) -> float:
    monthly = section(site, group)["monthly"]
    if not isinstance(monthly, list):
        raise TypeError(f"{group}.monthly가 list가 아닙니다.")
    return fmean(float(row[key]) for row in monthly)


def summary_dataframe(sites: list[dict[str, object]]) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for site in sites:
        meta = section(site, "space_row")
        profit = section(site, "profit")
        rows.append(
            {
                "사업장": str(meta["site_name"]),
                "작물": str(meta["crop_name"]),
                "재배면적(m²)": value(site, "space", "cultivation_area_m2"),
                "월 판매량(kg)": value(site, "production", "monthly_sales_kg"),
                "월 매출(원)": value(site, "sales", "monthly_revenue_krw"),
                "월평균 전력(kWh)": value(site, "electricity", "average_monthly_energy_kwh"),
                "월 총 용수량(m³)": value(site, "water", "monthly_total_water_m3"),
                "월 수도비(원)": value(site, "water", "monthly_water_cost_krw"),
                "월 운영비(원)": value(site, "profit", "monthly_operating_cost_krw"),
                "월 영업이익(원)": value(site, "profit", "monthly_operating_profit_krw"),
                "공간 대여자 예상수익(원)": value(site, "profit", "landlord_expected_income_krw"),
                "원하는 월세(원)": value(site, "profit", "desired_monthly_rent_krw"),
                "월세 대비 차이(원)": value(site, "profit", "rent_income_difference_krw"),
                "사업장 영업이익(원)": value(site, "profit", "business_operating_profit_krw"),
                "추천": str(profit["recommendation"]),
                "계약형태": str(profit["contract_type"]),
            }
        )
    return pd.DataFrame(rows)


def energy_dataframe(site: dict[str, object]) -> pd.DataFrame:
    monthly = section(site, "electricity")["monthly"]
    if not isinstance(monthly, list):
        raise TypeError("electricity.monthly가 list가 아닙니다.")
    return pd.DataFrame(monthly).rename(
        columns={
            "month": "월",
            "lighting_energy_kwh": "조명",
            "heating_energy_kwh": "난방",
            "cooling_energy_kwh": "냉방",
            "dehumidification_energy_kwh": "제습",
            "humidification_energy_kwh": "가습",
            "total_environment_energy_kwh": "총합",
        }
    )


def water_dataframe(sites: list[dict[str, object]]) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for site in sites:
        meta = section(site, "space_row")
        rows.append(
            {
                "사업장": str(meta["site_name"]),
                "작물": str(meta["crop_name"]),
                "배액률": value(site, "water", "drainage_ratio"),
                "월 작물 순소비량(m³)": value(site, "water", "monthly_evapotranspiration_l") / 1000.0,
                "월 배액량(m³)": value(site, "water", "monthly_drainage_l") / 1000.0,
                "월 작물 관수량(m³)": value(site, "water", "monthly_crop_irrigation_l") / 1000.0,
                "월 기타 용수량(m³)": value(site, "water", "monthly_other_water_l") / 1000.0,
                "월 총 용수량(m³)": value(site, "water", "monthly_total_water_m3"),
                "월 수도비(원)": value(site, "water", "monthly_water_cost_krw"),
            }
        )
    return pd.DataFrame(rows)


def detail_dataframe(site: dict[str, object]) -> pd.DataFrame:
    profit = section(site, "profit")
    rows = [
        ("1. 공간", "공실 전체면적", value(site, "space", "total_area_m2"), "m²"),
        ("1. 공간", "사용가능 바닥면적", value(site, "space", "available_floor_area_m2"), "m²"),
        ("1. 공간", "재배면적", value(site, "space", "cultivation_area_m2"), "m²"),
        ("1. 공간", "공간 체적", value(site, "space", "volume_m3"), "m³"),
        ("2. 생산", "월 총생산량", value(site, "production", "monthly_total_production_kg"), "kg"),
        ("2. 생산", "월 판매량", value(site, "production", "monthly_sales_kg"), "kg"),
        ("3. 매출", "판매가격", value(site, "sales", "price_krw_kg"), "원/kg"),
        ("3. 매출", "월 매출", value(site, "sales", "monthly_revenue_krw"), "원"),
        ("4. 조명·냉난방", "필요 조명전력", value(site, "hvac", "lighting_power_w"), "W"),
        ("4. 조명·냉난방", "월 조명전력량", value(site, "hvac", "lighting_energy_kwh_month"), "kWh"),
        ("4. 조명·냉난방", "월평균 난방전력량", average_month(site, "hvac", "heating_energy_kwh"), "kWh"),
        ("4. 조명·냉난방", "월평균 냉방전력량", average_month(site, "hvac", "cooling_energy_kwh"), "kWh"),
        ("5. 습도", "월 증발산량", value(site, "humidity", "monthly_evapotranspiration_kg"), "kg"),
        ("5. 습도", "월평균 제습전력량", average_month(site, "humidity", "dehumidification_energy_kwh"), "kWh"),
        ("5. 습도", "월평균 가습전력량", average_month(site, "humidity", "humidification_energy_kwh"), "kWh"),
        ("6. 전기비", "월평균 총 전력량", value(site, "electricity", "average_monthly_energy_kwh"), "kWh"),
        ("6. 전기비", "월 전기비", value(site, "electricity", "monthly_electricity_cost_krw"), "원"),
        ("7. 수도비", "배액률", value(site, "water", "drainage_ratio"), "%"),
        ("7. 수도비", "월 작물 순소비량", value(site, "water", "monthly_evapotranspiration_l") / 1000.0, "m³"),
        ("7. 수도비", "월 배액량", value(site, "water", "monthly_drainage_l") / 1000.0, "m³"),
        ("7. 수도비", "월 작물 관수량", value(site, "water", "monthly_crop_irrigation_l") / 1000.0, "m³"),
        ("7. 수도비", "월 기타 용수량", value(site, "water", "monthly_other_water_l") / 1000.0, "m³"),
        ("7. 수도비", "월 총 용수량", value(site, "water", "monthly_total_water_m3"), "m³"),
        ("7. 수도비", "월 수도비", value(site, "water", "monthly_water_cost_krw"), "원"),
        ("8. 재료비", "월 재료비", value(site, "material", "monthly_material_cost_krw"), "원"),
        ("9. 인건비", "월 노동시간", value(site, "labor", "monthly_labor_hours"), "시간"),
        ("9. 인건비", "월 인건비", value(site, "labor", "monthly_labor_cost_krw"), "원"),
        ("10. 수익", "월 운영비", value(site, "profit", "monthly_operating_cost_krw"), "원"),
        ("10. 수익", "월 영업이익", value(site, "profit", "monthly_operating_profit_krw"), "원"),
        ("10. 수익", "공간 대여자 예상수익", value(site, "profit", "landlord_expected_income_krw"), "원"),
        ("10. 수익", "원하는 월세", value(site, "profit", "desired_monthly_rent_krw"), "원"),
        ("10. 수익", "월세 대비 차이", value(site, "profit", "rent_income_difference_krw"), "원"),
        ("10. 수익", "사업장 영업이익", value(site, "profit", "business_operating_profit_krw"), "원"),
        ("10. 수익", "추천 결과", 0.0, f"{profit['recommendation']} ({profit['contract_type']})"),
    ]
    return pd.DataFrame(rows, columns=["계산 블록", "항목", "값", "단위"])


def format_detail(row: pd.Series) -> str:
    unit = str(row["단위"])
    amount = float(row["값"])
    if unit == "원":
        return money(amount)
    if unit == "원/kg":
        return f"{rounded_currency(amount):,}원/kg"
    if unit == "kWh":
        return kwh(amount)
    if unit == "%":
        return f"{amount:.0%}"
    if unit == "m³":
        return f"{amount:,.3f} m³"
    if unit.startswith("추천") or "계약형" in unit:
        return unit
    return f"{amount:,.2f} {unit}"


st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

try:
    all_scenarios = calculate_all_sites()
    try:
        excel_path = write_profit_output(all_scenarios)
    except PermissionError:
        # 사용자가 결과 파일을 Excel에서 열어 둔 경우에도 대시보드는
        # 기존 파일을 사용해 계속 동작하도록 한다.
        excel_path = OUTPUT_PATH
        st.warning(
            "Profit_Output.xlsx가 열려 있어 새로 저장하지 못했습니다. "
            "Excel 파일을 닫고 화면을 새로고침하면 최신 결과로 갱신됩니다."
        )
except Exception as error:
    st.error("CSV 입력, 계산 또는 Excel 저장 과정에서 오류가 발생했습니다.")
    st.exception(error)
    st.stop()

space_names = list(dict.fromkeys(str(section(site, "space_row")["site_name"]) for site in all_scenarios))
crop_names = list(dict.fromkeys(str(section(site, "space_row")["crop_name"]) for site in all_scenarios))

with st.sidebar:
    st.markdown(
        """
        <div class="sidebar-brand">
            <small>Urban Farm Analytics</small>
            <h2>Profit Calculator 0.3.2</h2>
            <p>공간별로 세 작물을 교차 적용하고 장기·단기 계약형태를 추천합니다.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.markdown("### 비교 필터")
    selected_spaces = st.multiselect("공간", space_names, default=space_names)
    selected_crops = st.multiselect("작물", crop_names, default=crop_names)
    st.markdown("---")
    st.markdown("### 추천 기준")
    st.caption("적자 발생 → 단기계약형")
    st.caption("예상수익 ≥ 원하는 월세 → 장기계약형")
    st.caption("예상수익 < 원하는 월세 → 단기계약형")
    st.markdown("---")
    st.caption("CSV 수정 후 브라우저를 새로고침하면 Excel 결과도 갱신됩니다.")

selected_scenarios = [
    site
    for site in all_scenarios
    if str(section(site, "space_row")["site_name"]) in selected_spaces
    and str(section(site, "space_row")["crop_name"]) in selected_crops
]

if not selected_scenarios:
    st.warning("왼쪽에서 한 개 이상의 공간과 작물을 선택해 주세요.")
    st.stop()

label_to_site = {scenario_label(site): site for site in selected_scenarios}
scenario_labels = list(label_to_site)
summary = summary_dataframe(selected_scenarios)
long_term_count = int((summary["계약형태"] == "장기계약형").sum())
best_landlord = float(summary["공간 대여자 예상수익(원)"].max())
best_business = float(summary["사업장 영업이익(원)"].max())
best_row = summary.loc[summary["공간 대여자 예상수익(원)"].idxmax()]

st.markdown(
    f"""
    <div class="hero">
        <div class="hero-kicker">Profit Calculator · Version 0.3.2</div>
        <h1>공간 × 작물 수익성 매트릭스</h1>
        <p>각 공간에 상추·딸기·바질을 각각 적용하여 생산, 에너지, 운영비와 공간 대여자 예상수익을 같은 기준으로 비교합니다.</p>
        <div class="hero-badge">● {len(selected_scenarios)}개 시나리오 분석 중 · 12개월 환경조건 반영</div>
    </div>
    """,
    unsafe_allow_html=True,
)

kpis = st.columns(4)
with kpis[0]:
    metric_card("분석 시나리오", f"{len(selected_scenarios)}개", "선택한 공간×작물 조합", "#20b8cd")
with kpis[1]:
    metric_card("장기계약 추천", f"{long_term_count}개", "나머지는 단기계약 추천", "#0f9f7b")
with kpis[2]:
    metric_card("최대 대여자 예상수익", money(best_landlord), f"{best_row['사업장']} · {best_row['작물']}", "#f4b740")
with kpis[3]:
    metric_card("최대 사업장 영업이익", money(best_business), "선택 시나리오 중 최댓값", "#e8586a" if best_business < 0 else "#0f9f7b")

st.write("")
tabs = st.tabs(["3×3 비교", "계약 추천", "월별 에너지", "용수·수도비", "계산 상세", "입력 데이터"])

with tabs[0]:
    st.markdown('<div class="section-title">공간×작물 전체 비교</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">각 행은 독립적인 대안입니다. 같은 공간의 세 작물을 동시에 운영한 합계가 아닙니다.</div>', unsafe_allow_html=True)

    display_summary = summary.copy()
    currency_columns = [column for column in display_summary.columns if "(원)" in column]
    for column in currency_columns:
        display_summary[column] = display_summary[column].map(rounded_currency)
    display_summary["월평균 전력(kWh)"] = display_summary["월평균 전력(kWh)"].map(rounded_kwh)
    st.dataframe(
        display_summary.style.format(
            {
                "재배면적(m²)": "{:,.1f}",
                "월 판매량(kg)": "{:,.1f}",
                "월평균 전력(kWh)": "{:,.0f}",
                "월 총 용수량(m³)": "{:,.3f}",
                **{column: "{:,.0f}원" for column in currency_columns},
            }
        ),
        width="stretch",
        hide_index=True,
        height=430,
    )

    left, right = st.columns(2)
    with left:
        st.markdown("#### 공간 대여자 예상수익")
        landlord_matrix = summary.pivot(index="사업장", columns="작물", values="공간 대여자 예상수익(원)")
        st.bar_chart(landlord_matrix.round(0), width="stretch")
    with right:
        st.markdown("#### 사업장 영업이익")
        business_matrix = summary.pivot(index="사업장", columns="작물", values="사업장 영업이익(원)")
        st.bar_chart(business_matrix.round(0), width="stretch")

    st.download_button(
        "Profit_Output.xlsx 다운로드",
        data=excel_path.read_bytes(),
        file_name="Profit_Output.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        width="stretch",
    )
    st.caption(f"자동 저장 경로: {excel_path}")

with tabs[1]:
    st.markdown('<div class="section-title">장기·단기 계약형태 추천</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">월 영업이익이 적자이면 단기를 추천하고, 흑자일 때 공간 대여자 예상수익과 원하는 월세를 비교합니다.</div>', unsafe_allow_html=True)

    matrix = summary.pivot(index="사업장", columns="작물", values="계약형태")
    st.dataframe(matrix, width="stretch")

    for space_name in selected_spaces:
        candidates = summary[summary["사업장"] == space_name]
        if candidates.empty:
            continue
        columns = st.columns(len(candidates))
        for column, (_, row) in zip(columns, candidates.iterrows(), strict=True):
            accent = "#0f9f7b" if row["계약형태"] == "장기계약형" else "#f4b740"
            with column:
                st.markdown(
                    f"""
                    <div class="recommend-card" style="--accent:{accent}">
                        <h4>{escape(str(space_name))} · {escape(str(row['작물']))}</h4>
                        <p><strong>{escape(str(row['계약형태']))}</strong> · {escape(str(row['추천']))}</p>
                        <p>예상수익 {escape(money(float(row['공간 대여자 예상수익(원)'])))}</p>
                        <p>원하는 월세 {escape(money(float(row['원하는 월세(원)'])))}</p>
                        <p>차이 {escape(money(float(row['월세 대비 차이(원)'])))}</p>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
        st.write("")

    with st.expander("단기계약형 예상 영업구조", expanded=False):
        st.markdown(
            """
            - 예상 매출 = 원하는 월세 + 장비 대여비 + 기타 중개비 + AS 비용 + 판매중개비(필요 시)
            - 예상 비용 = 공간 대여자 월세 지급 + 장비 유지보수비 등

            현재 0.3.2는 단기계약형의 구체적인 추가 매출·비용을 계산하지 않고 추천 결과까지만 제공합니다.
            """
        )

with tabs[2]:
    st.markdown('<div class="section-title">12개월 환경제어 에너지</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">선택한 공간×작물 조합의 조명·난방·냉방·제습·가습 사용량을 확인합니다.</div>', unsafe_allow_html=True)
    energy_label = st.selectbox("상세 시나리오", scenario_labels, key="energy_scenario")
    energy_site = label_to_site[energy_label]
    energy = energy_dataframe(energy_site)
    energy_columns = ["조명", "난방", "냉방", "제습", "가습", "총합"]
    for column in energy_columns:
        energy[column] = energy[column].map(rounded_kwh)

    energy_kpis = st.columns(4)
    with energy_kpis[0]:
        metric_card("조명", kwh(float(energy["조명"].mean())), "월 고정 조명 사용량", "#f4b740")
    with energy_kpis[1]:
        metric_card("난방 평균", kwh(float(energy["난방"].mean())), "12개월 산술평균", "#e8586a")
    with energy_kpis[2]:
        metric_card("냉방 평균", kwh(float(energy["냉방"].mean())), "12개월 산술평균", "#20b8cd")
    with energy_kpis[3]:
        metric_card("제습·가습 평균", kwh(float((energy["제습"] + energy["가습"]).mean())), "습도 제어 전력", "#7c6ee6")

    st.line_chart(energy.set_index("월")[energy_columns], width="stretch")
    hvac_monthly = section(energy_site, "hvac")["monthly"]
    if not isinstance(hvac_monthly, list):
        raise TypeError("hvac.monthly가 list가 아닙니다.")
    environment = pd.DataFrame(hvac_monthly)[["month", "outdoor_temperature_c", "outdoor_relative_humidity"]].rename(
        columns={"month": "월", "outdoor_temperature_c": "외기온도(°C)", "outdoor_relative_humidity": "외기 상대습도"}
    )
    energy_table = environment.merge(energy, on="월")
    st.dataframe(energy_table, width="stretch", hide_index=True)

with tabs[3]:
    st.markdown('<div class="section-title">배액을 포함한 용수·수도비</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">작물 증발산량을 순소비량으로 보고, 공통 배액률 30%와 공실 전체면적 기준 기타 용수를 반영합니다.</div>', unsafe_allow_html=True)
    water_label = st.selectbox("용수 상세 시나리오", scenario_labels, key="water_scenario")
    water_site = label_to_site[water_label]

    water_kpis = st.columns(4)
    with water_kpis[0]:
        metric_card("배액률", f"{value(water_site, 'water', 'drainage_ratio'):.0%}", "모든 작물 공통 적용", "#7c6ee6")
    with water_kpis[1]:
        metric_card("월 배액량", f"{value(water_site, 'water', 'monthly_drainage_l') / 1000.0:,.3f} m³", "작물 관수량 중 배수분", "#20b8cd")
    with water_kpis[2]:
        metric_card("월 총 용수량", f"{value(water_site, 'water', 'monthly_total_water_m3'):,.3f} m³", "작물 관수량 + 기타 용수", "#0f9f7b")
    with water_kpis[3]:
        metric_card("월 수도비", money(value(water_site, 'water', 'monthly_water_cost_krw')), "수도 종합단가 2,300원/m³", "#f4b740")

    water_summary = water_dataframe(selected_scenarios)
    water_display = water_summary.copy()
    water_display["월 수도비(원)"] = water_display["월 수도비(원)"].map(rounded_currency)
    st.dataframe(
        water_display.style.format(
            {
                "배액률": "{:.0%}",
                "월 작물 순소비량(m³)": "{:,.3f}",
                "월 배액량(m³)": "{:,.3f}",
                "월 작물 관수량(m³)": "{:,.3f}",
                "월 기타 용수량(m³)": "{:,.3f}",
                "월 총 용수량(m³)": "{:,.3f}",
                "월 수도비(원)": "{:,.0f}원",
            }
        ),
        width="stretch",
        hide_index=True,
    )
    st.markdown("#### 시나리오별 월 수도비")
    water_cost_matrix = water_summary.pivot(index="사업장", columns="작물", values="월 수도비(원)")
    st.bar_chart(water_cost_matrix.round(0), width="stretch")

with tabs[4]:
    st.markdown('<div class="section-title">계산 블록 상세</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">다이어그램의 1~10번 계산에서 나온 주요 중간값을 확인합니다.</div>', unsafe_allow_html=True)
    detail_label = st.selectbox("상세 시나리오", scenario_labels, key="detail_scenario")
    detail = detail_dataframe(label_to_site[detail_label])
    for block in detail["계산 블록"].drop_duplicates():
        block_rows = detail[detail["계산 블록"] == block].copy()
        block_rows["결과"] = block_rows.apply(format_detail, axis=1)
        with st.expander(str(block), expanded=block in {"1. 공간", "10. 수익"}):
            st.dataframe(block_rows[["항목", "결과"]], width="stretch", hide_index=True)

with tabs[5]:
    st.markdown('<div class="section-title">CSV 원본 데이터</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">현재 계산에 사용된 입력파일을 읽기 전용으로 확인합니다.</div>', unsafe_allow_html=True)
    csv_files = sorted(DATA_DIR.glob("*.csv"))
    selected_csv_name = st.selectbox("데이터 파일", [path.name for path in csv_files])
    selected_csv = DATA_DIR / selected_csv_name
    source_frame = pd.read_csv(selected_csv, encoding="utf-8-sig")
    st.dataframe(source_frame, width="stretch", hide_index=True)
    st.caption(f"경로: {selected_csv}")
