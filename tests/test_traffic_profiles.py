"""Lightweight tests for eVED hourly traffic profile helpers."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ecoroute.traffic_profiles import normalize_road_type, physical_edge_id


def run() -> None:
    assert physical_edge_id(20, 10, 0) == physical_edge_id(10, 20, 0)
    assert physical_edge_id(20, 10, 0) == "10_20_0"
    assert normalize_road_type(["primary", "secondary"]) == "primary"
    assert normalize_road_type("['residential', 'service']") == "residential"
    assert normalize_road_type("motorway") == "motorway"
    print("traffic profile helper tests: PASS")


if __name__ == "__main__":
    run()
