# PR: 핵심 보안 강화

## PR 제목

```text
feat: Firebase 토큰 기반 서버 권한 검증 추가
```

## 작업 배경

14단계에서 백엔드 라우터와 서비스를 분리했지만, 실제 권한 판단은 여전히 클라이언트가 전달하는 `uid`, `dealerId`, `buyerId`, `requesterUid`, `senderId`에 의존했다.

이번 작업은 Firebase ID Token을 서버에서 검증하고, 검증된 UID와 MongoDB 사용자 프로필을 기준으로 차량, 사용자, 상담 권한을 다시 확인하도록 보강했다.

## 변경 내용

### Firebase Admin SDK 도입

- 루트 의존성에 `firebase-admin`을 추가했다.
- `backend/config/firebaseAdmin.js`를 추가해 `FIREBASE_SERVICE_ACCOUNT_JSON` 기반으로 Admin SDK를 초기화한다.
- 서버는 Firebase ID Token을 검증한 뒤 토큰의 UID를 신뢰 기준으로 사용한다.

### 인증/권한 미들웨어 추가

- `backend/middleware/auth.js`를 추가했다.
- `requireAuth`로 `Authorization: Bearer` 토큰을 검증한다.
- `requireAdmin`으로 admin 권한을 확인한다.
- `requireDealer`로 승인된 dealer 권한을 확인한다.
- `requireUserProfile`로 MongoDB `users` 문서 존재 여부를 확인한다.

### 서버 권한 판단 보강

- 차량 등록, 수정, 삭제를 인증된 승인 딜러 기준으로 재검증한다.
- 관리자 사용자 목록 조회와 역할 변경을 인증된 admin 기준으로 재검증한다.
- 딜러 신청을 인증된 사용자 본인 기준으로 처리한다.
- 상담방 생성, 상담방 목록, 상담방 상세, 메시지 조회를 인증 사용자와 상담방 참여자 기준으로 검증한다.
- Socket.io 연결 시 Firebase ID Token을 검증하고, 메시지 저장 시 인증 사용자 UID와 이름을 사용한다.

### 프론트엔드 인증 요청 적용

- `frontend/src/api/authenticatedFetch.js`를 추가했다.
- 보호 API 호출에 Firebase ID Token 기반 `Authorization: Bearer` 헤더를 붙인다.
- 차량 삭제 query의 `dealerId`, 상담방 생성 body의 `buyerId`, 관리자 요청의 `requesterUid`, Socket.io 메시지의 `senderId` 전달을 제거했다.

### 공통 보안 설정

- `express.json({ limit: "1mb" })`로 JSON body 크기를 제한했다.
- Socket.io CORS 기본값을 점검해 운영 환경에서 무조건 `origin: true`가 되지 않도록 조정했다.
- 공통 에러 응답 helper를 추가하고 기존 `{ message }` 응답 형식을 유지했다.

### 문서 갱신

- `.env.example`에 `FIREBASE_SERVICE_ACCOUNT_JSON` 예시를 추가했다.
- README, 배포 가이드, 배포 체크리스트에 Firebase Admin 서비스 계정 설정을 추가했다.
- 초보자용 설정 설명을 포함한 Step 문서를 작성했다.

## 변경 파일

```text
.env.example
README.md
package.json
package-lock.json
backend/config/firebaseAdmin.js
backend/config/upload.js
backend/middleware/auth.js
backend/middleware/errors.js
backend/server.js
backend/routes/cars.routes.js
backend/routes/users.routes.js
backend/routes/chats.routes.js
backend/services/cars.service.js
backend/services/users.service.js
backend/services/chats.service.js
backend/sockets/chat.socket.js
frontend/src/api/authenticatedFetch.js
frontend/src/App.jsx
frontend/src/contexts/AuthContext.jsx
frontend/src/components/AdminUserPanel.jsx
frontend/src/components/ChatRoom.jsx
frontend/src/components/ChatRoomList.jsx
docs/plans/plan-15-core-security-hardening.md
docs/steps/2026-06-07-15-core-security-hardening.md
docs/pr/2026-06-07-15-core-security-hardening-pr.md
docs/progress.md
docs/deploy-guide.md
docs/deploy-checklist.md
```

## 보존된 항목

| 항목 | 내용 |
| --- | --- |
| Render 배포 구조 | 단일 Web Service 유지 |
| API 경로 | 기존 `/api/cars`, `/api/users`, `/api/chats`, `/cars` 유지 |
| Socket.io 이벤트 이름 | 기존 이벤트 이름 유지 |
| MongoDB 컬렉션 구조 | 변경 없음 |
| 외부 이미지 스토리지 | 도입하지 않음 |
| 대규모 UI 변경 | 없음 |
| 에러 응답 키 | 기존 `{ message }` 유지 |

## 검증

```text
node --check backend/server.js                    → 성공
node --check backend/config/firebaseAdmin.js      → 성공
node --check backend/middleware/auth.js           → 성공
node --check backend/middleware/errors.js         → 성공
node --check backend/routes/cars.routes.js        → 성공
node --check backend/routes/users.routes.js       → 성공
node --check backend/routes/chats.routes.js       → 성공
node --check backend/services/cars.service.js     → 성공
node --check backend/services/users.service.js    → 성공
node --check backend/services/chats.service.js    → 성공
node --check backend/sockets/chat.socket.js       → 성공
node --check backend/config/upload.js             → 성공
npm.cmd --prefix frontend run build               → 성공
npm.cmd run build                                 → 성공
```

참고:

- `npm install firebase-admin` 후 루트 의존성 감사에서 moderate 취약점 8건이 보고되었다.
- 루트 빌드 중 프론트엔드 의존성 moderate 취약점 2건이 보고되었다.
- Vite의 `NODE_ENV=production` 경고는 기존과 동일하며 빌드는 성공했다.

## 남은 리스크

- 실제 보호 API 검증은 `FIREBASE_SERVICE_ACCOUNT_JSON`, Firebase 프로젝트, MongoDB Atlas가 준비된 환경에서 확인해야 한다.
- Render Environment에 `FIREBASE_SERVICE_ACCOUNT_JSON`을 등록하지 않으면 보호 API가 정상 동작하지 않는다.
- `npm audit fix --force`는 breaking change 가능성이 있어 이번 작업에서는 실행하지 않았다.

## 체크리스트

- [x] Firebase Admin SDK를 추가했다.
- [x] 서버에서 Firebase ID Token을 검증한다.
- [x] `requireAuth`, `requireAdmin`, `requireDealer` 미들웨어를 추가했다.
- [x] 클라이언트 UID 입력값을 서버 권한 판단에서 제거했다.
- [x] 차량 등록/수정/삭제 권한을 인증 딜러 기준으로 재검증한다.
- [x] 관리자 역할 변경 권한을 인증 admin 기준으로 재검증한다.
- [x] 상담방과 메시지 조회/전송에서 참여자 검증을 보강했다.
- [x] Socket.io 연결 인증을 추가했다.
- [x] JSON body size limit을 추가했다.
- [x] CORS 기본값을 점검했다.
- [x] 공통 에러 응답을 정리했다.
- [x] 초보자용 설정 STEP 문서를 작성했다.
- [ ] 실제 Firebase Admin Secret이 등록된 환경에서 보호 API와 Socket.io를 확인한다.
