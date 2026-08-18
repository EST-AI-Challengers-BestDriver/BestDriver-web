"""Lightweight tests runnable without third-party test frameworks."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ecoroute.preprocessing import (
    PreprocessConfig,
    haversine_step_m,
    parse_engine_displacement_l,
    weighted_mean,
)


def run() -> None:
    distance = haversine_step_m(np.array([42.0, 42.001]), np.array([-83.0, -83.0]))
    assert 110 < distance[0] < 112
    assert distance[1] == 0
    assert math.isclose(weighted_mean(np.array([10.0, 20.0]), np.array([1.0, 3.0])), 17.5)
    assert parse_engine_displacement_l("4-FI 2.0L T/C") == 2.0
    assert math.isnan(parse_engine_displacement_l("ELECTRIC"))
    assert PreprocessConfig().max_gps_step_m == 500.0
    assert PreprocessConfig().min_distance_consistency == 0.5
    assert PreprocessConfig().max_energy_kwh_per_100km == 200.0
    print("preprocessing tests: PASS")


if __name__ == "__main__":
    run()
