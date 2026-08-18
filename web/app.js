const state = {
  config: null,
  setupMap: null,
  routesMap: null,
  nodesLayer: null,
  markers: { start: null, destination: null },
  points: { start: null, destination: null },
  pickMode: "start",
  result: null,
  routeLayers: new Map(),
  selectedRouteId: null,
  armedRouteId: null,
  loadingTimer: null,
};

const routeColors = ["#356feb", "#ff7a1a", "#19a956", "#a458ec"];
const screens = [...document.querySelectorAll(".screen")];

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));
  if (id === "setup-screen") setTimeout(() => state.setupMap?.invalidateSize(), 80);
  if (id === "routes-screen") setTimeout(() => state.routesMap?.invalidateSize(), 80);
}

function fillHours() {
  const select = document.querySelector("#departure-hour");
  const currentHour = new Date().getHours();
  for (let hour = 0; hour < 24; hour += 1) {
    const option = document.createElement("option");
    option.value = hour;
    option.textContent = `${String(hour).padStart(2, "0")}:00`;
    option.selected = hour === currentHour;
    select.append(option);
  }
}

async function initialize() {
  fillHours();
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("지도 설정을 불러오지 못했습니다.");
    state.config = await response.json();
    initializeSetupMap();
    bindEvents();
  } catch (error) {
    document.querySelector("#setup-error").textContent = error.message;
  }
}

function tileLayer() {
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  });
}

function initializeSetupMap() {
  const { nodes } = state.config;
  const selectionBounds = boundsFromConfig();
  state.setupMap = L.map("setup-map", {
    zoomControl: true,
    preferCanvas: true,
    maxBounds: selectionBounds.pad(.06),
    maxBoundsViscosity: 1,
    maxZoom: 17,
  });
  tileLayer().addTo(state.setupMap);
  addCoverageFrame(state.setupMap, selectionBounds);
  const sharedRenderer = L.canvas({ padding: .35 });
  state.nodesLayer = L.layerGroup();
  nodes.forEach((node) => {
    L.circleMarker([node.lat, node.lon], {
      renderer: sharedRenderer,
      radius: 4,
      weight: 1.5,
      color: "#ffffff",
      fillColor: "#12875c",
      fillOpacity: .78,
      interactive: false,
    }).addTo(state.nodesLayer);
  });
  state.nodesLayer.addTo(state.setupMap);
  state.setupMap.fitBounds(selectionBounds, { padding: [24, 24] });
  state.setupMap.setMinZoom(state.setupMap.getZoom());
  state.setupMap.on("click", ({ latlng }) => {
    if (selectionBounds.contains(latlng)) selectNearestNode(latlng);
    else showTemporaryMapHint("선택 가능한 사각형 안을 눌러 주세요");
  });
  document.querySelector(".map-note").textContent =
    `실제 관측 영역 · 주요 선택 노드 ${state.config.selectable_node_count.toLocaleString("ko-KR")}개`;
}

function boundsFromConfig() {
  const bounds = state.config.selectable_bounds;
  return L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]);
}

function addCoverageFrame(map, bounds) {
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();
  const pad = 3;
  const maskStyle = {
    stroke: false,
    fillColor: "#dce7e1",
    fillOpacity: .82,
    interactive: false,
  };
  [
    [[south - pad, west - pad], [south, east + pad]],
    [[north, west - pad], [north + pad, east + pad]],
    [[south, west - pad], [north, west]],
    [[south, east], [north, east + pad]],
  ].forEach((rectangle) => L.rectangle(rectangle, maskStyle).addTo(map));
  L.rectangle(bounds, {
    color: "#0b6d4d",
    weight: 2,
    opacity: .8,
    fill: false,
    interactive: false,
    dashArray: "7 6",
  }).addTo(map);
}

function showTemporaryMapHint(message) {
  const hint = document.querySelector("#pick-hint");
  const original = state.pickMode === "start"
    ? " 출발 노드를 선택해 주세요"
    : " 도착 노드를 선택해 주세요";
  hint.lastChild.textContent = ` ${message}`;
  window.setTimeout(() => { hint.lastChild.textContent = original; }, 1500);
}

function nearestNode(latlng) {
  const lonScale = Math.cos(latlng.lat * Math.PI / 180);
  let nearest = null;
  let best = Infinity;
  state.config.nodes.forEach((node) => {
    const dy = node.lat - latlng.lat;
    const dx = (node.lon - latlng.lng) * lonScale;
    const score = dx * dx + dy * dy;
    if (score < best) { best = score; nearest = node; }
  });
  return nearest;
}

function selectNearestNode(latlng) {
  const node = nearestNode(latlng);
  if (!node) return;
  setPoint(state.pickMode, node);
  if (state.pickMode === "start" && !state.points.destination) setPickMode("destination");
}

function setPoint(kind, node) {
  state.points[kind] = { node_id: node.id, lat: node.lat, lon: node.lon };
  if (state.markers[kind]) state.setupMap.removeLayer(state.markers[kind]);
  const isStart = kind === "start";
  state.markers[kind] = L.circleMarker([node.lat, node.lon], {
    radius: 9, color: "#fff", weight: 3,
    fillColor: isStart ? "#19a96b" : "#ff5961", fillOpacity: 1,
  }).addTo(state.setupMap).bindTooltip(isStart ? "출발" : "도착", {
    permanent: true, direction: "top", offset: [0, -8], className: "node-tooltip",
  });
  const field = document.querySelector(`#${kind === "start" ? "start" : "destination"}-field strong`);
  field.textContent = `Node ${node.id} · ${node.lat.toFixed(5)}, ${node.lon.toFixed(5)}`;
  updateSubmitState();
}

function setPickMode(kind) {
  state.pickMode = kind;
  document.querySelectorAll(".location-field").forEach((field) => {
    field.classList.toggle("active", field.dataset.pick === kind);
  });
  const hint = document.querySelector("#pick-hint");
  hint.classList.toggle("destination", kind === "destination");
  hint.lastChild.textContent = kind === "start" ? " 출발 노드를 선택해 주세요" : " 도착 노드를 선택해 주세요";
}

function updateSubmitState() {
  document.querySelector("#find-routes").disabled = !(state.points.start && state.points.destination);
}

function bindEvents() {
  document.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => setPickMode(button.dataset.pick));
  });
  document.querySelector("#swap-locations").addEventListener("click", swapLocations);
  document.querySelectorAll("input[name='vehicle']").forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll(".vehicle-card").forEach((card) => card.classList.remove("selected"));
      input.closest(".vehicle-card").classList.add("selected");
    });
  });
  document.querySelector("#find-routes").addEventListener("click", calculateRoutes);
  document.querySelectorAll("[data-go-home]").forEach((button) => button.addEventListener("click", resetDemo));
}

function swapLocations() {
  const start = state.points.start;
  const destination = state.points.destination;
  if (!start && !destination) return;
  if (start) setPoint("destination", start);
  else clearPoint("destination");
  if (destination) setPoint("start", destination);
  else clearPoint("start");
}

function clearPoint(kind) {
  state.points[kind] = null;
  if (state.markers[kind]) state.setupMap.removeLayer(state.markers[kind]);
  state.markers[kind] = null;
}

function startLoadingMessages() {
  const steps = [
    "24시간 교통 프로필을 불러오고 있어요",
    "다익스트라 기반 후보 경로를 비교하고 있어요",
    "도로를 250m 구간으로 나누고 있어요",
    "DNN이 에너지와 탄소 배출량을 계산하고 있어요",
  ];
  let index = 0;
  document.querySelector("#loading-step").textContent = steps[index];
  state.loadingTimer = setInterval(() => {
    index = (index + 1) % steps.length;
    document.querySelector("#loading-step").textContent = steps[index];
  }, 2100);
}

async function calculateRoutes() {
  document.querySelector("#setup-error").textContent = "";
  showScreen("loading-screen");
  startLoadingMessages();
  const vehicle = document.querySelector("input[name='vehicle']:checked").value;
  const hour = Number(document.querySelector("#departure-hour").value);
  try {
    const response = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: state.points.start, destination: state.points.destination, hour, vehicle }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "경로 계산에 실패했습니다.");
    state.result = payload;
    showScreen("routes-screen");
    renderRouteResults();
  } catch (error) {
    document.querySelector("#setup-error").textContent = error.message;
    showScreen("setup-screen");
  } finally {
    clearInterval(state.loadingTimer);
  }
}

function orderedRoutes(routes) {
  const eco = routes.find((route) => route.is_greenest_route);
  const fastest = routes.find((route) => route.is_fastest_route && route.route_id !== eco?.route_id);
  const selected = [eco, fastest].filter(Boolean);
  const rest = routes
    .filter((route) => !selected.some((item) => item.route_id === route.route_id))
    .sort((a, b) => a.total_co2_kg - b.total_co2_kg);
  return [...selected, ...rest];
}

function renderRouteResults() {
  if (state.routesMap) state.routesMap.remove();
  const { center } = state.config;
  const selectionBounds = boundsFromConfig();
  state.routesMap = L.map("routes-map", {
    zoomControl: true,
    maxBounds: selectionBounds.pad(.08),
    maxBoundsViscosity: 1,
    maxZoom: 17,
  }).setView([center.lat, center.lon], 13);
  tileLayer().addTo(state.routesMap);
  state.routeLayers.clear();

  const summaryById = new Map(state.result.routes.map((route) => [route.route_id, route]));
  const bounds = [];
  state.result.geojson.features.forEach((feature, index) => {
    const route = summaryById.get(feature.properties.route_id);
    const layer = L.geoJSON(feature, {
      style: { color: routeColors[index], weight: 5, opacity: .75, lineCap: "round", lineJoin: "round" },
    }).addTo(state.routesMap);
    layer.on("click", () => selectRoute(route.route_id, false));
    state.routeLayers.set(route.route_id, layer);
    bounds.push(layer.getBounds());
  });
  if (bounds.length) {
    const merged = bounds.slice(1).reduce((result, bound) => result.extend(bound), bounds[0]);
    state.routesMap.fitBounds(merged, { padding: [35, 35] });
  }

  const routes = orderedRoutes(state.result.routes);
  document.querySelector("#trip-summary").innerHTML = `
    <strong>${state.result.vehicle.label}</strong><span class="dot">•</span>
    <span>${String(state.result.hour).padStart(2, "0")}:00 출발</span><span class="dot">•</span>
    <span>경로 ${routes.length}개 분석 완료</span>`;
  document.querySelector("#route-list").innerHTML = routes.map(routeCardHtml).join("");
  document.querySelectorAll(".route-card").forEach((card) => {
    card.addEventListener("click", () => {
      const repeat = state.armedRouteId === card.dataset.routeId;
      if (repeat) showImpact(card.dataset.routeId);
      else {
        selectRoute(card.dataset.routeId, true);
        state.armedRouteId = card.dataset.routeId;
      }
    });
  });
  state.armedRouteId = null;
  selectRoute(routes[0].route_id, true);
}

function routeCardHtml(route) {
  const originalIndex = Number(route.route_id.split("_")[1]) - 1;
  const badges = [
    route.is_greenest_route ? '<span class="badge eco">ECO</span>' : "",
    route.is_fastest_route ? '<span class="badge fast">FASTEST</span>' : "",
  ].join("");
  return `<button class="route-card" type="button" data-route-id="${route.route_id}">
    <span class="route-stripe" style="background:${routeColors[originalIndex]}"></span>
    <span class="route-card-content">
      <span class="route-card-top">
        <span class="route-name">${routeLabel(route)}</span>
        <span class="badges">${badges}</span>
      </span>
      <span class="route-metrics">
        <span class="metric"><small>예상시간</small><strong>${route.traffic_travel_time_min.toFixed(1)}분</strong></span>
        <span class="metric"><small>총 거리</small><strong>${route.distance_km.toFixed(2)}km</strong></span>
        <span class="metric"><small>탄소배출</small><strong>${route.total_co2_kg.toFixed(3)}kg</strong></span>
      </span>
      <span class="route-confirm">한 번 더 누르면 이 경로로 안내를 시작합니다 →</span>
    </span>
  </button>`;
}

function routeLabel(route) {
  if (route.is_greenest_route && route.is_fastest_route) return "최적의 에코 경로";
  if (route.is_greenest_route) return "친환경 추천 경로";
  if (route.is_fastest_route) return "가장 빠른 경로";
  return `대안 경로 ${route.route_id.split("_")[1]}`;
}

function selectRoute(routeId, scrollCard) {
  state.selectedRouteId = routeId;
  state.routeLayers.forEach((layer, id) => {
    const selected = id === routeId;
    layer.setStyle({ weight: selected ? 10 : 5, opacity: selected ? 1 : .62 });
    if (selected) layer.bringToFront();
  });
  document.querySelectorAll(".route-card").forEach((card) => {
    const selected = card.dataset.routeId === routeId;
    card.classList.toggle("selected", selected);
    if (selected && scrollCard) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function showImpact(routeId) {
  const chosen = state.result.routes.find((route) => route.route_id === routeId);
  const fastest = state.result.routes.find((route) => route.is_fastest_route);
  if (!chosen || !fastest) return;
  const savedKg = Math.max(0, fastest.total_co2_kg - chosen.total_co2_kg);
  const savedGrams = Math.round(savedKg * 1000);
  const percent = fastest.total_co2_kg > 0 ? savedKg / fastest.total_co2_kg * 100 : 0;
  document.querySelector("#saved-carbon").textContent = savedGrams.toLocaleString("ko-KR");
  document.querySelector("#saving-percent").textContent = `${percent.toFixed(1)}% 절감`;
  document.querySelector("#fast-carbon").textContent = `${fastest.total_co2_kg.toFixed(3)} kg`;
  document.querySelector("#chosen-carbon").textContent = `${chosen.total_co2_kg.toFixed(3)} kg`;
  const maxCarbon = Math.max(fastest.total_co2_kg, chosen.total_co2_kg, .001);
  document.querySelector("#fast-bar").style.width = `${fastest.total_co2_kg / maxCarbon * 100}%`;
  document.querySelector("#chosen-bar").style.width = `${chosen.total_co2_kg / maxCarbon * 100}%`;
  document.querySelector("#impact-message").textContent = savedGrams > 0
    ? "가장 빠른 길보다 조금 더 지구를 생각하는 선택을 했습니다."
    : "추가 탄소 배출 없이 가장 빠르고 친환경적인 길을 선택했습니다.";
  document.querySelector("#impact-route-meta").innerHTML = `
    <span>선택 경로 <strong>${routeLabel(chosen)}</strong></span>
    <span>거리 <strong>${chosen.distance_km.toFixed(2)}km</strong></span>
    <span>예상시간 <strong>${chosen.traffic_travel_time_min.toFixed(1)}분</strong></span>`;
  showScreen("impact-screen");
}

function resetDemo() {
  state.result = null;
  state.selectedRouteId = null;
  state.armedRouteId = null;
  clearPoint("start");
  clearPoint("destination");
  document.querySelector("#start-field strong").textContent = "지도에서 출발 노드를 선택하세요";
  document.querySelector("#destination-field strong").textContent = "지도에서 도착 노드를 선택하세요";
  setPickMode("start");
  updateSubmitState();
  showScreen("setup-screen");
}

initialize();
