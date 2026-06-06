# PR: 백엔드 라우터와 서비스 세분화

## PR 제목

```text
refactor: 백엔드 라우터와 서비스 세분화
```

## 작업 배경

13단계에서 루트 서버 파일을 `backend/` 아래로 이동하고 경로/업로드 설정을 분리했다.
하지만 `backend/server.js`에는 여전히 차량 API, 사용자 API, 상담 API, 권한 helper, 정규화/검색 helper, 딜러 온라인 상태, AI Agent context, Socket.io 이벤트가 함께 남아 있었다.

이번 작업은 실제 시큐어 코딩을 적용하기 전에 서버 책임을 routes/services/utils/sockets로 나눠 Firebase 토큰 검증과 권한 미들웨어를 안전하게 추가할 수 있는 구조를 만드는 데 집중했다.

## 변경 내용

### 서버 진입 파일 축소

- `backend/server.js`를 서버 조립 파일로 축소했다.
- Express 앱 생성, 정적 파일 제공, 라우터 등록, Socket.io 연결, 서버 시작만 담당하도록 정리했다.
- dotenv 로드를 routes/services import보다 먼저 실행해 기존 환경변수 판정 흐름을 유지했다.

### 라우터 분리

- `backend/routes/cars.routes.js`를 추가했다.
- `backend/routes/users.routes.js`를 추가했다.
- `backend/routes/chats.routes.js`를 추가했다.
- 라우터는 요청/응답과 에러 메시지를 담당하고, DB 처리는 service로 위임한다.

### 서비스 분리

- `backend/services/cars.service.js`에 차량 목록/검색/상세/등록/수정/삭제 로직을 분리했다.
- `backend/services/users.service.js`에 사용자 프로필, 관리자/딜러 조회, 역할 변경, 권한 helper를 분리했다.
- `backend/services/chats.service.js`에 상담방 생성/조회, 메시지 저장, 참여자 검증을 분리했다.
- `backend/services/dealerPresence.service.js`에 딜러 온라인 상태 처리를 분리했다.
- `backend/services/agent.service.js`에 AI Agent context helper와 placeholder를 분리했다.
- `backend/services/collections.js`에 MongoDB 컬렉션 접근 helper를 분리했다.

### Socket.io와 utils 분리

- `backend/sockets/chat.socket.js`에 상담 Socket.io 이벤트를 분리했다.
- `backend/utils/ids.js`에 ID/UID helper를 분리했다.
- `backend/utils/normalizers.js`에 차량/사용자/메시지 정규화 helper를 분리했다.
- `backend/utils/search.js`에 차량 검색 query helper를 분리했다.

## 변경 파일

```text
backend/server.js
backend/routes/cars.routes.js
backend/routes/users.routes.js
backend/routes/chats.routes.js
backend/services/agent.service.js
backend/services/cars.service.js
backend/services/chats.service.js
backend/services/collections.js
backend/services/dealerPresence.service.js
backend/services/users.service.js
backend/sockets/chat.socket.js
backend/utils/ids.js
backend/utils/normalizers.js
backend/utils/search.js
docs/plans/plan-14-backend-routes-services.md
docs/steps/2026-06-07-14-backend-routes-services.md
docs/pr/2026-06-07-14-backend-routes-services-pr.md
docs/progress.md
```

## 보존된 항목

| 항목 | 내용 |
| --- | --- |
| Render 배포 구조 | 단일 Web Service 유지 |
| package 구조 | 루트 통합 package 유지 |
| API 경로 | `/api/cars`, `/api/users`, `/api/chats`, 기존 `/cars` 유지 |
| Socket.io 이벤트 | `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline` 유지 |
| MongoDB 컬렉션 | 변경 없음 |
| 업로드 경로 | 루트 `uploads/`와 `/uploads/파일명` 유지 |
| Firebase 인증 정책 | 변경 없음 |
| 신규 패키지 | 없음 |

## 검증

```text
node --check backend/server.js              → 성공
node --check backend/routes/cars.routes.js  → 성공
node --check backend/routes/users.routes.js → 성공
node --check backend/routes/chats.routes.js → 성공
node --check backend/services/*.js          → 성공
node --check backend/sockets/chat.socket.js → 성공
node --check backend/utils/*.js             → 성공
npm.cmd --prefix frontend run build         → 성공
npm.cmd run build                           → 성공
```

참고:

- 루트 빌드 중 frontend moderate 취약점 2건이 보고되었다.
- Vite의 `NODE_ENV=production` 경고는 기존과 동일하며 빌드는 성공했다.
- 실제 `npm.cmd start`와 API 호출 검증은 `MONGODB_URI`가 준비된 환경에서 추가 확인이 필요하다.

## 남은 리스크

- 서버가 아직 Firebase ID Token을 검증하지 않고 클라이언트가 보낸 UID 계열 값을 신뢰하는 흐름이 남아 있다.
- 이번 단계는 구조 리팩토링이며, 실제 인증/인가 정책 강화는 다음 시큐어 코딩 단계에서 진행해야 한다.
- 실제 MongoDB/Firebase 환경에서 주요 API와 Socket.io 상담 흐름을 다시 확인해야 한다.

## 체크리스트

- [x] `backend/server.js`를 서버 조립 파일로 축소했다.
- [x] REST API를 routes 파일로 분리했다.
- [x] DB 처리와 도메인 판단을 services 파일로 분리했다.
- [x] Socket.io 이벤트를 sockets 파일로 분리했다.
- [x] 정규화와 검색 helper를 utils 파일로 분리했다.
- [x] API 경로와 Socket.io 이벤트 이름을 유지했다.
- [x] 문법 확인과 빌드를 실행했다.
- [ ] 실제 MongoDB/Firebase 환경에서 API와 상담 기능을 확인한다.
