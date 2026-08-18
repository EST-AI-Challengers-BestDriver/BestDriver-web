"""Lightweight architecture tests for EcoRoute DNN training."""

from __future__ import annotations

import sys
from pathlib import Path

import torch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ecoroute.dnn_training import EnergyMLP, count_parameters
from ecoroute.training import FEATURES


def run() -> None:
    model = EnergyMLP()
    batch = torch.randn(8, len(FEATURES))
    prediction = model(batch)
    assert prediction.shape == (8,)
    assert count_parameters(model) == 29_697
    assert torch.isfinite(prediction).all()
    print("DNN architecture tests: PASS")


if __name__ == "__main__":
    run()
