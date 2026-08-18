"""Lightweight split tests for EcoRoute training."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ecoroute.training import split_by_trip


def run() -> None:
    rows = []
    for vehicle_id in range(3):
        for trip_id in range(20):
            for segment in range(3):
                rows.append({"vehicle_id": vehicle_id, "trip_id": trip_id, "segment": segment})
    frame = pd.DataFrame(rows)
    split = split_by_trip(frame)
    check = frame.assign(split=split).groupby(["vehicle_id", "trip_id"])["split"].nunique()
    assert check.max() == 1
    assert set(split.unique()) == {"train", "validation", "test"}
    print("training split tests: PASS")


if __name__ == "__main__":
    run()
