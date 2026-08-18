"""Dependency-free local HTTP server for the EcoRoute web demo."""

from __future__ import annotations

import argparse
import json
import math
import threading
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import networkx as nx
import osmnx as ox

from .route_energy import predict_route_energy


VEHICLES = {
    "compact": {
        "label": "소형차",
        "weight_kg": 1250.0,
        "engine_l": 1.6,
        "description": "가볍고 효율적인 도심형 차량",
    },
    "midsize": {
        "label": "중형차",
        "weight_kg": 1587.573295,
        "engine_l": 2.5,
        "description": "EcoRoute 기본 비교 차량",
    },
    "truck": {
        "label": "트럭",
        "weight_kg": 2267.96185,
        "engine_l": 4.8,
        "description": "중량과 배기량이 큰 화물 차량",
    },
}

SELECTABLE_NODE_SPACING_M = 400.0
DEMO_CONFIG_PATH = Path("config") / "demo_runtime.json"


class DemoApplication:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.web_root = root / "web"
        config_path = root / DEMO_CONFIG_PATH
        if not config_path.exists():
            raise FileNotFoundError(config_path)
        settings = json.loads(config_path.read_text(encoding="utf-8"))
        self.region_key = str(settings["region_key"])
        graph_path = root / str(settings["graph_path"])
        required_runtime_paths = [
            graph_path,
            root / str(settings["traffic_profile_path"]),
            root / str(settings["model_checkpoint_path"]),
        ]
        for required_path in required_runtime_paths:
            if not required_path.exists():
                raise FileNotFoundError(required_path)
        graph = ox.io.load_graphml(graph_path)
        self.original_graph_node_count = len(graph)
        self.selectable_bounds = {
            key: float(settings["selectable_bounds"][key])
            for key in ("south", "west", "north", "east")
        }
        self.selectable_node_spacing_m = float(
            settings.get("selectable_node_spacing_m", SELECTABLE_NODE_SPACING_M)
        )
        self.nodes = select_spaced_nodes(
            graph,
            self.selectable_bounds,
            minimum_spacing_m=self.selectable_node_spacing_m,
        )
        self.route_lock = threading.Lock()

    def config_payload(self) -> dict:
        return {
            "region": self.region_key,
            "center": {
                "lat": (self.selectable_bounds["south"] + self.selectable_bounds["north"]) / 2,
                "lon": (self.selectable_bounds["west"] + self.selectable_bounds["east"]) / 2,
            },
            "selectable_bounds": self.selectable_bounds,
            "selectable_node_spacing_m": self.selectable_node_spacing_m,
            "original_graph_node_count": self.original_graph_node_count,
            "selectable_node_count": len(self.nodes),
            "nodes": self.nodes,
            "vehicles": VEHICLES,
        }

    def calculate_routes(self, payload: dict) -> dict:
        start = self._coordinate(payload, "start")
        destination = self._coordinate(payload, "destination")
        if payload.get("start", {}).get("node_id") == payload.get("destination", {}).get("node_id"):
            raise ValueError("출발지와 목적지는 서로 다른 노드를 선택해 주세요.")
        hour = int(payload.get("hour", 8))
        if not 0 <= hour <= 23:
            raise ValueError("출발시간은 0시부터 23시 사이여야 합니다.")
        vehicle_key = str(payload.get("vehicle", "midsize"))
        if vehicle_key not in VEHICLES:
            raise ValueError("지원하지 않는 차종입니다.")
        vehicle = VEHICLES[vehicle_key]

        with self.route_lock:
            summary = predict_route_energy(
                root=self.root,
                region_key=self.region_key,
                hour=hour,
                weekday=2,
                start=start,
                destination=destination,
                vehicle_weight_kg=float(vehicle["weight_kg"]),
                engine_displacement_l=float(vehicle["engine_l"]),
                route_count=4,
                candidate_count=40,
                requested_device="auto",
            )
            result_dir = self.root / "results" / "route_energy" / self.region_key
            geojson = json.loads((result_dir / "routes.geojson").read_text(encoding="utf-8"))
            metadata = json.loads((result_dir / "metadata.json").read_text(encoding="utf-8"))

        routes = json.loads(summary.to_json(orient="records"))
        return {
            "region": self.region_key,
            "hour": hour,
            "vehicle": {"key": vehicle_key, **vehicle},
            "start": {"lat": start[0], "lon": start[1]},
            "destination": {"lat": destination[0], "lon": destination[1]},
            "routes": routes,
            "geojson": geojson,
            "carbon_scope": metadata["carbon_scope"],
        }

    def _coordinate(self, payload: dict, name: str) -> tuple[float, float]:
        value = payload.get(name)
        if not isinstance(value, dict):
            raise ValueError(f"{name} 노드를 지도에서 선택해 주세요.")
        try:
            latitude = float(value["lat"])
            longitude = float(value["lon"])
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError(f"{name} 좌표가 올바르지 않습니다.") from error
        if not (
            self.selectable_bounds["south"] <= latitude <= self.selectable_bounds["north"]
            and self.selectable_bounds["west"] <= longitude <= self.selectable_bounds["east"]
        ):
            raise ValueError("앤아버 지도 범위 안의 도로 노드를 선택해 주세요.")
        return latitude, longitude


def select_spaced_nodes(
    graph: object,
    bounds: dict[str, float],
    minimum_spacing_m: float,
) -> list[dict[str, float | str]]:
    """Keep well-connected road nodes with a stable minimum visual spacing."""
    strongly_connected = max(nx.strongly_connected_components(graph), key=len)
    center_latitude_rad = math.radians((bounds["south"] + bounds["north"]) / 2)
    longitude_scale = math.cos(center_latitude_rad)
    candidates = []
    for node_id, data in graph.nodes(data=True):
        latitude = float(data["y"])
        longitude = float(data["x"])
        if node_id not in strongly_connected:
            continue
        if not (
            bounds["south"] <= latitude <= bounds["north"]
            and bounds["west"] <= longitude <= bounds["east"]
        ):
            continue
        degree = int(graph.in_degree(node_id) + graph.out_degree(node_id))
        candidates.append((-degree, str(node_id), node_id, latitude, longitude))
    candidates.sort()

    selected = []
    spatial_cells: dict[tuple[int, int], list[tuple[float, float]]] = {}
    for _, _, node_id, latitude, longitude in candidates:
        x_m = (longitude - bounds["west"]) * 111_320 * longitude_scale
        y_m = (latitude - bounds["south"]) * 111_320
        cell_x = math.floor(x_m / minimum_spacing_m)
        cell_y = math.floor(y_m / minimum_spacing_m)
        far_enough = True
        for nearby_x in range(cell_x - 1, cell_x + 2):
            for nearby_y in range(cell_y - 1, cell_y + 2):
                for selected_x, selected_y in spatial_cells.get((nearby_x, nearby_y), []):
                    if math.hypot(x_m - selected_x, y_m - selected_y) < minimum_spacing_m:
                        far_enough = False
                        break
                if not far_enough:
                    break
            if not far_enough:
                break
        if not far_enough:
            continue
        selected.append({"id": str(node_id), "lat": latitude, "lon": longitude})
        spatial_cells.setdefault((cell_x, cell_y), []).append((x_m, y_m))
    return selected


def make_handler(application: DemoApplication) -> type[BaseHTTPRequestHandler]:
    class DemoHandler(BaseHTTPRequestHandler):
        server_version = "EcoRouteDemo/1.0"

        def do_GET(self) -> None:  # noqa: N802
            path = urlparse(self.path).path
            if path == "/api/health":
                self._send_json({"status": "UP"})
                return
            if path == "/api/config":
                self._send_json(application.config_payload())
                return
            static_files = {
                "/": ("index.html", "text/html; charset=utf-8"),
                "/index.html": ("index.html", "text/html; charset=utf-8"),
                "/styles.css": ("styles.css", "text/css; charset=utf-8"),
                "/app.js": ("app.js", "text/javascript; charset=utf-8"),
            }
            entry = static_files.get(path)
            if entry is None:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            filename, content_type = entry
            file_path = application.web_root / filename
            if not file_path.exists():
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            data = file_path.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_POST(self) -> None:  # noqa: N802
            if urlparse(self.path).path != "/api/routes":
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 100_000:
                    raise ValueError("요청 데이터의 크기가 올바르지 않습니다.")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                self._send_json(application.calculate_routes(payload))
            except (ValueError, json.JSONDecodeError) as error:
                self._send_json({"error": str(error)}, status=HTTPStatus.BAD_REQUEST)
            except Exception as error:  # Keep the demo UI recoverable during calculation errors.
                print(f"Demo route calculation failed: {error}", flush=True)
                self._send_json(
                    {"error": "경로 계산에 실패했습니다. 다른 두 노드를 선택해 다시 시도해 주세요."},
                    status=HTTPStatus.INTERNAL_SERVER_ERROR,
                )

        def _send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, format_string: str, *args: object) -> None:
            print(f"[EcoRoute web] {format_string % args}", flush=True)

    return DemoHandler


def run_server(root: Path, host: str, port: int, open_browser: bool = True) -> None:
    application = DemoApplication(root)
    server = ThreadingHTTPServer((host, port), make_handler(application))
    url = f"http://{host}:{port}"
    print(f"EcoRoute demo ready: {url}", flush=True)
    print("Stop the server with Ctrl+C.", flush=True)
    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("EcoRoute demo stopped.", flush=True)
    finally:
        server.server_close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the EcoRoute Ann Arbor web demo")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    run_server(root, args.host, args.port, open_browser=not args.no_browser)
