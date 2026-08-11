"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AnalysisStatus = "loading" | "error";

const mockAnalyzeRoute = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        recommendedRoute: {
          id: "eco",
          name: "에코 루트",
          duration: 42,
          distance: 18.3,
          energy: 3.1,
          co2: 0.62,
        },

        routes: [
          {
            id: "eco",
            name: "에코 루트",
            duration: 42,
            distance: 18.3,
            energy: 3.1,
            co2: 0.62,
          },
          {
            id: "fast",
            name: "최단시간",
            duration: 36,
            distance: 21.1,
            energy: 4.8,
            co2: 0.96,
          },
          {
            id: "short",
            name: "최단거리",
            duration: 51,
            distance: 16.7,
            energy: 4.1,
            co2: 0.82,
          },
        ],
      });
    }, 2000);
  });

export default function AnalyzePage() {
  const router = useRouter();

  const [status, setStatus] =
    useState<AnalysisStatus>("loading");

  useEffect(() => {
    const analyzeRoute = async () => {
      try {
        setStatus("loading");

        // 아직 백엔드가 없기 때문에
        // 2초 후 mock 결과를 받는 것으로 가정
        const result = await mockAnalyzeRoute();

        // 다음 페이지에서 결과를 사용할 수 있도록 임시 저장
        sessionStorage.setItem(
          "routeAnalysis",
          JSON.stringify(result)
        );

        // 분석 완료 후 경로 비교 페이지로 이동
        router.push("/routes");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };

    analyzeRoute();
  }, [router]);

  return (
    <main className="analyze-page">
      <div className="analyze-container">
        {/* 상단 진행 바 */}
        <div className="progress">
          <div className="progress-active analyze-progress" />
        </div>

        {/* 제목 */}
        <header className="analyze-header">
          <p className="logo">ECOROUTE</p>

          {status === "loading" ? (
            <>
              <h1>
                가장 친환경적인
                <br />
                경로를 찾고 있어요
              </h1>

              <p className="description">
                차량과 도로 환경을 분석해 에너지 소비와
                탄소 배출이 적은 경로를 찾고 있습니다.
              </p>
            </>
          ) : (
            <>
              <h1>
                경로 분석에
                <br />
                실패했어요
              </h1>

              <p className="description">
                잠시 후 다시 시도해주세요.
              </p>
            </>
          )}
        </header>

        {/* 분석 중 화면 */}
        {status === "loading" && (
          <>
            <section className="ai-visual">
              <div className="ai-ring ai-ring-large" />
              <div className="ai-ring ai-ring-middle" />

              <div className="ai-core">
                <span>AI</span>
              </div>
            </section>

            <section className="analysis-steps">
              <div className="analysis-step active">
                <div className="step-status">
                  <span className="step-loading" />
                </div>

                <div>
                  <p className="step-title">
                    AI 에코 루트 분석 중
                  </p>

                  <p className="step-description">
                    후보 경로의 에너지 소비량과 CO₂
                    배출량을 계산하고 있어요.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 오류 발생 */}
        {status === "error" && (
          <button
            type="button"
            className="eco-button"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        )}
      </div>
    </main>
  );
}