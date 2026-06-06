# 15단계 핵심 보안 강화 계획

## 1. 문서 목적

14단계에서 백엔드 라우터, 서비스, Socket.io 핸들러를 분리했다.
이번 15단계는 클라이언트가 전달하는 `uid`, `dealerId`, `buyerId`, `requesterUid`, `senderId`를 신뢰하던 흐름을 서버 인증 사용자 기준으로 바꾸고, Firebase ID Token 검증과 기본 권한 미들웨어를 도입하는 계획을 정리한다.

이 문서는 코드 수정 전 사용자 확인을 받기 위한 계획 문서다.
코드 수정은 아래 확인 필요 항목에 대한 사용자 승인 후 진행한다.

## 2. 현재 작업 상태

| 항목 | 내용 |
| --- | --- |
| 현재 브랜치 | `security/core-hardening` |
| 미커밋 변경 | 계획 작성 전 기준 없음 |
| 작업 성격 | 인증/권한/공통 에러 응답을 포함한 핵심 보안 강화 |
| 코드 수정 여부 | 이 문서 작성 단계에서는 코드 수정 없음 |
| 배포 방향 | Render Web Service 단일 배포 유지 |
| API 경로 | 기존 `/api/*`, `/cars` 호환 경로 유지 |
| Socket.io 이벤트 이름 | 기존 `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline` 유지 |
| MongoDB 컬렉션 구조 | 기존 `cars`, `users`, `chat_rooms`, `messages` 유지 |

## 3. 확인한 문서와 파일

| 구분 | 확인 대상 | 확인 내용 |
| --- | --- | --- |
| 저장소 규칙 | `AGENTS.md` | 중간 이상 작업은 계획 문서 작성 후 사용자 확인 필요 |
| 요구사항 | `docs/실시간_Car_Market_서비스_요구사항_정의서.md` | Firebase Authentication UID를 사용자 식별 기준으로 사용 |
| 기존 요구사항 | `docs/requirements.md` | 초기 CRUD 기준 문서라 현재 기능과 차이가 있음 |
| 개발 계획 | `docs/실시간_Car_Market_향후_개발_계획서.md` | 현재 단일 Render 배포, Firebase 인증, MongoDB 사용자 프로필 기준 확인 |
| UI 분석 | `docs/실시간_Car_Market_UI_개선_분석_보고서.md` | 이번 작업은 대규모 UI 변경 대상 아님 |
| 진행 기록 | `docs/progress.md` | 14단계 완료 후 다음 단계로 Firebase ID Token 서버 검증 필요 기록 |
| 배포 문서 | `docs/deploy-guide.md`, `docs/deploy-checklist.md` | 현재 문서에는 “서버는 Firebase Admin SDK를 사용하지 않는다”는 기존 구현 기준이 남아 있음 |
| CI/CD | `.github/workflows/deploy.yml` | 빌드 후 Render Deploy Hook 호출 구조 유지 |
| 서버 | `backend/server.js` | `express.json()` size limit 없음, Socket.io CORS는 `process.env.CLIENT_URL || true` |
| 차량 라우터/서비스 | `backend/routes/cars.routes.js`, `backend/services/cars.service.js` | 차량 등록/수정/삭제 권한이 클라이언트 전달 `dealerId`에 의존 |
| 사용자 라우터/서비스 | `backend/routes/users.routes.js`, `backend/services/users.service.js` | 관리자 조회/역할 변경, 딜러 신청이 클라이언트 전달 `requesterUid`에 의존 |
| 상담 라우터/서비스 | `backend/routes/chats.routes.js`, `backend/services/chats.service.js` | 상담방 생성/목록/메시지 조회가 클라이언트 전달 `buyerId`, `uid`, `senderId`에 의존 |
| Socket.io | `backend/sockets/chat.socket.js` | `join-room`, `send-message`에서 payload의 `userId`, `senderId`를 신뢰 |
| 프론트 인증 | `frontend/src/contexts/AuthContext.jsx` | Firebase 로그인 상태는 있으나 서버 API에 ID Token을 전달하지 않음 |
| 프론트 API 호출 | `frontend/src/App.jsx`, `AdminUserPanel.jsx`, `ChatRoom.jsx`, `ChatRoomList.jsx` | `fetch`가 흩어져 있고 `Authorization: Bearer` 헤더 공통 처리 없음 |
| 패키지 | 루트 `package.json`, `frontend/package.json` | 루트에 `firebase-admin` 없음, 프론트에는 `firebase` 있음 |

## 4. 문서와 실제 구현 차이

| 항목 | 문서 또는 요구사항 | 실제 코드 | 15단계 판단 |
| --- | --- | --- | --- |
| Firebase 인증 | Firebase Authentication 사용, UID를 사용자 식별 기준으로 사용 | 클라이언트 Firebase 인증만 사용하고 서버는 토큰 검증 없음 | Firebase Admin SDK 기반 ID Token 검증 필요 |
| 서버 권한 기준 | 서버가 인증 사용자 기준으로 판단해야 안전 | `dealerId`, `buyerId`, `requesterUid`, `uid`, `senderId`를 body/query/payload로 받음 | 클라이언트 입력 UID는 식별용으로 신뢰하지 않도록 변경 |
| 배포 문서 | 현재 배포 문서에 Admin SDK 미사용이라고 기록 | 이번 보안 단계에서 변경 가능 | 승인 후 README/배포 문서/.env.example 갱신 필요 |
| CORS | 단일 Render Web Service 기준이면 같은 origin 우선 | Socket.io CORS origin이 `CLIENT_URL || true` | 개발 편의와 배포 보안을 분리해 기본값 점검 필요 |
| 에러 응답 | 라우터별 `{ message }` 응답 | 중복 try/catch와 응답 형식이 흩어짐 | 공통 에러 helper 또는 middleware로 정리 |

## 5. 사용자 확인이 필요한 항목

| 확인 항목 | 추천 방향 | 이유 | 영향 |
| --- | --- | --- | --- |
| 새 npm 패키지 추가 여부 | 루트에 `firebase-admin` 추가 | Firebase ID Token을 서버에서 공식적으로 검증하려면 Admin SDK가 필요 | `package.json`, `package-lock.json` 변경 |
| Firebase Admin SDK 도입 방식 | 서비스 계정 JSON 파일 대신 환경변수 기반 초기화 | Secret 파일을 커밋하지 않고 Render Environment로 관리하기 쉬움 | 서버 전용 환경변수 추가 필요 |
| 환경변수 이름 추가/변경 여부 | 기존 Firebase Web 환경변수는 유지하고 서버용 `FIREBASE_SERVICE_ACCOUNT_JSON` 추가 | private key, client email, project id를 하나의 JSON 문자열로 관리하면 `.env.example`과 Render 설정이 단순함 | `.env.example`, README, 배포 문서 갱신 필요 |
| 인증 실패 시 응답 형식 변경 여부 | `{ message: "인증이 필요합니다." }` 형식은 유지하되 상태 코드만 `401/403`으로 명확히 구분 | 기존 프론트 오류 처리와 호환하면서 보안 의미를 분명히 할 수 있음 | 기존 API 응답의 `message` 키 유지 |
| 기존 프론트 API 호출 방식 변경 범위 | `frontend/src/api/authenticatedFetch.js` 같은 작은 공통 helper를 추가하고 주요 보호 API만 우선 교체 | 모든 화면 구조를 바꾸지 않고 Authorization 헤더 중복을 줄일 수 있음 | 인증 필요한 API 호출부 일부 수정 |
| Socket.io 인증 방식 | 연결 시 `auth: { token }`으로 ID Token 전달 | 이벤트 payload의 `userId`, `senderId`를 신뢰하지 않고 socket connection의 인증 사용자로 판단 가능 | `ChatRoom.jsx`, `backend/sockets/chat.socket.js` 수정 |

## 6. 구현 목표

1. 서버에서 Firebase ID Token을 검증하는 인증 모듈을 추가한다.
2. `requireAuth` 미들웨어를 추가해 `req.auth.uid`와 `req.userProfile`을 서버 기준 사용자로 설정한다.
3. `requireAdmin`, `requireDealer` 미들웨어를 추가해 관리자/승인 딜러 권한을 공통으로 확인한다.
4. 차량 등록, 수정, 삭제는 클라이언트 전달 `dealerId`가 아니라 인증 사용자 UID와 MongoDB 사용자 프로필로 재검증한다.
5. 관리자 사용자 목록 조회와 역할 변경은 클라이언트 전달 `requesterUid`가 아니라 인증 사용자 기준으로 재검증한다.
6. 상담방 생성, 상담방 목록, 상담방 상세, 메시지 조회, 메시지 전송은 인증 사용자가 상담방 참여자인지 확인한다.
7. Socket.io 연결과 메시지 전송에서 payload의 사용자 UID를 신뢰하지 않고 인증된 socket 사용자 기준으로 처리한다.
8. `express.json`에 size limit을 추가한다.
9. CORS 기본값을 점검하고 단일 배포/개발 환경에서 동작 가능한 범위로 정리한다.
10. 공통 에러 응답 helper 또는 middleware를 추가해 `{ message }` 형식을 유지하면서 중복을 줄인다.

## 7. 추천 파일 구조

```text
backend/
  config/
    firebaseAdmin.js
  middleware/
    auth.js
    errors.js
  routes/
    cars.routes.js
    users.routes.js
    chats.routes.js
  services/
    cars.service.js
    users.service.js
    chats.service.js
  sockets/
    chat.socket.js

frontend/src/
  api/
    authenticatedFetch.js
```

`backend/middleware/errors.js`는 14단계 계획에는 있었지만 실제 생성되지 않았다.
15단계에서 공통 응답 정리 범위로 추가하는 것이 자연스럽다.

## 8. 백엔드 변경 계획

### 8.1 Firebase Admin 초기화

| 파일 | 계획 |
| --- | --- |
| `backend/config/firebaseAdmin.js` | `firebase-admin`을 초기화하고 `verifyIdToken` helper 제공 |
| `.env.example` | 승인 시 서버 전용 `FIREBASE_SERVICE_ACCOUNT_JSON` 예시 추가 |
| `docs/deploy-guide.md` | Render Environment에 서버 전용 Firebase Admin Secret 등록 방법 추가 |

추천 방식:

```text
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

주의:

- 실제 서비스 계정 JSON 값은 문서나 코드에 작성하지 않는다.
- JSON 문자열 안의 private key 줄바꿈 처리가 필요하면 `\\n` 복원 로직을 둔다.

### 8.2 인증/권한 미들웨어

| 미들웨어 | 역할 |
| --- | --- |
| `requireAuth` | `Authorization: Bearer <idToken>` 확인, Firebase ID Token 검증, MongoDB `users` 프로필 조회 |
| `requireAdmin` | `requireAuth` 이후 `req.userProfile.role === "admin"` 확인 |
| `requireDealer` | `requireAuth` 이후 `role: "dealer"`, `dealerStatus: "approved"` 확인 |

`requireAuth`의 결과는 아래처럼 라우터와 서비스에 전달한다.

```js
req.auth = { uid: decodedToken.uid, email: decodedToken.email };
req.userProfile = mongoUserProfile;
```

### 8.3 차량 API 보강

| 라우트 | 현재 | 변경 계획 |
| --- | --- | --- |
| `POST /api/cars` | body의 `dealerId`로 딜러 확인 | `requireDealer`, `req.userProfile.uid` 기준 등록 |
| `PUT /api/cars/:id` | body의 `dealerId`로 딜러 확인 | `requireDealer`, 차량 `dealerId`와 인증 UID 비교 |
| `DELETE /api/cars/:id` | query/body의 `dealerId`로 딜러 확인 | `requireDealer`, 차량 `dealerId`와 인증 UID 비교 |
| `GET /api/cars`, `GET /api/cars/search` | 공개 조회 | 유지 |
| `GET /api/cars/:id` | 현재 프론트는 로그인 후 접근 | 서버 인증 필수 여부는 요구사항에 맞춰 `requireAuth` 적용 추천 |

프론트에서 `dealerId`, `dealerName`, `dealerRole`을 FormData에 넣는 코드는 제거하거나 서버가 무시하도록 유지한다.
서버는 등록 딜러 이름도 `req.userProfile.displayName` 기준으로 저장한다.

### 8.4 사용자 API 보강

| 라우트 | 현재 | 변경 계획 |
| --- | --- | --- |
| `POST /api/users` | body의 `uid`, `email`, `displayName` 저장 | `requireAuth` 후 토큰 UID/email 기준으로 저장, displayName은 body 보조값만 사용 |
| `GET /api/users/me` | query `uid` 기준 조회 | `requireAuth`, 인증 UID 기준 조회 |
| `POST /api/users/dealer-request` | body `requesterUid` 기준 | `requireAuth`, 인증 UID 기준 신청 |
| `GET /api/users` | query `requesterUid` 기준 admin 확인 | `requireAdmin`, requesterUid 제거 |
| `PATCH /api/users/:uid/role` | body `requesterUid` 기준 admin 확인 | `requireAdmin`, 인증 admin 기준 변경 |
| `GET /api/users/dealers` | 공개 딜러 목록 | 공개 유지 가능 |

회원가입 직후 `POST /api/users`는 Firebase 계정 생성 후 current user의 ID Token을 받아 호출해야 한다.

### 8.5 상담 REST API 보강

| 라우트 | 현재 | 변경 계획 |
| --- | --- | --- |
| `POST /api/chats/rooms` | body `buyerId`, `carId` | `requireAuth`, 인증 UID를 buyerId로 사용 |
| `GET /api/chats/rooms` | query `uid` | `requireAuth`, 인증 UID 기준 목록 조회 |
| `GET /api/chats/rooms/:roomId` | 참여자 검증 없음 | `requireAuth`, 방 참여자만 상세 조회 |
| `GET /api/chats/rooms/:roomId/messages` | 참여자 검증 없음 | `requireAuth`, 방 참여자만 메시지 조회 |

상담방 생성 시 차량의 `dealerId`는 기존처럼 차량 문서에서 가져온다.
자기 자신과 상담방 생성 차단은 유지한다.

### 8.6 Socket.io 보강

| 이벤트 | 현재 | 변경 계획 |
| --- | --- | --- |
| 연결 | 인증 없음 | `socket.handshake.auth.token` 검증 |
| `join-room` | payload `userId` 기준 참여자 확인 | 인증 UID 기준 참여자 확인 |
| `send-message` | payload `senderId`, `senderName` 기준 저장 | 인증 UID와 MongoDB 프로필 기준 저장 |
| `leave-room` | roomId 기준 나가기 | 유지 |
| `dealer-online/offline` | 딜러 UID 기준 상태 갱신 | 인증된 딜러가 참여한 방에서만 상태 갱신 |

Socket.io 이벤트 이름은 변경하지 않는다.

### 8.7 `express.json` size limit

추천:

```js
app.use(express.json({ limit: "1mb" }));
```

차량 사진은 `multipart/form-data`와 `multer` 파일 크기 제한으로 별도 관리되므로 JSON body는 작게 제한한다.

### 8.8 CORS 기본값 점검

현재 Socket.io CORS는 `process.env.CLIENT_URL || true`다.
단일 Render 배포에서는 같은 origin 요청이므로 별도 CORS가 거의 필요하지 않지만, 로컬 Vite 개발 서버에서는 `CLIENT_URL=http://localhost:5173`이 필요하다.

추천 방향:

- `CLIENT_URL`이 있으면 해당 origin만 허용한다.
- `NODE_ENV !== "production"`이고 `CLIENT_URL`이 없으면 개발 편의를 위해 `true`를 허용한다.
- `NODE_ENV === "production"`이고 `CLIENT_URL`이 없으면 same-origin 중심으로 두고 wildcard 허용을 피한다.

Express REST CORS 패키지는 현재 없고 같은 origin 구조라 새로 추가하지 않는 것을 추천한다.
분리 배포로 바꾸지 않으므로 `cors` 패키지 추가는 이번 범위에서 제외한다.

### 8.9 공통 에러 응답

추천 형식:

```json
{ "message": "오류 메시지" }
```

기존 프론트가 `errorData.message`를 읽고 있으므로 `message` 키는 유지한다.
내부 스택, 환경변수, DB 접속 문자열은 응답에 포함하지 않는다.

## 9. 프론트엔드 변경 계획

### 9.1 공통 인증 fetch helper

`frontend/src/api/authenticatedFetch.js`를 추가해 Firebase current user의 ID Token을 받아 `Authorization: Bearer <token>` 헤더를 붙인다.

적용 대상:

| 파일 | 변경 |
| --- | --- |
| `frontend/src/contexts/AuthContext.jsx` | 프로필 저장/조회/딜러 신청 API에 Authorization 추가 |
| `frontend/src/App.jsx` | 차량 상세, 등록, 수정, 삭제, 상담방 생성 보호 API에 Authorization 추가 |
| `frontend/src/components/AdminUserPanel.jsx` | 사용자 목록, 역할 변경 API에 Authorization 추가 |
| `frontend/src/components/ChatRoomList.jsx` | 상담방 목록 API에 Authorization 추가 |
| `frontend/src/components/ChatRoom.jsx` | 상담방 상세/메시지 조회 API에 Authorization 추가, Socket.io 연결에 token 전달 |

### 9.2 클라이언트 UID 전달 제거

| 현재 전달값 | 변경 |
| --- | --- |
| 차량 등록/수정 FormData `dealerId`, `dealerName`, `dealerRole` | 제거하거나 서버에서 무시 |
| 차량 삭제 query `dealerId` | 제거 |
| 상담방 생성 body `buyerId` | 제거 |
| 사용자 목록 query `requesterUid` | 제거 |
| 역할 변경 body `requesterUid` | 제거 |
| 딜러 신청 body `requesterUid` | 제거 |
| 상담방 목록 query `uid` | 제거 |
| Socket.io payload `userId`, `senderId` | 제거하거나 서버가 무시 |

화면에서 본인 메시지 표시를 위해 `userProfile.uid`를 사용하는 것은 가능하다.
다만 서버 권한 판단용으로 보내지 않는다.

## 10. 변경하지 않을 항목

| 항목 | 처리 |
| --- | --- |
| Render Web Service 단일 배포 구조 | 유지 |
| API 경로 | 유지 |
| Socket.io 이벤트 이름 | 유지 |
| MongoDB 컬렉션 구조 | 유지 |
| 외부 이미지 스토리지 | 도입하지 않음 |
| 대규모 UI 변경 | 진행하지 않음 |
| 관리자 권한 정책의 큰 변경 | 기존 `admin` 역할 기준 유지 |
| Socket.io 이벤트 이름 변경 | 진행하지 않음 |

## 11. 작업 순서

1. 사용자 확인 항목에 대한 승인 내용을 확정한다.
2. 루트에 `firebase-admin`을 설치한다.
3. `backend/config/firebaseAdmin.js`를 추가한다.
4. `backend/middleware/auth.js`, `backend/middleware/errors.js`를 추가한다.
5. `backend/server.js`에 JSON size limit, CORS 기본값, 공통 에러 middleware를 연결한다.
6. `backend/routes/users.routes.js`와 `users.service.js`를 인증 사용자 기준으로 수정한다.
7. `backend/routes/cars.routes.js`와 `cars.service.js`를 인증 딜러 기준으로 수정한다.
8. `backend/routes/chats.routes.js`와 `chats.service.js`를 인증 참여자 기준으로 수정한다.
9. `backend/sockets/chat.socket.js`를 Socket.io 인증 사용자 기준으로 수정한다.
10. 프론트에 인증 fetch helper를 추가하고 보호 API 호출에 Authorization 헤더를 적용한다.
11. 클라이언트에서 서버 권한 판단용 UID 전달을 제거한다.
12. `.env.example`, README, 배포 문서, 배포 체크리스트를 필요한 범위에서 갱신한다.
13. 구현 완료 문서 `docs/steps/2026-06-07-15-core-security-hardening.md`를 작성한다.
14. PR 요약 문서 `docs/pr/2026-06-07-15-core-security-hardening-pr.md`를 작성한다.
15. `docs/progress.md`에 15단계 결과를 기록한다.

## 12. 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| Firebase Admin 서비스 계정 환경변수 형식 오류 | `.env.example`과 배포 문서에 JSON 문자열 등록 주의사항 명시 |
| 회원가입 직후 프로필 저장 API가 토큰 발급 전 호출될 수 있음 | Firebase current user의 `getIdToken()`을 기다린 뒤 호출 |
| 프론트 fetch 호출이 흩어져 있어 누락 가능 | `rg "fetch\\(" frontend/src`로 보호 API 호출부 재검색 |
| 기존 배포 환경에 새 Secret이 없으면 인증 API가 실패 | 배포 문서와 체크리스트에 새 환경변수 등록을 명확히 기록 |
| Socket.io 인증 실패 시 채팅 UI가 연결 실패로 보일 수 있음 | `chat-error` 또는 connect error 메시지를 사용자 친화적으로 표시 |
| 기존 공개 API까지 인증을 걸어 UX가 바뀔 수 있음 | 차량 목록/검색과 딜러 목록은 공개 유지, 상세/상담/관리/변경 API는 인증 적용 |
| 에러 응답 형식 변경으로 프론트 처리 깨짐 | `{ message }` 키 유지 |

## 13. 검증 기준

| 검증 | 기준 |
| --- | --- |
| 서버 문법 확인 | 수정한 `backend/**/*.js`에 대해 `node --check` 성공 |
| 프론트 빌드 | `npm.cmd --prefix frontend run build` 성공 |
| 루트 빌드 | `npm.cmd run build` 성공 |
| 인증 없는 보호 API | 차량 등록/수정/삭제, 내 정보, 사용자 목록, 상담방 API가 `401` 응답 |
| buyer 권한 | buyer가 차량 등록/수정/삭제 시 `403` 응답 |
| dealer 권한 | 승인 딜러가 본인 차량만 등록/수정/삭제 가능 |
| admin 권한 | admin만 사용자 목록 조회와 역할 변경 가능 |
| 상담 참여자 검증 | 방 참여자가 아닌 사용자는 상담방 상세/메시지 조회/메시지 전송 불가 |
| Socket.io 검증 | 인증 토큰 없는 연결 또는 방 참여자가 아닌 연결은 메시지 송수신 불가 |
| 검색 검증 | 공개 차량 목록/검색은 기존처럼 동작 |
| 문서 검증 | `.env.example`, README, 배포 문서, 체크리스트에 Admin SDK와 Secret 등록 안내 반영 |

실제 Firebase Admin Secret과 MongoDB Atlas가 필요한 실동작 API 검증은 로컬 `.env` 또는 Render Environment 준비 여부에 따라 제한될 수 있다.

## 14. 코드 수정 전 확인 질문

아래 방향으로 진행해도 되는지 확인이 필요하다.

1. 루트 백엔드 의존성에 `firebase-admin`을 추가해도 되는가?
2. Firebase Admin SDK는 `FIREBASE_SERVICE_ACCOUNT_JSON` 환경변수 하나로 초기화하는 방식으로 진행해도 되는가?
3. `.env.example`, README, `docs/deploy-guide.md`, `docs/deploy-checklist.md`에 `FIREBASE_SERVICE_ACCOUNT_JSON` 등록 안내를 추가해도 되는가?
4. 인증 실패/권한 실패 응답은 기존 `{ message }` 형식을 유지하고 상태 코드를 `401/403`으로 구분해도 되는가?
5. 프론트 API 호출은 작은 공통 helper를 추가한 뒤 보호 API 중심으로 `Authorization: Bearer` 헤더를 붙이는 방식으로 변경해도 되는가?
6. Socket.io 연결은 `auth.token`에 Firebase ID Token을 전달하고, 서버는 payload의 `userId`, `senderId`를 신뢰하지 않는 방식으로 변경해도 되는가?

## 15. 이번 계획의 결론

15단계는 실제 보안 경계를 서버로 옮기는 작업이다.
핵심은 클라이언트가 보내는 UID 계열 값을 권한 판단에 사용하지 않고, Firebase ID Token으로 검증된 사용자와 MongoDB 사용자 프로필만 신뢰하는 것이다.

사용자 승인 후에는 위 순서대로 구현하고, 검증 결과와 한글 Conventional Commit 메시지를 함께 정리한다.
