# Render 배포 체크리스트

## 현재 구조 판단

| 항목 | 결과 |
| --- | --- |
| 구조 유형 | 루트 Express + `frontend` React 구조 |
| 추천 배포 방식 | Render Web Service 단일 배포 |
| Express 진입 파일 | `server.js` |
| React 프로젝트 | `frontend/` |
| React 빌드 출력 | `frontend/dist/` |

## 1. 코드 점검 항목

- [x] Express 서버가 `process.env.PORT || 3000`을 사용한다.
- [x] API 라우트가 React fallback보다 먼저 등록되어 있다.
- [x] Express가 `frontend/dist`를 정적 파일로 제공한다.
- [x] React 새로고침 404 방지를 위한 fallback이 있다.
- [x] CRUD 기능 로직은 변경하지 않았다.
- [x] UI 디자인은 이번 단계에서 변경하지 않았다.

## 2. package.json 점검 항목

| 위치 | 항목 | 상태 |
| --- | --- | --- |
| 루트 `package.json` | `start` 스크립트 | `npm start`로 `node server.js` 실행 |
| 루트 `package.json` | `build` 스크립트 | `frontend` devDependencies 포함 설치 및 Vite 빌드 실행 |
| 루트 `package.json` | `engines` | Node.js `20.19` 이상 사용 |
| `frontend/package.json` | `build` 스크립트 | `vite build` 실행 |
| `frontend/package.json` | `test` 스크립트 | 없음, CI에서 건너뜀 |

## 3. API 경로 점검 항목

- [x] React API 호출은 `/api/...` 상대 경로를 사용한다.
- [x] React 코드에 배포용 `localhost` API 호출이 없다.
- [x] Vite 개발 서버에서는 `/api` 프록시가 `http://localhost:3000`으로 연결된다.
- [x] 배포 환경에서는 Express가 `/api/cars`를 직접 제공한다.
- [x] 기존 Express API 경로인 `/cars`는 유지된다.

## 4. 환경변수 점검 항목

| 파일 또는 위치 | 상태 |
| --- | --- |
| `.env.example` | `NODE_ENV`, `PORT`, MongoDB Atlas 환경변수 예시 작성 |
| `.env` | 커밋 금지 |
| `.gitignore` | `.env`, `.env.*`, `node_modules`, `dist`, 로그 파일 제외 |
| Render Environment | `NODE_ENV=production`, `MONGODB_URI`, `DB_NAME`, 컬렉션 이름 등록 필요. DNS 문제가 있으면 `MONGODB_DNS_SERVERS` 선택 등록 |
| GitHub Secrets | `RENDER_DEPLOY_HOOK_URL` 필요 |

## 5. GitHub Actions 점검 항목

- [x] `.github/workflows/deploy.yml` 파일이 있다.
- [x] workflow 이름은 `CI/CD Deploy to Render`이다.
- [x] `main` 브랜치 push 시 실행된다.
- [x] `workflow_dispatch`로 수동 실행할 수 있다.
- [x] Node.js 20을 사용한다.
- [x] 루트와 `frontend` 의존성을 설치한다.
- [x] 테스트 스크립트가 없으면 건너뛴다.
- [x] `npm run build`를 실행한다.
- [x] 빌드 성공 후 Render Deploy Hook을 호출한다.
- [x] Deploy Hook URL은 `RENDER_DEPLOY_HOOK_URL` Secret을 사용한다.

## 6. Render 설정 점검 항목

| 항목 | 설정값 |
| --- | --- |
| Service Type | Web Service |
| Runtime | Node |
| Node Version | `20.19` 이상 |
| Branch | `main` |
| Root Directory | 비워둠 또는 루트 |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Publish Directory | 불필요 |
| Auto-Deploy | Off 권장 |

Render Auto-Deploy를 켜면 GitHub Actions Deploy Hook 방식과 중복될 수 있다.
이 프로젝트에서는 GitHub Actions 빌드 성공 후 Deploy Hook을 호출하는 방식을 권장한다.

## 7. 배포 후 테스트 항목

- [ ] Render URL 접속 시 React 화면이 보인다.
- [ ] `GET /api/cars`가 자동차 목록 JSON을 반환한다.
- [ ] Render Logs에 `MongoDB connected: car_market` 메시지가 보인다.
- [ ] 자동차 등록 기능이 동작한다.
- [ ] 자동차 수정 기능이 동작한다.
- [ ] 자동차 삭제 기능이 동작한다.
- [ ] 새로고침해도 React 화면이 유지된다.
- [ ] Render Logs에 포트 오류가 없다.
- [ ] GitHub Actions 실행 결과가 성공이다.

## 8. 문제 발생 시 확인 순서

1. GitHub Actions 로그에서 `npm ci` 실패 여부를 확인한다.
2. GitHub Actions 로그에서 `npm run build` 실패 여부를 확인한다.
3. `RENDER_DEPLOY_HOOK_URL` Secret 이름과 값이 맞는지 확인한다.
4. Render Build Command가 `npm install && npm run build`인지 확인한다.
5. Render Start Command가 `npm start`인지 확인한다.
6. Render Logs에서 `PORT` 관련 오류가 있는지 확인한다.
7. React에서 API를 `/api/...`로 호출하는지 확인한다.
8. Express fallback이 API 라우트보다 뒤에 있는지 확인한다.

## 실행 확인 결과

| 명령어 | 결과 |
| --- | --- |
| `npm run build` | 성공 |
| `PORT=3100 node server.js` | 성공 |
| `GET /` | `200` 응답 |
| `GET /api/cars` | 자동차 목록 JSON 응답 |

`frontend` 의존성 검사 결과 moderate 취약점 2개가 보고되었다.
이번 단계는 배포 및 CI/CD 준비가 목적이므로 강제 업데이트는 실행하지 않았다.
