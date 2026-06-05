# 2026-06-05 1단계 서버 구조 정리

## 작업 개요

`docs/실시간_Car_Market_향후_개발_계획서.md`의 `9.1 1단계: 서버 구조 정리` 항목을 기준으로 서버 API 구조를 신규 요구사항에 맞게 정리했다.

## 작업 전 확인

| 항목 | 확인 내용 |
| --- | --- |
| 현재 브랜치 | `main` |
| 작업 전 변경 상태 | 미커밋 변경 없음 |
| 추천 작업 브랜치 | `feature/server-phase1-structure` |
| 기준 문서 | `docs/실시간_Car_Market_향후_개발_계획서.md`, `docs/실시간_Car_Market_서비스_요구사항_정의서.md`, `docs/requirements.md`, `docs/progress.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`, `.github/workflows/deploy.yml` |

## 작업 목적

- 자동차 API를 신규 요구사항 기준인 `/api/cars` 중심으로 정리한다.
- MongoDB Atlas 연동 전까지 기존 메모리 배열 데이터를 seed/fallback 용도로 유지한다.
- React 정적 파일 제공과 React fallback 순서가 깨지지 않게 유지한다.
- 기존 빌드 흐름이 계속 성공하는지 확인한다.

## 변경 파일

| 파일 | 변경 내용 |
| --- | --- |
| `server.js` | 자동차 CRUD 라우트를 `express.Router()`로 분리하고 `/api/cars`에 직접 등록 |
| `frontend/vite.config.js` | Vite 개발 프록시가 `/api` 경로를 제거하지 않고 그대로 Express 서버에 전달하도록 수정 |
| `frontend/src/App.jsx` | `/api/cars` 요청 설명 주석을 현재 구조에 맞게 수정 |
| `docs/progress.md` | 1단계 서버 구조 정리 진행 기록 추가 |

## 상세 작업 내용

- `server.js`에서 `/api` 접두사를 제거하던 우회 미들웨어를 삭제했다.
- 기존 개별 `/cars` 라우트를 `carsRouter`로 묶었다.
- `carsRouter`를 `/api/cars`에 등록해 신규 요구사항 API 경로를 서버에서 직접 처리하도록 정리했다.
- 기존 CRUD 화면이나 테스트가 당장 깨지지 않도록 `/cars` 라우트도 호환용으로 유지했다.
- 메모리 자동차 데이터가 MongoDB 연동 전 임시 데이터임을 주석으로 명시했다.
- Vite 개발 프록시의 `rewrite` 설정을 제거해 `/api/cars` 요청이 그대로 백엔드로 전달되도록 했다.

## 검증 결과

| 검증 항목 | 결과 |
| --- | --- |
| `node --check server.js` | 성공 |
| `npm.cmd run build` | 성공 |
| 임시 서버 실행 후 API 호출 | 사용자 실행 승인 거절로 미진행 |

## 확인된 참고 사항

- `npm.cmd run build` 중 기존과 동일하게 `frontend` 의존성 moderate 취약점 2건이 보고되었다.
- daisyUI는 아직 사용 중이다. 이번 단계는 서버 구조 정리가 목적이므로 UI 의존성 제거는 진행하지 않았다.
- `docs/requirements.md`는 기존 `/cars` API 유지를 전제로 하지만, 신규 계획서와 AGENTS 기준은 `/api/cars` 정리이므로 신규 요구사항을 우선했다.

## 다음 단계

1. MongoDB Atlas 연동 단계에서 `mongodb`, `dotenv` 의존성을 추가한다.
2. MongoDB 연결 파일을 분리한다.
3. 차량 CRUD 저장소를 메모리 배열에서 MongoDB `cars` 컬렉션으로 전환한다.
4. 프론트엔드와 문서가 완전히 `/api/cars` 기준으로 정리되면 `/cars` 호환 라우트 제거 여부를 검토한다.

