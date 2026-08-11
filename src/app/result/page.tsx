"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import type {
  RouteAnalysisResult,
  RouteOption,
} from "@/types/route";


export default function ResultPage() {
  const router = useRouter();


  // 전체 분석 결과
  const [analysis, setAnalysis] =
    useState<RouteAnalysisResult | null>(null);


  // 사용자가 선택한 경로
  const [selectedRoute, setSelectedRoute] =
    useState<RouteOption | null>(null);


  // 페이지 최초 실행
  useEffect(() => {
    // 전체 분석 데이터
    const analysisData =
      sessionStorage.getItem("routeAnalysis");


    // 사용자가 선택한 경로
    const selectedData =
      sessionStorage.getItem("selectedRoute");


    // 필요한 데이터가 없다면 홈으로 이동
    if (!analysisData || !selectedData) {
      router.replace("/");
      return;
    }


    // JSON 문자열 → 객체
    setAnalysis(
      JSON.parse(analysisData)
    );

    setSelectedRoute(
      JSON.parse(selectedData)
    );
  }, [router]);


  // 데이터 불러오는 중
  if (!analysis || !selectedRoute) {
    return (
      <main className="result-page">
        <div className="result-container">
          결과를 불러오고 있어요...
        </div>
      </main>
    );
  }


  // --------------------------------------------------
  // 비교 기준 경로
  // --------------------------------------------------
  //
  // 현재는 선택한 경로가 아닌 첫 번째 경로를
  // 비교 대상으로 임시 사용합니다.
  //
  // 나중에는 백엔드에서
  // baselineRouteId 또는 fastestRouteId 등을
  // 내려주는 형태로 변경하는 것이 좋습니다.

  const baselineRoute =
    analysis.routes.find(
      (route) =>
        route.id !== selectedRoute.id
    ) ?? analysis.routes[0];


  // --------------------------------------------------
  // 절감 효과 계산
  // --------------------------------------------------

  // CO2 절감량
  const co2Saving = Math.max(
    0,
    baselineRoute.co2Kg -
      selectedRoute.co2Kg
  );


  // 에너지 절감량
  const energySaving = Math.max(
    0,
    baselineRoute.energyConsumption -
      selectedRoute.energyConsumption
  );


  // CO2 절감률
  const co2SavingRate =
    baselineRoute.co2Kg > 0
      ? (
          (co2Saving /
            baselineRoute.co2Kg) *
          100
        ).toFixed(1)
      : "0";


  return (
    <main className="result-page">
      <div className="result-container">

        {/* 진행바 */}
        <div className="progress">
          <div className="progress-active result-progress" />
        </div>


        {/* Header */}
        <header className="result-header">
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
                더 친환경적인
                <br />
                이동을 선택했어요
            </h1>

            <p className="description">
                선택한 경로의 예상 절감 효과입니다.
            </p>
            </header>


        {/* 가장 중요한 CO2 절감 결과 */}
        <section className="main-saving-card">

          <span>
            예상 CO₂ 절감량
          </span>

          <strong>
            {co2Saving.toFixed(2)}
            <small> kg</small>
          </strong>

          <p>
            기준 경로 대비 {co2SavingRate}% 절감
          </p>

        </section>


        {/* 상세 지표 */}
        <section className="result-metrics">

          <div className="result-metric-card">

            <span>
              에너지 절감
            </span>

            <strong>
              {energySaving.toFixed(1)}
              {selectedRoute.energyUnit}
            </strong>

          </div>


          <div className="result-metric-card">

            <span>
              이동 거리
            </span>

            <strong>
              {selectedRoute.distanceKm}
              km
            </strong>

          </div>


          <div className="result-metric-card">

            <span>
              예상 시간
            </span>

            <strong>
              {selectedRoute.durationMinutes}
              분
            </strong>

          </div>


          <div className="result-metric-card">

            <span>
              예상 CO₂
            </span>

            <strong>
              {selectedRoute.co2Kg}
              kg
            </strong>

          </div>

        </section>


        {/* 경로 비교 */}
        <section className="result-comparison">

          <h2>
            경로 비교
          </h2>


          <div className="comparison-row">

            <span>
              {selectedRoute.name}
            </span>

            <strong>
              {selectedRoute.co2Kg}kg
            </strong>

          </div>


          <div className="comparison-row">

            <span>
              {baselineRoute.name}
            </span>

            <strong>
              {baselineRoute.co2Kg}kg
            </strong>

          </div>

        </section>


        {/* 처음으로 돌아가기 */}
        <button
          type="button"
          className="eco-button"
          onClick={() => {
            // 현재 세션 데이터 초기화
            sessionStorage.removeItem(
              "routeAnalysis"
            );

            sessionStorage.removeItem(
              "selectedRoute"
            );

            // 첫 페이지 이동
            router.push("/");
          }}
        >
          새로운 경로 탐색
        </button>

      </div>
    </main>
  );
}