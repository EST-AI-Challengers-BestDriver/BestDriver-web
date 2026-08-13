"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VehicleType = "트럭" | "승용" | "SUV";
type ThemeType = "light" | "dark";

const vehicleEmoji: Record<VehicleType, string> = {
  트럭: "🚚",
  승용: "🚗",
  SUV: "🚙",
};

const vehicleTypes: VehicleType[] = ["트럭", "승용", "SUV"];

export default function HomePage() {
  const router = useRouter();

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("트럭");
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);
  const [departureTime, setDepartureTime] = useState("");
  const [theme, setTheme] = useState<ThemeType>("dark");

  const handleThemeToggle = () => {
    const nextTheme: ThemeType = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSearch = () => {
    if (!start.trim() || !destination.trim() || !departureTime) return;

    sessionStorage.setItem(
      "routeSearch",
      JSON.stringify({
        start: start.trim(),
        destination: destination.trim(),
        vehicleType: vehicle,
        departureTime,
      })
    );

    router.push("/analyze");
  };

  const canSearch =
    Boolean(start.trim()) &&
    Boolean(destination.trim()) &&
    Boolean(departureTime);

  return (
    <main className="route-page">
      <div className="route-container">
        <div className="progress">
          <div className="progress-active" />
        </div>

        <header className="route-header">
          <div className="header-top">
            <p className="logo">ECOROUTE</p>

            <button
              type="button"
              className={`theme-toggle ${theme}`}
              onClick={handleThemeToggle}
              aria-label={
                theme === "dark"
                  ? "라이트 모드로 변경"
                  : "다크 모드로 변경"
              }
              aria-pressed={theme === "light"}
            >
              <span className="theme-toggle-icon" aria-hidden="true">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </button>
          </div>

          <h1>
            어디로 <span>가시나요?</span>
          </h1>

          <p className="description">
            친환경 경로를 분석해 최적의 이동 경로를 추천해드려요.
          </p>
        </header>

        <div className="search-option-grid">
          <div className="vehicle-select-wrap">
            <button
              type="button"
              className="vehicle-card"
              onClick={() => setIsVehicleOpen((prev) => !prev)}
              aria-expanded={isVehicleOpen}
            >
              <div className="vehicle-left">
                <div className="vehicle-icon" aria-hidden="true">
                  {vehicleEmoji[vehicle]}
                </div>

                <div>
                  <span className="card-label">내 차량</span>
                  <p className="vehicle-name">{vehicle}</p>
                </div>
              </div>

              <span className={`arrow ${isVehicleOpen ? "open" : ""}`}>
                ›
              </span>
            </button>

            {isVehicleOpen && (
              <div className="vehicle-dropdown">
                {vehicleTypes.map((type) => (
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
                    <span className="vehicle-dropdown-left">
                      <span
                        className="vehicle-dropdown-icon"
                        aria-hidden="true"
                      >
                        {vehicleEmoji[type]}
                      </span>
                      <span>{type}</span>
                    </span>

                    {vehicle === type && (
                      <span className="vehicle-dropdown-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="time-card" htmlFor="departureTime">
            <span className="time-icon" aria-hidden="true">
              ◷
            </span>

            <span className="time-content">
              <span className="card-label">출발 시간</span>
              <span
                className={`time-value ${
                  departureTime ? "" : "placeholder"
                }`}
              >
                {departureTime || "시간을 선택하세요"}
              </span>
            </span>

            <span className="time-arrow" aria-hidden="true">
              ›
            </span>

            <input
              id="departureTime"
              className="time-picker-input"
              type="time"
              min="00:00"
              max="23:59"
              step="60"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              aria-label="출발 시간 선택"
            />
          </label>
        </div>

        <section className="location-card">
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
                autoComplete="street-address"
              />
            </div>

            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
          </div>

          <div className="location-divider" />

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
                autoComplete="street-address"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSearch) {
                    handleSearch();
                  }
                }}
              />
            </div>

            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
          </div>
        </section>

        <button
          type="button"
          className="eco-button"
          onClick={handleSearch}
          disabled={!canSearch}
        >
          에코 루트 탐색
        </button>
      </div>
    </main>
  );
}