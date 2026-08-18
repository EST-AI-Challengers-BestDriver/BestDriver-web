"""Tests for the lightweight EcoRoute demo server helpers."""

from __future__ import annotations

import sys
from pathlib import Path

import networkx as nx


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ecoroute.demo_server import SELECTABLE_NODE_SPACING_M, VEHICLES, select_spaced_nodes


def run() -> None:
    graph = nx.DiGraph()
    coordinates = {
        1: (42.2500, -83.7500),
        2: (42.2508, -83.7500),  # Too close to node 1.
        3: (42.2550, -83.7500),
        4: (42.2600, -83.7500),
    }
    for node_id, (latitude, longitude) in coordinates.items():
        graph.add_node(node_id, y=latitude, x=longitude)
    for first, second in zip(coordinates, [2, 3, 4, 1], strict=True):
        graph.add_edge(first, second)
        graph.add_edge(second, first)

    selected = select_spaced_nodes(
        graph,
        {"south": 42.24, "west": -83.76, "north": 42.27, "east": -83.74},
        minimum_spacing_m=400,
    )
    assert len(selected) == 3
    assert {row["id"] for row in selected}.issubset({"1", "2", "3", "4"})
    assert SELECTABLE_NODE_SPACING_M == 400.0
    assert set(VEHICLES) == {"compact", "midsize", "truck"}
    print("demo server helper tests: PASS")


if __name__ == "__main__":
    run()
