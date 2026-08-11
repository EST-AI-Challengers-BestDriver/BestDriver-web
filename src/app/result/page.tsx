"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  RouteAnalysisResult,
  RouteOption,
} from "@/types/route";


// --------------------------------------------------
// sessionStorage에서 결과 데이터 읽기
// --------------------------------------------------

const getSavedResultData = (): {
  analysis: RouteAnalysisResult | null;
  selectedRoute: RouteOption | null;
} => {
  // Next.js는 서버에서도 렌더링될 수 있기 때문에
  // 브라우저 환경인지 먼저 확인
  if (typeof window === "undefined") {
    return {
      analysis: null,
      selectedRoute: null,
    };
  }


  // analyze 페이지에서 저장한 전체 분석 결과
  const analysisData =
    sessionStorage.getItem("routeAnalysis");


  // routes 페이지에서 사용자가 선택한 경로
  const selectedRouteData =
    sessionStorage.getItem("selectedRoute");


  // 필요한 데이터가 하나라도 없다면 null 반환
  if (!analysisData || !selectedRouteData) {
    return {
      analysis: null,
      selectedRoute: null,
    };
  }


  try {
    // JSON 문자열을 다시 객체로 변환
    return {
      analysis:
        JSON.parse(analysisData) as RouteAnalysisResult,

      selectedRoute:
        JSON.parse(selectedRouteData) as RouteOption,
    };
  } catch (error) {
    // JSON 데이터가 잘못된 경우
    console.error(
      "결과 데이터를 불러오는 중 오류가 발생했습니다.",
      error
    );

    return {
      analysis: null,
      selectedRoute: null,
    };
  }
};


// --------------------------------------------------
// Result Page
// --------------------------------------------------

export default function ResultPage() {
  const router = useRouter();


  // 페이지가 처음 만들어질 때
  // sessionStorage에서 데이터를 한 번만 읽어옴
  const [savedData] =
    useState(getSavedResultData);


  // 전체 분석 결과
  const analysis =
    savedData.analysis;


  // 사용자가 선택한 경로
  const selectedRoute =
    savedData.selectedRoute;


  // 필요한 데이터가 없으면 홈으로 이동
  useEffect(() => {
    if (!analysis || !selectedRoute) {
      router.replace("/");
    }
  }, [analysis, selectedRoute, router]);


  // 데이터가 없는 동안 보여주는 화면
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

  /*
    현재는 사용자가 선택한 경로가 아닌
    첫 번째 경로를 비교 기준으로 사용.

    나중에는 백엔드에서

    baselineRouteId
    fastestRouteId

    같은 값을 내려주는 방식으로 변경 가능.
  */

  const baselineRoute =
    analysis.routes.find(
      (route) =>
        route.id !== selectedRoute.id
    ) ?? analysis.routes[0];


  // 혹시 경로 배열 자체가 비어있는 경우 방어
  if (!baselineRoute) {
    return (
      <main className="result-page">
        <div className="result-container">
          비교할 경로 데이터가 없습니다.
        </div>
      </main>
    );
  }


  // --------------------------------------------------
  // 절감 효과 계산
  // --------------------------------------------------

  // CO₂ 절감량
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


  // CO₂ 절감률
  const co2SavingRate =
    baselineRoute.co2Kg > 0
      ? (
          (co2Saving /
            baselineRoute.co2Kg) *
          100
        ).toFixed(1)
      : "0";


  // --------------------------------------------------
  // 새로운 탐색
  // --------------------------------------------------

  const handleNewSearch = () => {
    // 기존 분석 결과 삭제
    sessionStorage.removeItem(
      "routeAnalysis"
    );

    // 기존 선택 경로 삭제
    sessionStorage.removeItem(
      "selectedRoute"
    );

    // 홈으로 이동
    router.push("/");
  };


  return (
    <main className="result-page">
      <div className="result-container">

        {/* 진행바 */}
        <div className="progress">
          <div className="progress-active result-progress" />
        </div>


        {/* Header */}
        <header className="result-header">

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


          <h1>
            더 친환경적인
            <br />
            이동을 선택했어요
          </h1>


          <p className="description">
            선택한 경로의 예상 절감 효과입니다.
          </p>

        </header>


        {/* CO₂ 절감 결과 */}
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

          {/* 에너지 절감 */}
          <div className="result-metric-card">

            <span>
              에너지 절감
            </span>

            <strong>
              {energySaving.toFixed(1)}
              {selectedRoute.energyUnit}
            </strong>

          </div>


          {/* 이동 거리 */}
          <div className="result-metric-card">

            <span>
              이동 거리
            </span>

            <strong>
              {selectedRoute.distanceKm}km
            </strong>

          </div>


          {/* 예상 시간 */}
          <div className="result-metric-card">

            <span>
              예상 시간
            </span>

            <strong>
              {selectedRoute.durationMinutes}분
            </strong>

          </div>


          {/* 예상 CO₂ */}
          <div className="result-metric-card">

            <span>
              예상 CO₂
            </span>

            <strong>
              {selectedRoute.co2Kg}kg
            </strong>

          </div>

        </section>


        {/* 경로 비교 */}
        <section className="result-comparison">

          <h2>
            경로 비교
          </h2>


          {/* 선택 경로 */}
          <div className="comparison-row">

            <span>
              {selectedRoute.name}
            </span>

            <strong>
              {selectedRoute.co2Kg}kg
            </strong>

          </div>


          {/* 비교 기준 경로 */}
          <div className="comparison-row">

            <span>
              {baselineRoute.name}
            </span>

            <strong>
              {baselineRoute.co2Kg}kg
            </strong>

          </div>

        </section>


        {/* 새로운 경로 탐색 */}
        <button
          type="button"
          className="eco-button"
          onClick={handleNewSearch}
        >
          새로운 경로 탐색
        </button>

      </div>
    </main>
  );
}