// ==========================================
// 차량 종류
// ==========================================

export type VehicleType =
  | "트럭"
  | "승용"
  | "SUV";


// ==========================================
// 지도 경로 좌표
// ==========================================

export interface Coordinate {
  lat: number;
  lng: number;
}


// ==========================================
// 후보 경로
// route_candidate + energy_prediction
// ==========================================

export interface RouteOption {
  // route_candidate.route_candidate_id
  id: string;

  // 프론트 표시용 이름
  // 예: 경로 1, 경로 2, 경로 3
  name: string;

  // 이동 거리 (km)
  // DB의 distance_m을 백엔드 또는 프론트에서 변환
  distanceKm: number;

  // 예상 이동 시간 (분)
  // DB의 duration_sec을 변환
  durationMinutes: number;

  // 통행료
  tollFare?: number | null;

  // 지도 경로
  coordinates: Coordinate[];

  // 비교 기준 경로 여부
  isBaseline: boolean;

  // AI 예측 에너지 소비량
  energyConsumption: number;

  // 에너지 단위
  energyUnit: string;

  // 예상 CO₂ 배출량
  co2Kg: number;

  // 최종 AI 추천 여부
  isRecommended: boolean;
}


// ==========================================
// 전체 경로 분석 결과
// ==========================================

export interface RouteAnalysisResult {
  // route_request.route_request_id
  requestId: string;

  // 출발지
  start: string;

  // 목적지
  destination: string;

  // 차량 종류
  vehicleType: VehicleType;

  // 최종 추천 경로 ID
  recommendedRouteId: string;

  // 비교 기준 경로 ID
  baselineRouteId: string;

  // 후보 경로들
  routes: RouteOption[];

  // 기준 경로 대비 에너지 절감률
  savedEnergyPercent: number;

  // 기준 경로 대비 에너지 절감량
  savedEnergy: number;
}