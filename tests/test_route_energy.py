"""Lightweight segmentation tests for Route A+B integration."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ecoroute.route_energy import (
    CO2_KG_PER_KWH,
    FEATURES,
    add_carbon_metrics,
    segment_route_edges,
)


def run() -> None:
    edges = pd.DataFrame(
        [
            {
                "length": 300.0,
                "traffic_travel_time": 30.0,
                "traffic_speed_std_kmh": 4.0,
                "speed_kph": 50.0,
                "traffic_stop_ratio": 0.1,
                "traffic_low_speed_ratio": 0.2,
                "grade": 0.02,
                "traffic_profile_source": "edge_observed",
            },
            {
                "length": 250.0,
                "traffic_travel_time": 30.0,
                "traffic_speed_std_kmh": 5.0,
                "speed_kph": 40.0,
                "traffic_stop_ratio": 0.2,
                "traffic_low_speed_ratio": 0.3,
                "grade": -0.01,
                "traffic_profile_source": "road_class_fallback",
            },
        ]
    )
    segments = segment_route_edges(edges, "route_1", 1_500.0, 2.0, 8, 2)
    assert len(segments) == 2
    assert [round(segment["distance_m"], 6) for segment in segments] == [250.0, 300.0]
    assert round(sum(segment["distance_m"] for segment in segments), 6) == 550.0
    assert all(set(FEATURES).issubset(segment) for segment in segments)
    assert all(100 <= segment["distance_m"] <= 375 for segment in segments)

    summary = pd.DataFrame(
        {
            "route_id": ["route_1", "route_2", "route_3"],
            "rank_by_traffic_time": [1, 2, 3],
            "distance_km": [10.0, 9.0, 12.0],
            "total_energy_kwh": [4.0, 3.0, 5.0],
        }
    )
    carbon = add_carbon_metrics(summary)
    assert np.allclose(
        carbon["total_co2_kg"], summary["total_energy_kwh"] * CO2_KG_PER_KWH
    )
    assert carbon.loc[0, "is_fastest_route"]
    assert carbon.loc[1, "is_greenest_route"]
    assert carbon.loc[1, "rank_by_carbon"] == 1
    assert not carbon.loc[2, "is_recommended_eco_route"]
    print("route energy segmentation tests: PASS")


if __name__ == "__main__":
    run()
