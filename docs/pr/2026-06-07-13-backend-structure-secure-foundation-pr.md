# PR: 백엔드 구조 분리와 보안 기반 리팩토링

## PR 제목

```text
refactor: 백엔드 구조 분리와 보안 기반 정리
```

## 작업 배경

초기 과제 구조에서는 루트 `server.js` 하나로 Express API와 React 정적 파일 제공을 함께 처리했다.
이후 MongoDB Atlas, Firebase Authentication, 차량 사진 업로드, Socket.io 상담, 관리자 기능이 추가되면서 루트 서버 파일이 커졌고, 시큐어 코딩을 적용하기 전에 백엔드 경계를 먼저 정리할 필요가 생겼다.

이번 작업은 Render Web Service 단일 배포 구조를 유지하면서 서버 진입 파일과 DB 연결 파일을 `backend/` 아래로 옮기고, 경로/업로드 설정을 분리하는 데 집중했다.

## 변경 내용

### 백엔드 폴더 구조

- `server.js`를 `backend/server.js`로 이동했다.
- `db.js`를 `backend/db.js`로 이동했다.
- 루트 `package.json`의 `main`, `start`를 새 서버 경로로 변경했다.
- `backend/package.json`은 추가하지 않고 루트 통합 package 구조를 유지했다.

### 경로와 업로드 설정

- `backend/config/paths.js`를 추가해 루트 경로, `frontend/dist`, `uploads/` 경로를 관리한다.
- `backend/config/upload.js`를 추가해 `multer` 설정과 업로드 에러 처리를 분리했다.
- 업로드 저장 위치는 기존 루트 `uploads/`를 유지했다.
- React 빌드 결과는 기존처럼 `frontend/dist`에서 제공한다.

### 문서 갱신

- README에 현재 서버 진입 파일이 `backend/server.js`임을 반영했다.
- 배포 가이드와 체크리스트를 `backend` Express + `frontend` React + 루트 통합 package 구조로 보정했다.
- 향후 개발 계획서의 백엔드 확인 대상 경로를 새 구조로 보정했다.
- 13단계 계획, Step, PR 문서를 추가했다.

## 변경 파일

```text
backend/server.js
backend/db.js
backend/config/paths.js
backend/config/upload.js
package.json
README.md
docs/deploy-guide.md
docs/deploy-checklist.md
docs/실시간_Car_Market_향후_개발_계획서.md
docs/plans/plan-13-backend-structure-secure-foundation.md
docs/steps/2026-06-07-13-backend-structure-secure-foundation.md
docs/pr/2026-06-07-13-backend-structure-secure-foundation-pr.md
docs/progress.md
```

## 보존된 항목

| 항목                 | 내용                                                  |
| -------------------- | ----------------------------------------------------- |
| Render 배포 구조     | 단일 Web Service 유지                                 |
| Render Build Command | `npm install && npm run build` 유지                   |
| Render Start Command | `npm start` 유지                                      |
| GitHub Actions       | 기존 workflow 유지                                    |
| API 경로             | `/api/cars`, `/api/users`, `/api/chats`, `/cars` 유지 |
| Socket.io 이벤트     | 요구사항 이벤트 이름 유지                             |
| MongoDB 컬렉션       | 변경 없음                                             |
| 업로드 URL           | `/uploads/파일명` 유지                                |
| 신규 패키지          | 없음                                                  |

## 검증

```text
node --check backend/server.js           → 성공
node --check backend/db.js               → 성공
node --check backend/config/paths.js     → 성공
node --check backend/config/upload.js    → 성공
npm.cmd --prefix frontend run build      → 성공
npm.cmd run build                        → 성공
```

참고:

- 루트 빌드 중 frontend moderate 취약점 2건이 보고되었다.
- Vite의 `NODE_ENV=production` 경고는 기존과 동일하며 빌드는 성공했다.
- 실제 `npm.cmd start`와 API 호출 검증은 `MONGODB_URI`가 준비된 환경에서 추가 확인이 필요하다.

## 남은 리스크

- 서버가 아직 Firebase ID Token을 검증하지 않고 클라이언트가 보낸 UID 계열 값을 신뢰하는 흐름이 남아 있다.
- 이번 단계는 구조 기반 정리이며, 실제 시큐어 코딩은 다음 단계에서 진행해야 한다.
- 라우터와 서비스 파일의 세부 분리는 일부만 진행됐으므로, 다음 리팩토링에서 API별 모듈화를 더 진행할 수 있다.

## 체크리스트

- [x] 단일 Render Web Service 배포 구조를 유지했다.
- [x] 루트 `npm start`가 `backend/server.js`를 실행하도록 변경했다.
- [x] 루트 `uploads/` 경로를 유지했다.
- [x] `frontend/dist` 정적 제공 경로를 새 서버 위치 기준으로 보정했다.
- [x] 업로드 설정을 별도 모듈로 분리했다.
- [x] 문법 확인과 빌드를 실행했다.
- [ ] 실제 MongoDB 환경에서 서버 기동과 주요 API를 확인한다.
