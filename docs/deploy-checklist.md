# Render 배포 체크리스트

## 현재 구조 판단

| 항목 | 결과 |
| --- | --- |
| 구조 유형 | `backend` Express + `frontend` React + 루트 통합 package 구조 |
| 추천 배포 방식 | Render Web Service 단일 배포 |
| Express 진입 파일 | `backend/server.js` |
| MongoDB 연결 파일 | `backend/db.js` |
| React 프로젝트 | `frontend/` |
| React 빌드 출력 | `frontend/dist/` |
| 업로드 경로 | 루트 `uploads/` 유지, 차량당 최대 8장 업로드 |
| 현재 배포 URL | `https://codex-assignment.onrender.com/` |

15단계 보안 강화 이전 환경변수는 Render Environment에 반영되어 있으며, 15단계 이후 새로 추가된 `FIREBASE_SERVICE_ACCOUNT_JSON`은 사용자가 Render Environment에 추가로 등록해야 한다.
실제 Secret 값은 문서에 작성하지 않는다.

## 1. 코드 점검 항목

- [x] Express 서버가 `process.env.PORT || 3000`을 사용한다.
- [x] API 라우트가 React fallback보다 먼저 등록되어 있다.
- [x] `/uploads` 정적 경로가 React fallback보다 먼저 등록되어 있다.
- [x] Express가 `frontend/dist`를 정적 파일로 제공한다.
- [x] 백엔드 파일은 `backend/` 아래에 있고, 루트 `npm start`가 `backend/server.js`를 실행한다.
- [x] 업로드 설정은 `backend/config/upload.js`로 분리되어 있고 루트 `uploads/`를 유지한다.
- [x] 차량 이미지는 대표 `imageUrl`과 전체 `imageUrls` 배열을 함께 사용할 수 있다.
- [x] React 새로고침 404 방지를 위한 fallback이 있다.
- [x] CRUD 기능 로직은 변경하지 않았다.
- [x] UI 디자인은 이번 단계에서 변경하지 않았다.

## 2. package.json 점검 항목

| 위치 | 항목 | 상태 |
| --- | --- | --- |
| 루트 `package.json` | `start` 스크립트 | `npm start`로 `node backend/server.js` 실행 |
| 루트 `package.json` | `build` 스크립트 | `frontend` devDependencies 포함 설치 및 Vite 빌드 실행 |
| 루트 `package.json` | `engines` | Node.js `20.19` 이상 사용 |
| 루트 `package.json` | `dependencies` | `multer`, `socket.io` 포함 |
| `frontend/package.json` | `build` 스크립트 | `vite build` 실행 |
| `frontend/package.json` | `dependencies` | `react-router-dom`, `socket.io-client` 포함 |
| `frontend/package.json` | `test` 스크립트 | 없음, CI에서 건너뜀 |

## 3. API 경로 점검 항목

- [x] React API 호출은 `/api/...` 상대 경로를 사용한다.
- [x] React 코드에 배포용 `localhost` API 호출이 없다.
- [x] Vite 개발 서버에서는 `/api` 프록시가 `http://localhost:3000`으로 연결된다.
- [x] 배포 환경에서는 Express가 `/api/cars`를 직접 제공한다.
- [x] 차량 상세 URL은 `/cars/:id`를 사용하고 서버 fallback으로 새로고침을 지원한다.
- [x] 상담방 생성 API는 `/api/chats/rooms`를 사용한다.
- [x] 상담방 상세 API는 `/api/chats/rooms/:roomId`를 사용한다.
- [x] 상담 메시지 조회 API는 `/api/chats/rooms/:roomId/messages`를 사용한다.
- [x] Socket.io 이벤트 이름은 요구사항의 `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline`을 유지한다.
- [x] 기존 Express API 경로인 `/cars`는 유지된다.

## 4. 환경변수 점검 항목

| 파일 또는 위치 | 상태 |
| --- | --- |
| `.env.example` | `NODE_ENV`, `PORT`, MongoDB Atlas, Firebase Web config, Firebase Admin 서비스 계정, 최초 admin, Socket.io 관련 환경변수 예시 작성 |
| `.env` | 커밋 금지 |
| `.gitignore` | `.env`, `.env.*`, `node_modules`, `dist`, 로그 파일 제외 |
| `.gitignore` | `uploads/*` 런타임 업로드 파일 제외, `uploads/default-car.png` 기본 이미지는 커밋 가능 |
| Render Environment | `FIREBASE_SERVICE_ACCOUNT_JSON`을 새로 등록해야 함. 실제 Secret 값은 Render에만 등록. 분리 배포가 아니면 `VITE_API_BASE_URL`은 비워둘 수 있음 |
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

### 사용자 확인 기준 완료

- [x] Render Web Service 배포가 완료되었다.
- [x] `.env.example` 변경 사항을 Render Environment에 반영했다.
- [x] 배포 URL은 `https://codex-assignment.onrender.com/`이다.

### 기능별 확인 항목

- [ ] Render URL 접속 시 React 화면이 보인다.
- [ ] `GET /api/cars`가 자동차 목록 JSON을 반환한다.
- [ ] Render Logs에 `MongoDB connected: car_market` 메시지가 보인다.
- [ ] 자동차 등록 기능이 동작한다.
- [ ] 차량 사진 여러 장을 포함한 자동차 등록이 동작한다.
- [ ] 자동차 수정 기능이 동작한다.
- [ ] 차량 수정 시 새 사진을 선택하면 사진 목록 전체 교체가 동작한다.
- [ ] 차량 수정 시 새 사진을 선택하지 않으면 기존 사진 목록이 유지된다.
- [ ] 자동차 삭제 기능이 동작한다.
- [ ] 사진 없는 차량에서 `/uploads/default-car.png` 기본 이미지가 보인다.
- [ ] 이미지 파일 로딩 실패 시 깨진 이미지 대신 placeholder가 보인다.
- [ ] 관리자 화면에서 차량 등록 설정을 저장하면 숫자 입력 단위와 최대 사진 개수가 반영된다.
- [ ] Firebase 이메일/비밀번호 회원가입이 동작한다.
- [ ] 회원가입 후 MongoDB `users` 컬렉션에 사용자 프로필이 저장된다.
- [ ] Firebase 로그인, 로그아웃, 새로고침 후 인증 상태 유지가 동작한다.
- [ ] Render Environment 또는 로컬 `.env`에 `FIREBASE_SERVICE_ACCOUNT_JSON`이 등록되어 있다.
- [ ] 보호 API 요청에 Firebase ID Token 기반 `Authorization: Bearer` 헤더가 전달된다.
- [ ] `INITIAL_ADMIN_EMAILS`에 등록한 이메일로 가입한 사용자가 admin으로 저장된다.
- [ ] 일반 사용자 `buyer`는 딜러 신청을 할 수 있다.
- [ ] admin은 딜러 신청 사용자를 승인할 수 있다.
- [ ] 승인 전 `buyer`는 차량 등록, 수정, 삭제를 사용할 수 없다.
- [ ] 승인된 딜러 `dealer`는 본인이 등록한 차량만 수정, 삭제할 수 있다.
- [ ] admin은 자기 자신의 admin 권한을 해제할 수 없다.
- [ ] 로그인 후 차량 상세 버튼 클릭 시 `/cars/:id`로 이동한다.
- [ ] `/cars/:id`에서 새로고침해도 상세 정보가 유지된다.
- [ ] 잘못된 차량 ID 접근 시 오류 안내가 표시된다.
- [ ] 상세 화면의 `딜러와 상담하기` 버튼으로 `/chats/:roomId` 준비 화면에 이동한다.
- [ ] MongoDB `chat_rooms` 컬렉션에 상담방 문서가 저장된다.
- [ ] `/chats/:roomId`에서 이전 메시지 목록이 조회된다.
- [ ] `/chats/:roomId`에서 메시지 전송 시 MongoDB `messages` 컬렉션에 저장된다.
- [ ] 브라우저 2개 또는 탭 2개에서 같은 상담방 메시지가 실시간으로 송수신된다.
- [ ] 딜러 접속 시 구매자 화면에 온라인 상태가 표시된다.
- [ ] 딜러 접속 종료 시 구매자 화면에 오프라인 상태가 표시된다.
- [ ] MongoDB `users` 문서의 딜러 온라인 상태 필드가 접속 상태에 따라 갱신된다.
- [ ] 자기 자신과 상담방을 만드는 요청은 차단된다.
- [ ] 인증 토큰 없는 차량 등록, 사용자 목록, 상담방 조회 요청은 `401`로 차단된다.
- [ ] 권한 없는 buyer의 차량 등록, admin이 아닌 사용자의 역할 변경 요청은 `403`으로 차단된다.
- [ ] Render 무료 환경에서는 `uploads/` 파일이 영구 보관되지 않을 수 있음을 확인했다.
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
| `node --check backend/server.js` | 성공 |
| `node --check backend/db.js` | 성공 |
| `node --check backend/config/paths.js` | 성공 |
| `node --check backend/config/upload.js` | 성공 |
| `GET /` | `200` 응답 |
| `GET /api/cars` | 자동차 목록 JSON 응답 |

`frontend` 의존성 검사 결과 moderate 취약점 2개가 보고되었다.
이번 단계는 배포 및 CI/CD 준비가 목적이므로 강제 업데이트는 실행하지 않았다.
