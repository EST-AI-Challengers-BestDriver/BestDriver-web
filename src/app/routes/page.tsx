"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  RouteAnalysisResult,
  RouteOption,
} from "@/types/route";


// sessionStorage에 저장된 분석 결과를 가져오는 함수
const getSavedAnalysis = (): RouteAnalysisResult | null => {
  // Next.js는 서버에서도 코드를 실행할 수 있기 때문에
  // 브라우저 환경인지 먼저 확인
  if (typeof window === "undefined") {
    return null;
  }

  // analyze 페이지에서 저장한 분석 결과 가져오기
  const savedData =
    sessionStorage.getItem("routeAnalysis");

  // 저장된 데이터가 없다면 null 반환
  if (!savedData) {
    return null;
  }

  try {
    // 문자열 형태의 JSON을 다시 객체로 변환
    return JSON.parse(savedData) as RouteAnalysisResult;
  } catch (error) {
    console.error(
      "routeAnalysis 데이터를 읽는 중 오류가 발생했습니다.",
      error
    );

    return null;
  }
};


export default function RoutesPage() {
  // 페이지 이동 기능
  const router = useRouter();


  // 페이지가 처음 생성될 때
  // sessionStorage에 있는 분석 결과를 바로 state 초기값으로 사용
  const [analysis] =
    useState<RouteAnalysisResult | null>(
      getSavedAnalysis
    );


  // 처음 선택되는 경로는
  // AI가 추천한 recommendedRouteId
  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(
      () => analysis?.recommendedRouteId ?? null
    );


  // 분석 데이터가 없으면 홈으로 이동
  useEffect(() => {
    if (!analysis) {
      router.replace("/");
    }
  }, [analysis, router]);


  // 분석 데이터가 없는 동안 잠깐 보여주는 화면
  if (!analysis) {
    return (
      <main className="routes-page">
        <div className="routes-container">
          <p>경로 정보를 불러오고 있어요...</p>
        </div>
      </main>
    );
  }


  // 현재 선택된 경로 찾기
  const selectedRoute: RouteOption | undefined =
    analysis.routes.find(
      (route) => route.id === selectedRouteId
    );


  // "이 경로 선택" 버튼을 눌렀을 때 실행
  const handleSelectRoute = () => {
    // 선택된 경로가 없다면 실행하지 않음
    if (!selectedRoute) return;


    // 선택한 경로를
    // 다음 result 페이지에서 사용할 수 있도록 저장
    sessionStorage.setItem(
      "selectedRoute",
      JSON.stringify(selectedRoute)
    );


    // 결과 페이지로 이동
    router.push("/result");
  };


  return (
    <main className="routes-page">
      <div className="routes-container">

        {/* 상단 진행바 */}
        <div className="progress">
          <div className="progress-active routes-progress" />
        </div>


        {/* 헤더 */}
        <header className="routes-header">

          {/* 로고 + 홈 버튼 */}
          <div className="header-top">
            <p className="logo">
              ECOROUTE
            </p>

            <button
              type="button"
              className="home-button"
              onClick={() => router.push("/")}
              aria-label="홈으로 이동"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 10.5L12 3L21 10.5V21H14.5V15H9.5V21H3V10.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>


          {/* 페이지 제목 */}
          <h1>
            경로를 <span>비교해보세요</span>
          </h1>


          {/* 설명 */}
          <p className="description">
            이동시간과 에너지 소비량,
            예상 탄소 배출량을 비교했어요.
          </p>

        </header>


        {/* 출발지 → 목적지 */}
        <section className="route-summary">

          <div>
            <span className="summary-label">
              출발
            </span>

            <strong>
              {analysis.start}
            </strong>
          </div>


          <span className="summary-arrow">
            ↓
          </span>


          <div>
            <span className="summary-label">
              도착
            </span>

            <strong>
              {analysis.destination}
            </strong>
          </div>

        </section>


        {/* 임시 지도 영역
            실제 지도 API 연결 전 placeholder */}
        <section className="map-placeholder">

          <div className="mock-route-line" />

          <span className="map-start">
            출발
          </span>

          <span className="map-end">
            도착
          </span>

          <p>
            지도 / 후보 경로 표시 영역
          </p>

        </section>


        {/* 후보 경로 목록 */}
        <section className="route-list">

          {analysis.routes.map((route) => {
            // 현재 카드가 선택된 경로인지 확인
            const isSelected =
              selectedRouteId === route.id;


            return (
              <button
                key={route.id}
                type="button"

                className={`route-option-card ${
                  isSelected ? "selected" : ""
                }`}

                // 경로 카드를 누르면 해당 경로 선택
                onClick={() =>
                  setSelectedRouteId(route.id)
                }
              >

                {/* 경로 기본 정보 */}
                <div className="route-option-top">

                  <div>

                    <div className="route-name-row">

                      {/* 경로명 */}
                      <strong>
                        {route.name}
                      </strong>


                      {/* AI 추천 경로 표시 */}
                      {route.isRecommended && (
                        <span className="eco-badge">
                          AI 추천
                        </span>
                      )}

                    </div>


                    {/* 시간 / 거리 */}
                    <span className="route-time">
                      {route.durationMinutes}분 ·{" "}
                      {route.distanceKm}km
                    </span>

                  </div>


                  {/* 선택 여부 */}
                  <div
                    className={`route-radio ${
                      isSelected ? "checked" : ""
                    }`}
                  />

                </div>


                {/* 에너지 / CO₂ 정보 */}
                <div className="route-metrics">

                  <div>
                    <span>
                      에너지
                    </span>

                    <strong>
                      {route.energyConsumption}
                      {route.energyUnit}
                    </strong>
                  </div>


                  <div>
                    <span>
                      CO₂
                    </span>

                    <strong>
                      {route.co2Kg}kg
                    </strong>
                  </div>

                </div>

              </button>
            );
          })}

        </section>


        {/* 선택한 경로로 다음 페이지 이동 */}
        <button
          type="button"
          className="eco-button"
          onClick={handleSelectRoute}
          disabled={!selectedRoute}
        >
          이 경로 선택
        </button>

      </div>
    </main>
  );
}