"""Lightweight tests for EcoRoute map preparation and routing helpers."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ecoroute.map_preparation import hgt_tile_name, interpolate_hgt


def run() -> None:
    assert hgt_tile_name(42.2808, -83.7430) == "N42W084"
    assert hgt_tile_name(-33.9, 151.2) == "S34E151"
    raster = np.array([[100, 200], [300, 400]], dtype=">i2")
    assert interpolate_hgt(raster, "N42W084", 42.5, -83.5) == 250.0
    print("routing helper tests: PASS")


if __name__ == "__main__":
    run()
