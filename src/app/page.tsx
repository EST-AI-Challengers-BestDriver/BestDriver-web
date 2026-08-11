"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");

  type VehicleType = "트럭" | "승용" | "SUV";

  const [vehicle, setVehicle] = useState<VehicleType>("트럭");
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);

  const vehicleEmoji: Record<VehicleType, string> = {
    트럭: "🚚",
    승용: "🚗",
    SUV: "🚙",
  };

  const handleSearch = () => {
    if (!start.trim() || !destination.trim()) return;

    router.push("/analyze");
  };

  return (
    <main className="route-page">
      <div className="route-container">
        <div className="progress">
          <div className="progress-active" />
        </div>

        <header className="route-header">
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

          {/* 페이지 제목 */}
          <h1>
            어디로 <span>가시나요?</span>
          </h1>

          <p className="description">
            친환경 경로를 분석해 최적의 이동 경로를 추천해드려요.
          </p>
        </header>

        {/* 차량 선택 */}
        <div className="vehicle-select-wrap">
          <button
            type="button"
            className="vehicle-card"
            onClick={() => setIsVehicleOpen((prev) => !prev)}
          >
            <div className="vehicle-left">
              <div className="vehicle-icon">
                {vehicleEmoji[vehicle]}
              </div>

              <div>
                <p className="card-label">내 차량</p>
                <p className="vehicle-name">{vehicle}</p>
              </div>
            </div>

            <span className={`arrow ${isVehicleOpen ? "open" : ""}`}>
              ›
            </span>
          </button>

  {isVehicleOpen && (
    <div className="vehicle-dropdown">
      {(["트럭", "승용", "SUV"] as VehicleType[]).map((type) => (
        <button
          key={type}
          type="button"
          className={`vehicle-dropdown-item ${
            vehicle === type ? "selected" : ""
          }`}
          onClick={() => {
            setVehicle(type);
            setIsVehicleOpen(false);
          }}
        >
          <div className="vehicle-dropdown-left">
            <span className="vehicle-dropdown-icon">
              {vehicleEmoji[type]}
            </span>

            <span>{type}</span>
          </div>

          {vehicle === type && (
            <span className="vehicle-dropdown-check">✓</span>
          )}
        </button>
      ))}
    </div>
  )}
</div>

        {/* 주소 입력 */}
        <section className="location-card">
          {/* 출발지 */}
          <div className="location-row">
            <div className="location-marker start-marker" />

            <div className="location-content">
              <label htmlFor="start" className="card-label">
                출발지
              </label>

              <input
                id="start"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="출발지를 입력하세요"
              />
            </div>

            <span className="search-icon">⌕</span>
          </div>

          <div className="location-divider" />

          {/* 목적지 */}
          <div className="location-row">
            <div className="location-marker destination-marker" />

            <div className="location-content">
              <label htmlFor="destination" className="card-label">
                목적지
              </label>

              <input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="목적지를 입력하세요"
              />
            </div>

            <span className="search-icon">⌕</span>
          </div>
        </section>

        <button
          type="button"
          className="eco-button"
          onClick={handleSearch}
          disabled={!start.trim() || !destination.trim()}
        >
          에코 루트 탐색
        </button>
      </div>

    </main>
  );
}