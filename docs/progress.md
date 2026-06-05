# 작업 진행 기록

## UI 전면 개선 — daisyUI 제거, 순수 Tailwind Modern Marketplace 적용

| 항목             | 내용                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명      | UI 전면 개선                                                                                                                                                                                                                     |
| 작업 일자        | 2026-06-05                                                                                                                                                                                                                       |
| 작업 내용        | daisyUI를 완전 제거하고 순수 Tailwind CSS 기반의 Modern Car Marketplace 스타일로 전면 개선                                                                                                                                       |
| 제거한 패키지    | `daisyui`                                                                                                                                                                                                                        |
| 수정한 주요 파일 | `style.css`, `App.jsx`, `Header.jsx`, `AlertMessage.jsx`, `CarTable.jsx`, `CarDetail.jsx`, `CarForm.jsx`, `LoginForm.jsx`, `RegisterForm.jsx`, `DeleteConfirmModal.jsx`, `AdminUserPanel.jsx`, `tailwind.config.js`, `server.js` |
| 추가한 주요 파일 | `CarCardGrid.jsx`, `ChatRoomList.jsx`, `ChatRoom.jsx`, `docs/plans/plan-07-ui-redesign.md`, `docs/steps/2026-06-05-07-ui-redesign.md`, `docs/pr/2026-06-05-07-ui-redesign-pr.md`                                                 |
| 확인한 명령어    | `npm run build` (64 modules, 4.10s, 성공), `node --check server.js` (성공)                                                                                                                                                       |

### 작업 내용

- `style.css`에 `@layer components`로 `c-btn-*`, `c-input`, `c-card`, `c-badge-*`, `c-alert-*` 공통 클래스 패턴을 정의했다.
- `Header.jsx`를 CAR MARKET 로고 + 모바일 햄버거 메뉴 + 내 상담 링크로 재작성했다.
- `App.jsx` 목록 화면을 Hero 섹션 + 검색 패널 + `CarCardGrid`로 개편했다.
- 일반 사용자 차량 목록용 `CarCardGrid.jsx`를 신규 생성했다.
- `CarDetail.jsx`를 이미지 2열 + 스펙 그리드 + 딜러 CTA 레이아웃으로 재작성했다.
- `LoginForm.jsx`를 중앙 정렬 인증 카드로, `RegisterForm.jsx`에 buyer/dealer 역할 선택 카드 UI를 추가했다.
- `CarForm.jsx`를 섹션 분리 딜러 등록 폼으로 재작성했다.
- `DeleteConfirmModal.jsx`를 순수 Tailwind fixed overlay + dialog로 교체했다.
- `AdminUserPanel.jsx`를 색상별 요약 카드 + 탭 + 순수 Tailwind 테이블로 재작성했다.
- `ChatRoomList.jsx`, `ChatRoom.jsx`를 신규 구현했다 (Socket.io 연결은 8단계).
- `server.js`에 `GET /api/chats/rooms`, `GET /api/chats/rooms/:roomId/messages` API를 추가했다.
- `daisyui` 패키지와 `tailwind.config.js` 플러그인 설정을 제거했다.

### 다음 단계

1. Socket.io 실시간 상담 연결 (8단계)
2. `join-room`, `send-message`, `receive-message`, `dealer-online`, `dealer-offline` 이벤트 구현
3. ChatRoom 메시지 전송·수신 기능 활성화
4. 딜러 온라인 상태 표시

## Tailwind CSS와 daisyUI 기반 화면 개선

| 항목             | 내용                                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명      | React CRUD 화면 UI 개선                                                                                                                                                                                                                                    |
| 작업 일자        | 2026-06-02                                                                                                                                                                                                                                                 |
| 작업 내용        | Tailwind CSS와 daisyUI를 설정하고, 자동차 CRUD 화면을 목록, 등록, 수정, 상세, 삭제 모달 중심으로 개선                                                                                                                                                      |
| 설치한 패키지    | `tailwindcss`, `postcss`, `autoprefixer`, `daisyui`                                                                                                                                                                                                        |
| 수정한 주요 파일 | `frontend/package.json`, `frontend/package-lock.json`, `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/style.css`, `frontend/src/App.jsx`                                                                                       |
| 추가한 주요 파일 | `frontend/src/components/Header.jsx`, `frontend/src/components/AlertMessage.jsx`, `frontend/src/components/CarTable.jsx`, `frontend/src/components/CarForm.jsx`, `frontend/src/components/CarDetail.jsx`, `frontend/src/components/DeleteConfirmModal.jsx` |
| 확인한 명령어    | `npm install -D tailwindcss@3.4.17 postcss autoprefixer daisyui@4.12.24`, `npm run build`                                                                                                                                                                  |

### 작업 내용

- Tailwind CSS 전역 지시어를 `frontend/src/style.css`에 적용했다.
- daisyUI 플러그인을 `frontend/tailwind.config.js`에 추가했다.
- 기존 단순 목록 화면을 navbar, stats, card, table, input, button, modal, alert 기반 UI로 개선했다.
- React Router 없이 현재 프로젝트 구조 안에서 목록, 등록, 수정, 상세 화면을 상태 기반으로 전환하도록 구성했다.
- 자동차 등록, 수정, 삭제 요청은 기존 Express API 경로를 유지해 `/api/cars` 프록시 경로로 호출하도록 정리했다.

### 다음 단계

1. Render 배포를 위한 Express 정적 파일 제공 구조 검토
2. GitHub Actions 빌드 워크플로우 작성
3. Render 배포 설정 및 배포 확인
4. 과제 제출용 README 실행 방법 보강

## Render 배포 전 구조 점검

| 항목             | 내용                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 작업 단계명      | Render 배포 전 프로젝트 구조 점검                                                                                              |
| 작업 일자        | 2026-06-02                                                                                                                     |
| 작업 내용        | Render 단일 Web Service 배포 기준으로 Express와 React 통합 구조를 점검하고 최소 설정 보완                                      |
| 설치한 패키지    | 없음                                                                                                                           |
| 수정한 주요 파일 | `server.js`, `package.json`, `.env.example`, `docs/deploy-checklist.md`, `docs/progress.md`                                    |
| 확인한 명령어    | `rg --files`, `type package.json`, `type frontend/package.json`, `type server.js`, `npm run build`, `PORT=3100 node server.js` |

### 작업 내용

- Express 서버 포트를 `process.env.PORT || 3000` 구조로 변경했다.
- React의 `/api` 요청이 배포 환경에서도 기존 Express API로 연결되도록 보완했다.
- `frontend/dist` 빌드 결과물을 Express가 정적 파일로 제공하도록 설정했다.
- Render Build Command에서 사용할 수 있도록 루트 `build` 스크립트를 추가했다.
- `.env.example`과 Render 배포 전 체크리스트 문서를 작성했다.
- 루트 빌드와 임시 포트 서버 실행을 확인했다.

### 다음 단계

1. Render Web Service 생성
2. Render Build Command와 Start Command 입력
3. 배포 후 React 화면과 `/api/cars` 응답 확인
4. GitHub Actions CI/CD 워크플로우 작성

## Render 배포 및 GitHub Actions CI/CD 준비

| 항목          | 내용                                                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명   | Render 배포 및 GitHub Actions CI/CD 준비                                                                                                                              |
| 작업 일자     | 2026-06-02                                                                                                                                                            |
| 작업 목적     | Render 배포 가능 구조를 최종 점검하고, GitHub Actions에서 빌드 성공 후 Render Deploy Hook을 호출하는 CI/CD 흐름 구성                                                  |
| 수정한 파일   | `.env.example`, `docs/deploy-checklist.md`, `docs/progress.md`                                                                                                        |
| 생성한 파일   | `.github/workflows/deploy.yml`, `docs/deploy-guide.md`                                                                                                                |
| 실행한 명령어 | `rg --files`, `type package.json`, `type frontend/package.json`, `type server.js`, `rg fetch`, `rg localhost`, `rg /api`, `npm run build`, `PORT=3100 node server.js` |
| 확인 결과     | 루트 Express + `frontend` React 구조로 판단했고, Render Web Service 단일 배포 방식이 적합함을 확인                                                                    |

### 작업 내용

- GitHub Actions workflow를 추가했다.
- workflow에서 Node.js 20 설정, 루트 의존성 설치, `frontend` 의존성 설치, 선택적 테스트, 빌드, Render Deploy Hook 호출 흐름을 구성했다.
- Render 배포 가이드를 초급 개발자가 따라 할 수 있는 순서로 작성했다.
- 배포 체크리스트를 코드, package.json, API 경로, 환경변수, GitHub Actions, Render 설정, 배포 후 테스트 기준으로 보완했다.
- `.env.example`에 `NODE_ENV=production` 예시를 추가했다.

### 확인 결과

- React API 호출은 `/api/...` 상대 경로를 사용한다.
- 배포용 코드에 하드코딩된 localhost API 호출은 없다.
- Vite 개발 프록시의 `localhost:3000`은 로컬 개발용 설정이므로 유지했다.
- 실제 Render 배포, GitHub push, Git commit은 진행하지 않았다.

### 다음 단계

1. GitHub에 변경사항을 사용자가 직접 커밋하고 push한다.
2. Render Web Service를 생성한다.
3. Render Deploy Hook URL을 GitHub Secret `RENDER_DEPLOY_HOOK_URL`로 등록한다.
4. GitHub Actions를 수동 실행하거나 `main` 브랜치 push로 실행한다.
5. Render 배포 URL에서 React 화면과 `/api/cars` 응답을 확인한다.

## Render Tailwind 빌드 오류 수정

| 항목          | 내용                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| 작업 단계명   | Render Tailwind 빌드 오류 수정                                                         |
| 작업 일자     | 2026-06-02                                                                             |
| 작업 목적     | Render 빌드 중 `Cannot find module 'tailwindcss'` 오류 해결                            |
| 수정한 파일   | `package.json`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`, `docs/progress.md` |
| 생성한 파일   | 없음                                                                                   |
| 실행한 명령어 | `npm run build`                                                                        |
| 확인 결과     | 프론트엔드 devDependencies를 포함해 설치하도록 루트 build 스크립트를 보완              |

### 작업 내용

- Render 빌드 환경에서 `NODE_ENV=production` 영향으로 `frontend`의 devDependencies가 빠질 수 있는 문제를 확인했다.
- Tailwind CSS, PostCSS, daisyUI는 Vite 빌드에 필요한 패키지이므로 `npm install --include=dev --prefix frontend`를 사용하도록 수정했다.
- Render와 GitHub Actions의 Node.js 버전을 맞추기 위해 루트 `package.json`에 `engines.node`를 `20.x`로 추가했다.
- MongoDB 드라이버 7.x 도입 후 Node.js 요구 버전을 `20.19.0` 이상으로 보정했다.

### 다음 단계

1. 변경사항을 커밋하고 GitHub에 push한다.
2. Render에서 `Clear build cache & deploy`를 실행한다.
3. Render 빌드 로그에서 `vite build` 성공 여부를 확인한다.
4. 배포 URL에서 React 화면과 `/api/cars` 응답을 확인한다.

## 1단계 서버 구조 정리

| 항목        | 내용                                                                               |
| ----------- | ---------------------------------------------------------------------------------- |
| 작업 단계명 | 향후 개발 계획 1단계 서버 구조 정리                                                |
| 작업 일자   | 2026-06-05                                                                         |
| 작업 목적   | MongoDB 연동 전 서버 API 경로를 신규 요구사항 기준인 `/api/cars`로 정리            |
| 수정한 파일 | `server.js`, `frontend/vite.config.js`, `frontend/src/App.jsx`, `docs/progress.md` |
| 생성한 파일 | 없음                                                                               |

### 작업 내용

- `server.js`에서 `/api` 접두사를 제거하던 우회 미들웨어를 삭제했다.
- 자동차 CRUD API를 `express.Router()`로 묶고 `/api/cars`에 직접 등록했다.
- 기존 `/cars` API는 다음 단계 전까지 레거시 호환 라우트로 유지했다.
- 메모리 자동차 데이터는 MongoDB 연결 전 seed/fallback 용도임을 코드 주석에 명시했다.
- Vite 개발 프록시가 `/api/cars`를 그대로 Express 서버에 전달하도록 정리했다.

### 다음 단계

1. MongoDB Atlas 연동 단계에서 `mongodb`, `dotenv` 의존성을 추가한다.
2. MongoDB 연결 파일을 분리하고 차량 CRUD 저장소를 메모리 배열에서 `cars` 컬렉션으로 전환한다.
3. `/cars` 호환 라우트 제거 여부는 프론트엔드와 문서가 완전히 `/api/cars`로 정리된 뒤 결정한다.

## 2단계 MongoDB Atlas 연동

| 항목          | 내용                                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명   | 향후 개발 계획 2단계 MongoDB Atlas 연동                                                                                                                          |
| 작업 일자     | 2026-06-05                                                                                                                                                       |
| 작업 목적     | Express 서버를 MongoDB Atlas `cars` 컬렉션 기반 CRUD로 전환                                                                                                      |
| 설치한 패키지 | `mongodb`, `dotenv`                                                                                                                                              |
| 수정한 파일   | `server.js`, `frontend/src/App.jsx`, `.env.example`, `package.json`, `package-lock.json`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`, `docs/progress.md` |
| 생성한 파일   | `db.js`                                                                                                                                                          |

### 작업 내용

- `db.js`에 `MongoClient` 기반 MongoDB 연결 코드를 분리했다.
- 서버 시작 시 `MONGODB_URI`로 Atlas에 연결하고 `cars`, `users`, `chat_rooms`, `messages` 컬렉션을 준비하도록 구성했다.
- 차량 목록, 상세, 등록, 수정, 삭제 API를 메모리 배열 대신 MongoDB `cars` 컬렉션을 사용하도록 변경했다.
- 기존 `/api/cars/search`, `/api/cars/filter`, `/cars` 호환 라우트는 유지했다.
- 차량 등록 시 서버가 MongoDB ObjectId를 생성하도록 프론트엔드의 숫자 ID 생성 로직을 제거했다.
- `.env.example`과 배포 문서에 MongoDB Atlas 환경변수를 추가했다.

### 확인 결과

- `node --check server.js` 성공
- `node --check db.js` 성공
- `npm run build` 성공
- `npm start`는 현재 로컬 환경에 `MONGODB_URI`가 없어 `MongoDB 연결 실패: MONGODB_URI 환경변수가 설정되지 않았습니다.` 메시지로 종료됨을 확인했다.
- 실제 MongoDB Atlas 접속과 `/api/cars` API 호출 검증은 실제 `MONGODB_URI` 등록 후 진행해야 한다.
- 로컬 DNS에서 `querySrv ECONNREFUSED`가 발생할 수 있어 `MONGODB_DNS_SERVERS` 선택 환경변수와 문서 안내를 추가했다.

### 다음 단계

1. 로컬 또는 Render 환경에 실제 `MONGODB_URI`를 등록한 뒤 서버 실행과 API 응답을 확인한다.
2. 3단계에서 `GET /api/cars/search`를 차량명, 제조사, 가격, 연식 복합 검색 API로 고도화한다.
3. 이후 사진 업로드 단계에서 `imageUrl`, 차종, 연료, 주행거리, 지역, 설명 필드를 확장한다.

## 3단계 차량 검색 고도화

| 항목        | 내용                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명 | 향후 개발 계획 3단계 차량 검색 고도화                                                                                                             |
| 작업 일자   | 2026-06-05                                                                                                                                        |
| 작업 목적   | 차량 검색 API를 `/api/cars/search` 하나로 통합하고 복합 검색 조건 지원                                                                            |
| 수정한 파일 | `server.js`, `frontend/src/App.jsx`, `frontend/src/components/CarTable.jsx`, `docs/progress.md`, `docs/실시간_Car_Market_향후_개발_계획서.md`     |
| 생성한 파일 | `docs/plans/plan-03-car-search-advanced.md`, `docs/steps/2026-06-05-03-car-search-advanced.md`, `docs/pr/2026-06-05-03-car-search-advanced-pr.md` |

### 작업 내용

- `GET /api/cars/search`에서 `keyword`, `company`, `minPrice`, `maxPrice`, `minYear`, `maxYear` 복합 검색을 지원하도록 변경했다.
- 차량명 검색은 MongoDB 정규식을 사용해 대소문자 구분 없는 부분 검색으로 처리했다.
- 제조사 검색은 기존 등록 흐름과 맞춰 공백 제거 후 대문자로 검색한다.
- 가격과 연식 조건은 공백, 탭, 줄바꿈을 제거한 뒤 숫자인지 검증하고, 숫자가 아니면 `400` 오류를 반환한다.
- 기존 `/api/cars/filter` 가격 필터 라우트는 제거하고 프론트엔드 호출도 `/api/cars/search`로 통합했다.
- 프론트엔드 검색 폼에 차량명, 제조사, 최소/최대 가격, 최소/최대 연식을 추가했다.
- 검색 결과가 없을 때 등록 안내 대신 "검색 결과가 없습니다." 안내를 표시하도록 목록 컴포넌트를 보완했다.

### 확인 결과

- `node --check server.js` 성공
- `npm.cmd run build` 성공
- 코드 검색 결과 `filterByPrice`, `searchByCompany`, `/api/cars/filter`, `/cars/filter` 호출은 남아 있지 않다.
- `npm.cmd start`는 실행 후 제한 시간 안에 종료되지 않아 실제 API 호출 검증은 완료하지 못했다.
- 실제 MongoDB Atlas 접속과 `/api/cars/search` API 호출 검증은 실제 `MONGODB_URI` 등록 후 진행해야 한다.
- 빌드 중 `frontend` 의존성 moderate 취약점 2건이 기존과 동일하게 보고된다.

### 다음 단계

1. 실제 `MONGODB_URI`가 등록된 환경에서 `/api/cars/search` 복합 검색 API를 직접 호출해 확인한다.
2. 4단계에서 차량 등록 데이터 구조 확장과 사진 업로드를 진행한다.
3. UI 개편 단계에서 제조사 입력을 select 형태로 개선할 수 있다.

## 4단계 차량 등록과 사진 업로드

| 항목          | 내용                                                                                                                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명   | 향후 개발 계획 4단계 차량 등록과 사진 업로드                                                                                                                                                                                                                                                                                                      |
| 작업 일자     | 2026-06-05                                                                                                                                                                                                                                                                                                                                        |
| 작업 목적     | 차량 등록 데이터 구조를 확장하고 `multer` 기반 사진 업로드를 추가                                                                                                                                                                                                                                                                                 |
| 설치한 패키지 | `multer`                                                                                                                                                                                                                                                                                                                                          |
| 수정한 파일   | `server.js`, `frontend/src/App.jsx`, `frontend/src/components/CarForm.jsx`, `frontend/src/components/CarTable.jsx`, `frontend/src/components/CarDetail.jsx`, `.gitignore`, `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`, `docs/실시간_Car_Market_향후_개발_계획서.md`, `package.json`, `package-lock.json`, `docs/progress.md` |
| 생성한 파일   | `docs/plans/plan-04-car-photo-upload.md`, `docs/steps/2026-06-05-04-car-photo-upload.md`, `docs/pr/2026-06-05-04-car-photo-upload-pr.md`                                                                                                                                                                                                          |

### 작업 내용

- `multer`를 추가하고 서버 시작 시 `uploads/` 폴더가 자동 생성되도록 했다.
- Express에서 `/uploads` 정적 경로를 제공하도록 했다.
- 차량 사진은 5MB 이하의 `jpg`, `jpeg`, `png`, `webp` 파일만 허용하도록 검증했다.
- `POST /api/cars`와 `PUT /api/cars/:id`에서 `multipart/form-data` 요청을 처리하도록 변경했다.
- 차량 수정 시 새 사진이 없으면 기존 `imageUrl`을 유지하고, 새 사진이 있으면 새 업로드 경로로 교체하도록 했다.
- 차량 등록/수정 폼에 차종, 연료, 주행거리, 지역, 설명, 사진 입력을 추가했다.
- 목록 화면에 차량 썸네일, 주행거리, 지역을 추가했다.
- 상세 화면에 큰 차량 사진, 상세 스펙, 차량 설명을 추가했다.
- 사진이 없는 차량은 `/uploads/default-car.png` 기본 이미지 경로를 사용하도록 했다.
- README와 배포 문서에 Render 무료 환경의 업로드 파일 비영속성 주의사항을 추가했다.

### 확인 결과

- `cmd.exe /c node --check server.js` 성공
- `npm.cmd run build` 성공
- `npm.cmd start`는 MongoDB 연결까지 성공했지만 3000번 포트가 이미 사용 중이라 `EADDRINUSE`로 종료됨
- 임시 포트 `3101`로 실행했을 때 제한 시간 안에 종료되지 않아 포트 충돌 없이 서버가 계속 실행되는 상태로 확인됨
- 실제 사진 업로드 API 검증은 브라우저 또는 curl로 파일을 준비한 뒤 추가 확인이 필요하다.
- 빌드 중 `frontend` 의존성 moderate 취약점 2건이 기존과 동일하게 보고된다.

### 다음 단계

1. 사진 샘플 파일을 준비해 `/api/cars` 등록과 `/api/cars/:id` 수정 업로드를 직접 확인한다.
2. 기본 이미지 파일이 `uploads/default-car.png` 위치에 있는지 확인한다.
3. 5단계에서 Firebase 인증과 딜러 권한 체크를 진행한다.

## 5단계 Firebase 인증

| 항목          | 내용                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 작업 단계명   | 향후 개발 계획 5단계 Firebase 인증                                                                                                                                                                                                                                                                                                                                                                                       |
| 작업 일자     | 2026-06-05                                                                                                                                                                                                                                                                                                                                                                                                               |
| 작업 목적     | Firebase Authentication 기반 회원가입/로그인과 MongoDB 사용자 프로필 저장, 딜러 권한 체크 구현                                                                                                                                                                                                                                                                                                                           |
| 설치한 패키지 | `firebase`                                                                                                                                                                                                                                                                                                                                                                                                               |
| 수정한 파일   | `server.js`, `frontend/vite.config.js`, `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/components/Header.jsx`, `frontend/src/components/CarTable.jsx`, `frontend/src/components/CarDetail.jsx`, `.env.example`, `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`, `docs/실시간_Car_Market_향후_개발_계획서.md`, `frontend/package.json`, `frontend/package-lock.json`, `docs/progress.md` |
| 생성한 파일   | `frontend/src/firebase.js`, `frontend/src/contexts/AuthContext.jsx`, `frontend/src/components/LoginForm.jsx`, `frontend/src/components/RegisterForm.jsx`, `docs/plans/plan-05-firebase-auth.md`, `docs/steps/2026-06-05-05-firebase-auth.md`, `docs/pr/2026-06-05-05-firebase-auth-pr.md`                                                                                                                                |

### 작업 내용

- Firebase Web config를 Vite 환경변수로 읽는 `frontend/src/firebase.js`를 추가했다.
- Firebase 인증 상태를 전역에서 사용할 수 있도록 `AuthContext`를 추가했다.
- 이메일/비밀번호 로그인, 회원가입, 로그아웃 흐름을 구현했다.
- 회원가입 시 사용자 유형 `buyer`, `dealer`를 선택하고 MongoDB `users` 컬렉션에 추가 프로필을 저장하도록 했다.
- MongoDB 사용자 프로필 저장 실패 시 방금 생성된 Firebase 계정 삭제 보정을 시도하도록 했다.
- Express에 `/api/users`, `/api/users/me`, `/api/users/dealers` API를 추가했다.
- 차량 등록은 딜러만 가능하도록 서버와 화면에서 제한했다.
- 차량 수정과 삭제는 차량을 등록한 딜러 본인만 가능하도록 제한했다.
- `.env.example`, README, 배포 문서에 Firebase 환경변수와 인증 설정 안내를 추가했다.
- Vite가 로컬 개발에서도 루트 `.env`의 `VITE_FIREBASE_*` 값을 읽도록 `frontend/vite.config.js`에 `envDir: "../"`를 추가했다.

### 확인 결과

- `cmd.exe /c node --check server.js` 성공
- `cmd.exe /c npm.cmd --prefix frontend run build` 성공
- `npm.cmd run build`와 `npm.cmd start`는 사용자 요청에 따라 사용자가 직접 실행한다.
- 실제 Firebase 프로젝트 설정값이 없는 환경에서는 회원가입/로그인 실동작 검증이 제한된다.
- 실제 `MONGODB_URI`가 있어야 MongoDB `users` 프로필 저장과 딜러 권한 API를 직접 확인할 수 있다.

### 다음 단계

1. 실제 Firebase Web config와 `MONGODB_URI`를 등록한 뒤 회원가입, 로그인, 새로고침 인증 유지, 로그아웃을 확인한다.
2. `buyer` 계정으로 차량 등록/수정/삭제가 차단되는지 확인한다.
3. `dealer` 계정으로 차량 등록 후 본인 차량만 수정/삭제 가능한지 확인한다.
4. 6단계에서 차량 상세 URL과 상담 진입 API를 구현한다.

## 5-1단계 관리자 역할과 딜러 승인

| 항목          | 내용                                                                                                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명   | 향후 개발 계획 5-1단계 관리자 역할과 딜러 승인                                                                                                                                                                                                                                                                    |
| 작업 일자     | 2026-06-05                                                                                                                                                                                                                                                                                                        |
| 작업 목적     | 회원가입 시 누구나 딜러가 될 수 있던 흐름을 admin 승인 기반 딜러 권한 정책으로 보강                                                                                                                                                                                                                               |
| 설치한 패키지 | 없음                                                                                                                                                                                                                                                                                                              |
| 수정한 파일   | `server.js`, `frontend/src/App.jsx`, `frontend/src/contexts/AuthContext.jsx`, `frontend/src/components/Header.jsx`, `frontend/src/components/RegisterForm.jsx`, `.env.example`, `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`, `docs/실시간_Car_Market_향후_개발_계획서.md`, `docs/progress.md` |
| 생성한 파일   | `frontend/src/components/AdminUserPanel.jsx`, `docs/plans/plan-05-1-admin-role-management.md`, `docs/steps/2026-06-05-05-1-admin-role-management.md`, `docs/pr/2026-06-05-05-1-admin-role-management-pr.md`                                                                                                       |

### 작업 내용

- 일반 회원가입은 항상 `buyer`로 저장되도록 변경했다.
- 최초 admin 자동 지정을 위해 서버 전용 환경변수 `INITIAL_ADMIN_EMAILS`를 추가했다.
- 사용자 프로필에 `dealerStatus`, `dealerRequestedAt`, `dealerApprovedAt`, `dealerApprovedBy` 흐름을 추가했다.
- `POST /api/users/dealer-request`로 딜러 신청 API를 추가했다.
- `GET /api/users`와 `PATCH /api/users/:uid/role`로 admin 사용자 관리 API를 추가했다.
- 차량 등록, 수정, 삭제 권한을 `role: dealer`와 `dealerStatus: approved`를 모두 만족하는 사용자로 제한했다.
- admin이 자기 자신의 admin 권한을 해제하지 못하도록 서버에서 방어했다.
- 관리자 화면 초안 `AdminUserPanel`을 추가해 사용자 목록, 딜러 승인, 역할 변경을 처리하도록 했다.
- Header에 딜러 신청, 승인 대기, 거절 상태, 관리자 화면 진입 흐름을 추가했다.
- README와 배포 문서에 최초 admin 설정 방법과 Render 환경변수 안내를 보강했다.

### 확인 결과

- 명령어 실행은 사용자 요청에 따라 사용자가 직접 진행한다.
- 실제 Firebase와 MongoDB 환경변수 등록 후 admin 자동 지정, 딜러 신청, 승인, 차량 등록 권한을 확인해야 한다.

### 다음 단계

1. `.env`와 Render Environment에 `INITIAL_ADMIN_EMAILS`를 등록한다.
2. 해당 이메일로 회원가입 후 MongoDB `users.role`이 `admin`인지 확인한다.
3. buyer 계정으로 딜러 신청을 보내고 admin 화면에서 승인한다.
4. 승인된 dealer만 차량 등록이 가능한지 확인한다.
5. 6단계에서 차량 상세 URL과 상담 진입 API를 구현한다.

## 6단계 차량 상세와 상담 진입

| 항목          | 내용                                                                                                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 작업 단계명   | 향후 개발 계획 6단계 차량 상세와 상담 진입                                                                                                                                                                                               |
| 작업 일자     | 2026-06-05                                                                                                                                                                                                                               |
| 작업 목적     | 차량 상세 화면을 `/cars/:id` URL 기반으로 전환하고 상담방 생성 API를 추가                                                                                                                                                                |
| 설치한 패키지 | `react-router-dom` 설치 필요. 권한 문제를 피하기 위해 사용자가 `npm.cmd --prefix frontend install react-router-dom` 명령어로 직접 설치                                                                                                   |
| 수정한 파일   | `server.js`, `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/components/CarDetail.jsx`, `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`, `docs/실시간_Car_Market_향후_개발_계획서.md`, `docs/progress.md` |
| 생성한 파일   | `docs/plans/plan-06-car-detail-chat-entry.md`, `docs/steps/2026-06-05-06-car-detail-chat-entry.md`, `docs/pr/2026-06-05-06-car-detail-chat-entry-pr.md`                                                                                  |

### 작업 내용

- `BrowserRouter`를 적용하고 `/`, `/cars/:id`, `/chats/:roomId`, `/login`, `/register`, `/admin` 라우트를 연결했다.
- 목록의 상세 버튼이 `/cars/:id`로 이동하도록 변경했다.
- 상세 URL 진입 시 `GET /api/cars/:id`를 호출해 차량 정보를 다시 조회하도록 했다.
- 상세 화면에 담당 딜러 정보와 `딜러와 상담하기` 버튼을 추가했다.
- `POST /api/chats/rooms` 상담방 생성 API를 추가했다.
- 상담방은 `carId`, 요청자 UID, 차량 문서의 `dealerId` 기준으로 생성하거나 기존 방을 재사용한다.
- 상담방 생성 권한은 로그인한 모든 사용자에게 열어 두었다.
- 자기 자신과 상담방을 만드는 요청은 서버에서 차단했다.
- 상담방 생성 후 `/chats/:roomId` 준비 화면으로 이동하도록 했다.

### 확인 결과

- `cmd.exe /c node --check server.js` 성공
- `react-router-dom`이 아직 설치되지 않았으므로 프론트엔드 빌드는 사용자가 의존성 설치 후 직접 실행해야 한다.
- 실제 Firebase와 MongoDB 환경변수가 있어야 상세 URL 직접 접근, 상담방 생성, `chat_rooms` 저장을 확인할 수 있다.

### 다음 단계

1. 사용자가 `npm.cmd --prefix frontend install react-router-dom`을 실행한다.
2. 사용자가 `npm.cmd --prefix frontend run build`와 `npm.cmd run build`를 실행한다.
3. 실제 로그인 상태에서 `/cars/:id` 새로고침과 `/chats/:roomId` 이동을 확인한다.
4. 7단계에서 Socket.io 실시간 상담과 메시지 저장을 구현한다.
