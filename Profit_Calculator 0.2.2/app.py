"""Profit Calculator 0.2.2 Streamlit 대시보드."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from html import escape
from statistics import fmean
from typing import cast

import pandas as pd
import streamlit as st

from main import DATA_DIR, calculate_all_sites


st.set_page_config(
    page_title="Profit Calculator 0.2.2",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded",
)


CUSTOM_CSS = """
<style>
    :root {
        --navy: #0f172a;
        --slate: #475569;
        --muted: #64748b;
        --line: #e2e8f0;
        --surface: #ffffff;
        --canvas: #f4f7fb;
        --emerald: #10b981;
        --cyan: #06b6d4;
        --indigo: #6366f1;
        --rose: #f43f5e;
    }

    .stApp {
        background:
            radial-gradient(circle at 8% 0%, rgba(16,185,129,.08), transparent 26rem),
            radial-gradient(circle at 92% 8%, rgba(99,102,241,.08), transparent 30rem),
            var(--canvas);
    }

    .block-container {
        max-width: 1500px;
        padding-top: 1.6rem;
        padding-bottom: 4rem;
    }

    section[data-testid="stSidebar"] {
        background: rgba(255,255,255,.92);
        border-right: 1px solid var(--line);
        box-shadow: 8px 0 30px rgba(15,23,42,.04);
    }

    .sidebar-brand {
        padding: 1.1rem 1rem 1rem;
        border-radius: 18px;
        color: white;
        background: linear-gradient(135deg, #0f172a 0%, #134e4a 58%, #10b981 140%);
        box-shadow: 0 14px 30px rgba(15,23,42,.16);
        margin-bottom: 1.4rem;
    }

    .sidebar-brand .eyebrow {
        color: #a7f3d0;
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: .12em;
        text-transform: uppercase;
    }

    .sidebar-brand h2 {
        color: white;
        font-size: 1.25rem;
        margin: .25rem 0 .35rem;
    }

    .sidebar-brand p {
        color: #d1fae5;
        font-size: .82rem;
        margin: 0;
    }

    .hero {
        position: relative;
        overflow: hidden;
        padding: 2rem 2.2rem;
        margin-bottom: 1.25rem;
        border-radius: 26px;
        color: white;
        background: linear-gradient(120deg, #0f172a 0%, #172554 54%, #115e59 118%);
        box-shadow: 0 24px 60px rgba(15,23,42,.16);
    }

    .hero::after {
        content: "";
        position: absolute;
        right: -7rem;
        top: -9rem;
        width: 24rem;
        height: 24rem;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(52,211,153,.30), transparent 66%);
    }

    .hero-kicker {
        color: #6ee7b7;
        font-size: .75rem;
        font-weight: 800;
        letter-spacing: .14em;
        text-transform: uppercase;
    }

    .hero h1 {
        color: white;
        font-size: clamp(2rem, 4vw, 3.25rem);
        line-height: 1.05;
        letter-spacing: -.04em;
        margin: .55rem 0 .8rem;
    }

    .hero p {
        color: #cbd5e1;
        max-width: 760px;
        font-size: 1rem;
        line-height: 1.65;
        margin: 0;
    }

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        margin-top: 1.25rem;
        padding: .45rem .75rem;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 999px;
        color: #ecfdf5;
        background: rgba(255,255,255,.08);
        font-size: .78rem;
        font-weight: 700;
        backdrop-filter: blur(10px);
    }

    .metric-card {
        min-height: 142px;
        padding: 1.15rem 1.2rem;
        border: 1px solid rgba(226,232,240,.9);
        border-top: 4px solid var(--accent);
        border-radius: 20px;
        background: rgba(255,255,255,.94);
        box-shadow: 0 12px 32px rgba(15,23,42,.07);
        transition: transform .18s ease, box-shadow .18s ease;
    }

    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 42px rgba(15,23,42,.11);
    }

    .metric-label {
        color: var(--muted);
        font-size: .78rem;
        font-weight: 750;
        letter-spacing: .02em;
    }

    .metric-value {
        color: var(--navy);
        font-size: clamp(1.3rem, 2.2vw, 1.9rem);
        font-weight: 850;
        letter-spacing: -.04em;
        margin: .55rem 0 .35rem;
        white-space: nowrap;
    }

    .metric-helper {
        color: var(--slate);
        font-size: .76rem;
        line-height: 1.45;
    }

    .section-title {
        margin: .4rem 0 .2rem;
        color: var(--navy);
        font-size: 1.25rem;
        font-weight: 850;
        letter-spacing: -.025em;
    }

    .section-copy {
        margin: 0 0 1rem;
        color: var(--muted);
        font-size: .88rem;
    }

    .site-strip {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.15rem;
        margin: .4rem 0 .85rem;
        border: 1px solid var(--line);
        border-radius: 17px;
        background: rgba(255,255,255,.86);
    }

    .site-strip strong { color: var(--navy); }
    .site-strip span { color: var(--muted); font-size: .82rem; }

    div[data-testid="stDataFrame"] {
        border: 1px solid var(--line);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 28px rgba(15,23,42,.05);
    }

    div[data-testid="stTabs"] button {
        font-weight: 750;
    }

    div[data-testid="stExpander"] {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: rgba(255,255,255,.80);
    }

    .status-positive { color: #059669; font-weight: 800; }
    .status-negative { color: #e11d48; font-weight: 800; }

    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
</style>
"""


def section(site: dict[str, object], name: str) -> dict[str, object]:
    value = site[name]
    if not isinstance(value, dict):
        raise TypeError(f"사업장 결과의 {name} 영역이 dict가 아닙니다.")
    return cast(dict[str, object], value)


def site_name(site: dict[str, object]) -> str:
    row = section(site, "space_row")
    return f"{row['site_id']} · {row['site_name']} · {row['crop_name']}"


def value(site: dict[str, object], group: str, key: str) -> float:
    return float(section(site, group)[key])


def total(sites: list[dict[str, object]], group: str, key: str) -> float:
    return sum(value(site, group, key) for site in sites)


def money(amount: float) -> str:
    return f"{rounded_currency(amount):,}원"


def rounded_currency(amount: float) -> int:
    rounded = Decimal(str(amount)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(rounded)


def rounded_kwh(amount: float) -> int:
    rounded = Decimal(str(amount)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(rounded)


def kwh(amount: float) -> str:
    return f"{rounded_kwh(amount):,}"


def formatted_measure(amount: float, unit: str) -> str:
    if unit == "원":
        return money(amount)
    if unit == "원/kg":
        return f"{rounded_currency(amount):,}원/kg"
    if unit == "kWh":
        return f"{kwh(amount)} kWh"
    return f"{amount:,.2f} {unit}"


def average_month(site: dict[str, object], group: str, key: str) -> float:
    monthly = section(site, group)["monthly"]
    if not isinstance(monthly, list):
        raise TypeError(f"{group}.monthly가 list가 아닙니다.")
    return fmean(float(cast(dict[str, object], row)[key]) for row in monthly)


def metric_card(
    label: str,
    metric_value: str,
    helper: str,
    accent: str,
) -> None:
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


def summary_dataframe(sites: list[dict[str, object]]) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for site in sites:
        meta = section(site, "space_row")
        rows.append(
            {
                "사업장": str(meta["site_name"]),
                "작물": str(meta["crop_name"]),
                "재배면적(m²)": value(site, "space", "cultivation_area_m2"),
                "월 판매량(kg)": value(site, "production", "monthly_sales_kg"),
                "월 매출(원)": value(site, "sales", "monthly_revenue_krw"),
                "월평균 전력(kWh)": value(
                    site, "electricity", "average_monthly_energy_kwh"
                ),
                "월 전기비(원)": value(
                    site, "electricity", "monthly_electricity_cost_krw"
                ),
                "방식1 사업이익(원)": value(
                    site, "profit", "regular_business_profit_krw"
                ),
                "방식2 사업이익(원)": value(
                    site, "profit", "shared_business_profit_krw"
                ),
            }
        )
    return pd.DataFrame(rows)


def energy_dataframe(site: dict[str, object]) -> pd.DataFrame:
    monthly = section(site, "electricity")["monthly"]
    if not isinstance(monthly, list):
        raise TypeError("electricity.monthly가 list가 아닙니다.")
    frame = pd.DataFrame(monthly)
    return frame.rename(
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


def cost_dataframe(sites: list[dict[str, object]]) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for site in sites:
        meta = section(site, "space_row")
        name = str(meta["site_name"])
        costs = {
            "전기비": value(site, "electricity", "monthly_electricity_cost_krw"),
            "수도비": value(site, "water", "monthly_water_cost_krw"),
            "재료비": value(site, "material", "monthly_material_cost_krw"),
            "인건비": value(site, "labor", "monthly_labor_cost_krw"),
            "기타비용": value(
                site, "profit", "depreciation_and_other_cost_krw"
            ),
        }
        for category, amount in costs.items():
            rows.append({"비용항목": category, "사업장": name, "금액(원)": amount})
    return pd.DataFrame(rows)


def profit_dataframe(sites: list[dict[str, object]]) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for site in sites:
        meta = section(site, "space_row")
        name = str(meta["site_name"])
        rows.extend(
            [
                {
                    "사업장명": name,
                    "방식": "방식 1 · 최저시급",
                    "배분 전 영업이익": value(
                        site, "profit", "regular_operating_profit_krw"
                    ),
                    "공간 대여자": value(
                        site, "profit", "regular_landlord_income_krw"
                    ),
                    "농부": 0.0,
                    "사업장 몫": value(
                        site, "profit", "regular_business_profit_krw"
                    ),
                },
                {
                    "사업장명": name,
                    "방식": "방식 2 · 비례배분",
                    "배분 전 영업이익": value(
                        site, "profit", "shared_operating_profit_krw"
                    ),
                    "공간 대여자": value(
                        site, "profit", "shared_landlord_income_krw"
                    ),
                    "농부": value(site, "profit", "shared_farmer_income_krw"),
                    "사업장 몫": value(
                        site, "profit", "shared_business_profit_krw"
                    ),
                },
            ]
        )
    return pd.DataFrame(rows)


def detailed_dataframe(site: dict[str, object]) -> pd.DataFrame:
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
        ("7. 수도비", "월 총 용수량", value(site, "water", "monthly_total_water_m3"), "m³"),
        ("7. 수도비", "월 수도비", value(site, "water", "monthly_water_cost_krw"), "원"),
        ("8. 재료비", "월 재료비", value(site, "material", "monthly_material_cost_krw"), "원"),
        ("9. 인건비", "월 노동시간", value(site, "labor", "monthly_labor_hours"), "hour"),
        ("9. 인건비", "월 인건비", value(site, "labor", "monthly_labor_cost_krw"), "원"),
        ("10. 수익", "방식1 사업장 영업이익", value(site, "profit", "regular_business_profit_krw"), "원"),
        ("10. 수익", "방식2 사업장 영업이익", value(site, "profit", "shared_business_profit_krw"), "원"),
    ]
    return pd.DataFrame(rows, columns=["계산 블록", "항목", "값", "단위"])


st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

try:
    all_sites = calculate_all_sites()
except Exception as error:  # Streamlit 화면에서 입력 오류를 이해하기 쉽게 표시한다.
    st.error("CSV 입력 또는 계산 과정에서 오류가 발생했습니다.")
    st.exception(error)
    st.stop()

label_to_site = {site_name(site): site for site in all_sites}
all_labels = list(label_to_site)

with st.sidebar:
    st.markdown(
        """
        <div class="sidebar-brand">
            <div class="eyebrow">Indoor Farm Analytics</div>
            <h2>Profit Calculator</h2>
            <p>공간부터 수익배분까지 한 화면에서 확인합니다.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.markdown("### 분석 대상")
    selected_labels = st.multiselect(
        "사업장 선택",
        options=all_labels,
        default=all_labels,
        help="요약과 비교 차트에 포함할 사업장을 선택합니다.",
    )
    st.markdown("---")
    st.markdown("### 계산 기준")
    st.caption("평균 월 일수 · 365 / 12일")
    st.caption("전기 단일요율 · 155원/kWh")
    st.caption("수도 단일요율 · 750원/m³")
    st.caption("기타 월 비용 · 100,000원")
    st.markdown("---")
    st.caption("데이터를 수정한 뒤 브라우저를 새로고침하면 다시 계산됩니다.")

if not selected_labels:
    st.warning("왼쪽에서 한 개 이상의 사업장을 선택해 주세요.")
    st.stop()

selected_sites = [label_to_site[label] for label in selected_labels]

st.markdown(
    f"""
    <div class="hero">
        <div class="hero-kicker">Profit Calculator · Version 0.2.2</div>
        <h1>실내농장 수익성 대시보드</h1>
        <p>공간, 생산, 에너지, 운영비와 두 가지 수익배분 방식을 연결해 월 기준 사업성을 한눈에 비교합니다.</p>
        <div class="hero-badge">● {len(selected_sites)}개 사업장 분석 중 · 12개월 환경조건 반영</div>
    </div>
    """,
    unsafe_allow_html=True,
)

total_revenue = total(selected_sites, "sales", "monthly_revenue_krw")
total_energy = total(selected_sites, "electricity", "average_monthly_energy_kwh")
total_base_cost = total(selected_sites, "profit", "monthly_base_cost_krw")
regular_business = total(selected_sites, "profit", "regular_business_profit_krw")
shared_business = total(selected_sites, "profit", "shared_business_profit_krw")

kpi_columns = st.columns(5)
with kpi_columns[0]:
    metric_card("전체 월 매출", money(total_revenue), "선택 사업장의 월 매출 합계", "#10b981")
with kpi_columns[1]:
    metric_card("월평균 총 전력", f"{kwh(total_energy)} kWh", "조명·냉난방·습도 제어 포함", "#06b6d4")
with kpi_columns[2]:
    metric_card("월 기초비용", money(total_base_cost), "전기비·수도비·재료비 합계", "#6366f1")
with kpi_columns[3]:
    metric_card("방식 1 사업이익", money(regular_business), "최저시급 지급 후 사업장 몫", "#f43f5e" if regular_business < 0 else "#10b981")
with kpi_columns[4]:
    metric_card("방식 2 사업이익", money(shared_business), "농부 비례배분 후 사업장 몫", "#f43f5e" if shared_business < 0 else "#10b981")

st.write("")
tabs = st.tabs(
    [
        "Overview",
        "Monthly Energy",
        "Profit Models",
        "Calculation Detail",
        "Source Data",
    ]
)

with tabs[0]:
    st.markdown('<div class="section-title">사업장 포트폴리오</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">선택한 사업장의 생산 규모와 손익을 같은 기준으로 비교합니다.</div>', unsafe_allow_html=True)

    summary = summary_dataframe(selected_sites)
    currency_columns = [
        "월 매출(원)",
        "월 전기비(원)",
        "방식1 사업이익(원)",
        "방식2 사업이익(원)",
    ]
    for column in currency_columns:
        summary[column] = summary[column].map(rounded_currency)
    summary["월평균 전력(kWh)"] = summary["월평균 전력(kWh)"].map(
        rounded_kwh
    )
    st.dataframe(
        summary.style.format(
            {
                "재배면적(m²)": "{:,.1f}",
                "월 판매량(kg)": "{:,.1f}",
                "월 매출(원)": "{:,.0f}원",
                "월평균 전력(kWh)": "{:,.0f}",
                "월 전기비(원)": "{:,.0f}원",
                "방식1 사업이익(원)": "{:,.0f}원",
                "방식2 사업이익(원)": "{:,.0f}원",
            }
        ),
        use_container_width=True,
        hide_index=True,
    )

    chart_left, chart_right = st.columns(2)
    with chart_left:
        st.markdown("#### 매출과 사업이익 비교")
        comparison = summary[
            ["사업장", "월 매출(원)", "방식1 사업이익(원)", "방식2 사업이익(원)"]
        ].set_index("사업장").round(0)
        st.bar_chart(comparison, use_container_width=True)
    with chart_right:
        st.markdown("#### 월 비용 구성")
        costs = cost_dataframe(selected_sites)
        costs["금액(원)"] = costs["금액(원)"].map(rounded_currency)
        cost_pivot = costs.pivot(index="비용항목", columns="사업장", values="금액(원)")
        st.bar_chart(cost_pivot, use_container_width=True)

    csv_bytes = summary.to_csv(index=False).encode("utf-8-sig")
    st.download_button(
        "요약 결과 CSV 다운로드",
        data=csv_bytes,
        file_name="profit_calculator_summary.csv",
        mime="text/csv",
    )

with tabs[1]:
    st.markdown('<div class="section-title">12개월 환경제어 에너지</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">조명 전력량을 포함한 난방·냉방·제습·가습 전력의 월별 변화를 확인합니다.</div>', unsafe_allow_html=True)

    energy_label = st.selectbox("상세 사업장", selected_labels, key="energy_site")
    energy_site = label_to_site[energy_label]
    energy = energy_dataframe(energy_site)
    energy_columns = ["조명", "난방", "냉방", "제습", "가습", "총합"]
    for column in energy_columns:
        energy[column] = energy[column].map(rounded_kwh)

    energy_kpis = st.columns(4)
    with energy_kpis[0]:
        metric_card("조명", f"{kwh(float(energy['조명'].mean()))} kWh", "월 고정 조명 사용량", "#f59e0b")
    with energy_kpis[1]:
        metric_card("난방 평균", f"{kwh(float(energy['난방'].mean()))} kWh", "12개월 산술평균", "#ef4444")
    with energy_kpis[2]:
        metric_card("냉방 평균", f"{kwh(float(energy['냉방'].mean()))} kWh", "12개월 산술평균", "#3b82f6")
    with energy_kpis[3]:
        metric_card("제습·가습 평균", f"{kwh(float((energy['제습'] + energy['가습']).mean()))} kWh", "습도 제어 전력", "#8b5cf6")

    st.markdown("#### 에너지원별 월별 추이")
    st.line_chart(
        energy.set_index("월")[["조명", "난방", "냉방", "제습", "가습", "총합"]],
        use_container_width=True,
    )

    hvac_monthly = section(energy_site, "hvac")["monthly"]
    if not isinstance(hvac_monthly, list):
        raise TypeError("hvac.monthly가 list가 아닙니다.")
    environment = pd.DataFrame(hvac_monthly)[
        ["month", "outdoor_temperature_c", "outdoor_relative_humidity"]
    ].rename(
        columns={
            "month": "월",
            "outdoor_temperature_c": "외기온도(°C)",
            "outdoor_relative_humidity": "외기 상대습도",
        }
    )
    energy_table = environment.merge(energy, on="월")
    st.dataframe(
        energy_table.style.format(
            {
                "외기온도(°C)": "{:.1f}",
                "외기 상대습도": "{:.2f}",
                "조명": "{:,.0f}",
                "난방": "{:,.0f}",
                "냉방": "{:,.0f}",
                "제습": "{:,.0f}",
                "가습": "{:,.0f}",
                "총합": "{:,.0f}",
            }
        ),
        use_container_width=True,
        hide_index=True,
    )

with tabs[2]:
    st.markdown('<div class="section-title">수익배분 방식 비교</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">최저시급 지급 방식과 농부 비례배분 방식의 참여자별 결과를 함께 표시합니다.</div>', unsafe_allow_html=True)

    profits = profit_dataframe(selected_sites)
    profit_columns = ["배분 전 영업이익", "공간 대여자", "농부", "사업장 몫"]
    for column in profit_columns:
        profits[column] = profits[column].map(rounded_currency)
    profit_label = st.selectbox("비교 사업장", selected_labels, key="profit_site")
    selected_profit = profits[
        profits["사업장명"]
        == str(section(label_to_site[profit_label], "space_row")["site_name"])
    ]
    profit_chart = selected_profit.set_index("방식")[["공간 대여자", "농부", "사업장 몫"]]
    st.bar_chart(profit_chart, use_container_width=True)

    st.dataframe(
        profits.style.format(
            {
                "배분 전 영업이익": "{:,.0f}원",
                "공간 대여자": "{:,.0f}원",
                "농부": "{:,.0f}원",
                "사업장 몫": "{:,.0f}원",
            }
        ),
        use_container_width=True,
        hide_index=True,
    )

    regular_class = "status-positive" if regular_business >= 0 else "status-negative"
    shared_class = "status-positive" if shared_business >= 0 else "status-negative"
    st.markdown(
        f"""
        <div class="site-strip">
            <div><strong>선택 사업장 전체 사업이익</strong><br><span>두 방식은 항상 동시에 계산됩니다.</span></div>
            <div>방식 1 <span class="{regular_class}">{escape(money(regular_business))}</span><br>
            방식 2 <span class="{shared_class}">{escape(money(shared_business))}</span></div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with tabs[3]:
    st.markdown('<div class="section-title">계산 블록 상세</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">다이어그램의 1~10번 계산 블록에서 나온 핵심 중간값을 확인합니다.</div>', unsafe_allow_html=True)

    detail_label = st.selectbox("상세 사업장", selected_labels, key="detail_site")
    detail_site = label_to_site[detail_label]
    detail = detailed_dataframe(detail_site)
    for block in detail["계산 블록"].drop_duplicates():
        block_rows = detail[detail["계산 블록"] == block].copy()
        block_rows["결과"] = [
            formatted_measure(float(row["값"]), str(row["단위"]))
            for _, row in block_rows.iterrows()
        ]
        with st.expander(str(block), expanded=block in {"1. 공간", "10. 수익"}):
            st.dataframe(
                block_rows[["항목", "결과"]],
                use_container_width=True,
                hide_index=True,
            )

with tabs[4]:
    st.markdown('<div class="section-title">CSV 원본 데이터</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-copy">현재 계산에 사용된 UTF-8 BOM CSV를 읽기 전용으로 확인합니다.</div>', unsafe_allow_html=True)

    csv_files = sorted(DATA_DIR.glob("*.csv"))
    selected_csv_name = st.selectbox("데이터 파일", [path.name for path in csv_files])
    selected_csv = DATA_DIR / selected_csv_name
    source_frame = pd.read_csv(selected_csv, encoding="utf-8-sig")
    st.dataframe(source_frame, use_container_width=True, hide_index=True)
    st.caption(f"경로: {selected_csv}")
