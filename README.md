# EcoRoute (에코루트)

ESTsoft AI Challengers 최종 해커톤을 위한 친환경 경로 추천 데모입니다. 앤아버 도로망에서 여러 경로를 생성하고, 시간대별 교통 상태·도로 길이·경사도·차량 조건을 DNN에 입력해 경로별 에너지 소비량과 직접 배기관 탄소배출량을 비교합니다.

현재 공개 기준은 **체크포인트 3 (Ann Arbor 데모)** 입니다.

## 실행

Python 3.14 환경에서 프로젝트 최상단의 실행 파일을 사용합니다.

```powershell
python -m pip install -r requirements.txt
python serve_demo.py
```

브라우저가 열리지 않으면 `http://127.0.0.1:8000`으로 접속합니다.
지도 화면은 Leaflet CDN과 OpenStreetMap 타일을 사용하므로 데모 실행 중 인터넷 연결이 필요합니다.

## 프론트엔드·백엔드 인계 구조

```text
EcoRoute/
├─ .github/workflows/
│  └─ pipeline.yml
├─ config/
│  └─ demo_runtime.json
├─ data/processed/
│  ├─ README.md
│  ├─ preprocessing_manifest.json
│  ├─ preprocessing_summary.json
│  ├─ maps/ann_arbor/
│  │  ├─ ann_arbor_drive_enriched.graphml
│  │  └─ metadata.json
│  └─ traffic/ann_arbor/
│     └─ edge_hourly_profiles.csv.gz
├─ models/dnn/
│  └─ best_model.pt
├─ models/baseline/
│  └─ *.joblib
├─ results/
│  ├─ baseline/
│  │  ├─ figures/
│  │  ├─ learning_curve.csv
│  │  ├─ metrics.csv
│  │  ├─ split_summary.csv
│  │  └─ training_config.json
│  └─ dnn/
│     ├─ figures/
│     ├─ metrics.csv
│     ├─ split_summary.csv
│     ├─ training_config.json
│     └─ training_history.csv
├─ scripts/
├─ src/ecoroute/
├─ tests/
├─ web/
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
├─ deploy/
│  └─ compose.yml
├─ build_traffic.py
├─ predict_routes.py
├─ prepare_map.py
├─ preprocess.py
├─ route.py
├─ serve_demo.py
├─ train.py
├─ train_dnn.py
├─ Dockerfile
├─ requirements.txt
├─ .gitignore
└─ README.md
```

백엔드 실행에 필수인 세 가지 산출물은 다음과 같습니다.

- `models/dnn/best_model.pt`: 학습된 에너지 소비 예측 DNN 가중치
- `data/processed/maps/ann_arbor/ann_arbor_drive_enriched.graphml`: 도로·길이·제한속도·고도가 포함된 앤아버 그래프
- `data/processed/traffic/ann_arbor/edge_hourly_profiles.csv.gz`: 도로별 24시간 교통 프로필의 GitHub 업로드용 압축본

`src/ecoroute/`는 전처리, 지도 준비, 경로 탐색, 교통 프로필, DNN 추론, 탄소 환산 및 데모 API 전체 구현입니다. `web/`는 HTML/CSS/JavaScript 프론트엔드이며, `serve_demo.py`가 정적 파일과 API를 함께 제공합니다.

## GitHub에 올리지 않는 항목

`.gitignore`는 아래 로컬 자산을 제외합니다.

- `data/raw/`: eVED/VED 원본 데이터
- `data/cache/`: 도로 매칭 등 재생성 가능한 중간 캐시
- 학습용 세그먼트·trip profile·감사 결과(전처리 설명과 요약 JSON은 유지)
- Washtenaw County 지도 및 교통 데이터(다음 확장 단계)
- 압축 전 78MB 교통 CSV
- 수십 MB짜리 행별 예측 CSV, 실행 시 재생성되는 경로 결과 및 Python 캐시
- 개인 VS Code 설정과 가상환경

GitHub 웹의 **Add file**은 `.gitignore`를 자동으로 적용해 주지 않으므로, 수동 업로드할 때는 위 인계 구조에 표시된 파일과 폴더만 선택해야 합니다. 특히 `edge_hourly_profiles.csv`가 아니라 `edge_hourly_profiles.csv.gz`를 올립니다.

## 검증 및 CI/CD

로컬 테스트는 별도 테스트 프레임워크 없이 실행할 수 있습니다.

```powershell
Get-ChildItem tests/test_*.py | ForEach-Object { python $_.FullName }
```

`.github/workflows/pipeline.yml`은 pull request와 `main` 브랜치 push에서 다음을 수행합니다.

1. Python 3.14 의존성 설치, 문법 검사, 테스트 및 웹 서버 스모크 테스트
2. `main` 검증 성공 시 Python EcoRoute 컨테이너를 GHCR에 `sha-<commit>`과 `latest` 태그로 발행
3. 저장소 변수 `EC2_CD_ENABLED`가 `true`이면 기존 AWS SSM 경로로 EC2에 배포

컨테이너는 3000번 포트에서 실행되며 `/api/health`를 헬스체크에 사용합니다.

```powershell
docker build -t ecoroute .
docker run --rm -p 3000:3000 ecoroute
```

## 모델 출력 범위

현재 탄소 환산은 휘발유 에너지 33.7 kWh/US gal과 직접 배기관 배출 8.887 kg CO2/US gal을 사용합니다. 연료 생산·정제·운송과 차량 제조 배출량은 포함하지 않습니다.

## 데이터 출처

- [Vehicle Energy Dataset (VED)](https://github.com/gsoh/VED)
- [Extended Vehicle Energy Dataset (eVED)](https://bitbucket.org/datarepo/eved-dataset/src/main/)
- [OpenStreetMap](https://www.openstreetmap.org/copyright) 도로 데이터
