# Render 배포 전 점검 문서

## 현재 프로젝트 구조 요약

| 구분 | 위치 | 설명 |
| --- | --- | --- |
| Express 서버 | `server.js` | 자동차 REST API와 서버 실행 진입 파일 |
| React 프론트엔드 | `frontend/` | Vite 기반 React 프로젝트 |
| 프론트엔드 빌드 결과 | `frontend/dist/` | `npm run build --prefix frontend` 실행 시 생성 |
| 문서 | `docs/` | 요구사항, 와이어프레임, 진행 기록, 배포 점검 문서 |

현재 프로젝트는 루트에 Express 서버가 있고, `frontend` 폴더에 React 프로젝트가 분리된 구조이다.
Render에서는 루트 프로젝트를 Web Service로 배포하고, 빌드 단계에서 React를 빌드한 뒤 Express가 정적 파일을 제공하는 방식이 가장 단순하다.

## Render 배포 가능 여부

현재 단계에서 Render 단일 Web Service 배포가 가능하도록 최소 설정을 보완했다.

| 항목 | 점검 결과 |
| --- | --- |
| 서버 포트 | `process.env.PORT || 3000` 구조로 보완 |
| 서버 실행 | 루트 `npm start`로 실행 가능 |
| React 빌드 | 루트 `npm run build`에서 `frontend` 빌드 실행 |
| 정적 파일 제공 | Express가 `frontend/dist`를 정적 파일로 제공 |
| API 경로 | React의 `/api/...` 요청을 기존 `/cars...` API로 연결 |
| 환경변수 예시 | `.env.example` 생성 |
| `.gitignore` | `node_modules`, `.env`, `dist`, 로그 파일 제외 확인 |

## 필요한 수정 사항

| 항목 | 필요 여부 | 이유 |
| --- | --- | --- |
| `process.env.PORT` 적용 | 필요 | Render는 실행 포트를 환경변수로 제공한다. |
| 루트 build 스크립트 추가 | 필요 | Render Build Command를 단순하게 지정하기 위해 필요하다. |
| React 정적 파일 제공 | 필요 | Render 단일 Web Service에서 React 화면을 제공하기 위해 필요하다. |
| `/api` 요청 연결 | 필요 | Vite 프록시는 개발 서버에서만 동작하므로 배포 환경 보완이 필요하다. |
| GitHub Actions 생성 | 불필요 | 이번 단계는 CI/CD 구성 전 점검 단계이다. |

## 실제 수정한 사항

- `server.js`에 `process.env.PORT || 3000` 적용
- `server.js`에 `/api` 요청을 기존 API 경로로 연결하는 미들웨어 추가
- `server.js`에 `frontend/dist` 정적 파일 제공 설정 추가
- 루트 `package.json`에 `build` 스크립트 추가
- `.env.example` 생성
- `docs/deploy-checklist.md` 작성
- `docs/progress.md`에 이번 작업 내용 추가

## 수정하지 않은 사항과 이유

| 항목 | 이유 |
| --- | --- |
| CRUD 데이터 구조 | 배포 점검 범위가 아니며 기존 기능을 유지해야 한다. |
| React UI 디자인 | 이전 단계에서 완료했고 이번 단계는 배포 구조 점검이 목적이다. |
| GitHub Actions 파일 | 이번 단계에서는 CI/CD 구성 전 점검만 수행한다. |
| 실제 Render 배포 | 사용자가 아직 실제 배포를 요청하지 않았다. |
| 데이터베이스 연동 | 과제 범위에서 메모리 데이터 기반 CRUD로 진행 중이다. |

## Render 설정 예상값

| 항목 | 예상값 |
| --- | --- |
| Service Type | Web Service |
| Root Directory | 비워둠 또는 루트 디렉터리 |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Publish Directory | 별도 지정 불필요 |
| Node Version | Render 기본 Node.js 또는 필요 시 환경변수로 지정 |

### Environment Variables

| 이름 | 예시 | 설명 |
| --- | --- | --- |
| `PORT` | Render 자동 제공 | Express 서버 포트 |

현재 프로젝트에는 민감한 환경변수가 필요하지 않다.
실제 `.env` 파일은 `.gitignore`에 포함되어 있으므로 커밋하지 않는다.

## 배포 전 체크리스트

- [x] 루트에서 `npm install` 실행 가능
- [x] 루트에서 `npm run build` 성공
- [x] 루트에서 서버 실행 가능
- [x] `frontend/dist` 생성 후 Express가 React 화면 제공
- [x] `/api/cars` 요청이 자동차 목록을 응답
- [x] `/cars` 기존 API 경로도 유지
- [x] `.env` 파일이 커밋되지 않음
- [x] Render Build Command와 Start Command 확인

## 실행 확인 결과

| 명령어 | 결과 |
| --- | --- |
| `npm run build` | 성공 |
| `PORT=3100 node server.js` | 성공 |
| `GET /` | `200` 응답 |
| `GET /api/cars` | 자동차 목록 JSON 응답 |

`frontend` 의존성 검사 결과 moderate 취약점 2개가 보고되었다.
이번 단계는 배포 구조 점검이 목적이므로 `npm audit fix --force`는 실행하지 않았다.

## GitHub Actions CI/CD 구성 전 확인할 점

- 루트와 `frontend` 의존성 설치 방식을 명확히 정한다.
- CI에서는 루트 `npm install` 후 루트 `npm run build`를 실행하면 된다.
- 배포 자동화는 Render GitHub 연동 또는 Deploy Hook 중 하나를 선택한다.
- CI/CD 파일 생성 전 Render 서비스 생성 방식과 브랜치 이름을 확정한다.
- 테스트 스크립트가 아직 없으므로 초기 CI는 빌드 검증 중심으로 구성한다.

## 다음 단계 제안

1. 루트에서 `npm run build`와 `npm start`를 실행해 통합 구조를 확인한다.
2. Render Web Service를 생성하고 예상 설정값을 입력한다.
3. 배포 후 Render URL에서 React 화면과 `/api/cars` 응답을 확인한다.
4. Render 설정이 확정되면 GitHub Actions 워크플로우를 작성한다.
