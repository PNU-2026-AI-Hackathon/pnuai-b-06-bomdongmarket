"""계산 블록 1: 공간 계산."""

from __future__ import annotations

from math import sqrt


def calculate_space(space: dict[str, float | str]) -> dict[str, float]:
    """공실 입력정보로 재배면적, 체적, 길이, 벽 한 면의 면적을 계산한다."""
    total_area = float(space["total_area_m2"])
    cultivable_ratio = float(space["cultivable_ratio"])
    module_layers = float(space["module_layers"])
    ceiling_height = float(space["ceiling_height_m"])

    if total_area <= 0:
        raise ValueError("공실 전체면적은 0보다 커야 합니다.")
    if not 0 <= cultivable_ratio <= 1:
        raise ValueError("재배가능 비율은 0과 1 사이여야 합니다.")
    if module_layers <= 0 or ceiling_height <= 0:
        raise ValueError("재배모듈 층 수와 천장 높이는 0보다 커야 합니다.")

    available_floor_area = total_area * cultivable_ratio
    cultivation_area = available_floor_area * module_layers
    volume = total_area * ceiling_height
    space_length = sqrt(total_area)
    wall_area_one_side = space_length * ceiling_height

    return {
        "total_area_m2": total_area,
        "available_floor_area_m2": available_floor_area,
        "cultivation_area_m2": cultivation_area,
        "volume_m3": volume,
        "space_length_m": space_length,
        "wall_area_one_side_m2": wall_area_one_side,
    }
