"use client";

// React 상태와 페이지 로드 시 실행할 기능
import { useEffect, useState } from "react";

// Next.js 페이지 이동 기능
import { useRouter } from "next/navigation";

// 앞에서 만든 공통 데이터 타입
import type {
  RouteAnalysisResult,
  RouteOption,
} from "@/types/route";


export default function RoutesPage() {
  // 다른 페이지로 이동할 때 사용
  const router = useRouter();


  // 전체 AI 분석 결과를 저장
  const [analysis, setAnalysis] =
    useState<RouteAnalysisResult | null>(null);


  // 사용자가 선택한 경로 ID
  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);


  // 페이지가 처음 열리면 한 번 실행
  useEffect(() => {
    // analyze 페이지에서 저장한 데이터 가져오기
    const savedData =
      sessionStorage.getItem("routeAnalysis");


    // 저장된 분석 결과가 없다면
    if (!savedData) {
      // 다시 첫 페이지로 이동
      router.replace("/");
      return;
    }


    // 문자열 형태의 JSON을 다시 객체로 변환
    const parsedData: RouteAnalysisResult =
      JSON.parse(savedData);


    // 분석 결과 저장
    setAnalysis(parsedData);


    // 처음에는 AI 추천 경로를 자동으로 선택
    setSelectedRouteId(
      parsedData.recommendedRouteId
    );
  }, [router]);


  // 데이터가 아직 준비되지 않았다면
  // 간단한 로딩 화면 표시
  if (!analysis) {
    return (
      <main className="routes-page">
        <div className="routes-container">
          <p>경로 정보를 불러오고 있어요...</p>
        </div>
      </main>
    );
  }


  // 현재 선택한 경로 찾기
  const selectedRoute: RouteOption | undefined =
    analysis.routes.find(
      (route) => route.id === selectedRouteId
    );


  // 사용자가 "이 경로 선택" 버튼을 누르면 실행
  const handleSelectRoute = () => {
    // 경로가 선택되지 않았다면 아무것도 하지 않음
    if (!selectedRoute) return;


    // 선택한 경로를 다음 페이지에서도 사용할 수 있도록 저장
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


        {/* 제목 */}
        <header className="routes-header">
        {/* 상단 헤더: 로고 + 홈 버튼 */}
        <div className="header-top">
            <p className="logo">ECOROUTE</p>

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

        <h1>
            경로를 <span>비교해보세요</span>
        </h1>

        <p className="description">
            이동시간과 에너지 소비량, 예상 탄소 배출량을 비교했어요.
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

          <span className="summary-arrow">↓</span>

          <div>
            <span className="summary-label">
              도착
            </span>

            <strong>
              {analysis.destination}
            </strong>
          </div>
        </section>


        {/* 지도 영역
            지금은 실제 지도 API가 없기 때문에 placeholder */}
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


        {/* 후보 경로 리스트 */}
        <section className="route-list">

          {analysis.routes.map((route) => {

            // 이 카드가 현재 선택된 카드인지 확인
            const isSelected =
              selectedRouteId === route.id;


            return (
              <button
                key={route.id}

                type="button"

                className={`route-option-card ${
                  isSelected ? "selected" : ""
                }`}

                // 카드 클릭 시 선택 경로 변경
                onClick={() =>
                  setSelectedRouteId(route.id)
                }
              >
                <div className="route-option-top">

                  <div>
                    <div className="route-name-row">

                      <strong>
                        {route.name}
                      </strong>

                      {/* AI 추천 경로라면 표시 */}
                      {route.isRecommended && (
                        <span className="eco-badge">
                          AI 추천
                        </span>
                      )}

                    </div>

                    <span className="route-time">
                      {route.durationMinutes}분 ·{" "}
                      {route.distanceKm}km
                    </span>
                  </div>


                  {/* 선택 여부 표시 */}
                  <div
                    className={`route-radio ${
                      isSelected ? "checked" : ""
                    }`}
                  />
                </div>


                {/* 에너지 / CO2 */}
                <div className="route-metrics">

                  <div>
                    <span>에너지</span>

                    <strong>
                      {route.energyConsumption}
                      {route.energyUnit}
                    </strong>
                  </div>

                  <div>
                    <span>CO₂</span>

                    <strong>
                      {route.co2Kg}kg
                    </strong>
                  </div>

                </div>
              </button>
            );
          })}

        </section>


        {/* 다음 페이지 이동 */}
        <button
          type="button"
          className="eco-button"
          onClick={handleSelectRoute}
        >
          이 경로 선택
        </button>

      </div>
    </main>
  );
}