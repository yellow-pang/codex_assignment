# 2026-06-07 14단계 백엔드 라우터와 서비스 세분화 상세 설명

## 이 문서의 목표

이번 단계에서는 13단계에서 `backend/` 아래로 이동한 서버 코드를 실제 시큐어 코딩 전에 더 세분화했다.

기존 `backend/server.js`에는 차량 API, 사용자 API, 상담 API, 권한 helper, 검색/정규화 helper, 딜러 온라인 상태, AI Agent context, Socket.io 이벤트가 함께 남아 있었다.
이번 작업은 API 경로와 동작을 유지하면서 라우터, 서비스, 유틸, 소켓 핸들러를 별도 파일로 분리하는 데 집중했다.

## 한 줄 요약

`backend/server.js`를 서버 조립 파일로 축소하고, 차량/사용자/상담 로직을 `routes`, `services`, `utils`, `sockets`로 분리했다.

## 변경한 파일 요약

| 파일 | 변경 내용 |
| --- | --- |
| `backend/server.js` | Express/Socket.io 생성, middleware, 라우터 등록, fallback, 서버 시작만 담당하도록 축소 |
| `backend/routes/cars.routes.js` | 차량 목록, 검색, 상세, 등록, 수정, 삭제 라우터 분리 |
| `backend/routes/users.routes.js` | 사용자 프로필, 관리자 사용자 목록, 딜러 신청, 역할 변경, 딜러 목록 라우터 분리 |
| `backend/routes/chats.routes.js` | 상담방 생성, 목록, 상세, 메시지 조회 라우터 분리 |
| `backend/services/cars.service.js` | 차량 DB 처리와 딜러 권한/소유자 확인 흐름 분리 |
| `backend/services/users.service.js` | 사용자 프로필, 관리자/딜러 조회, 역할 변경, 권한 helper 분리 |
| `backend/services/chats.service.js` | 상담방 생성/조회, 메시지 저장, 참여자 검증 분리 |
| `backend/services/dealerPresence.service.js` | 딜러 온라인/오프라인 상태 갱신과 시작 시 초기화 분리 |
| `backend/services/agent.service.js` | AI Agent context 생성과 `generateAgentReply` placeholder 분리 |
| `backend/services/collections.js` | MongoDB 컬렉션 접근 helper 분리 |
| `backend/sockets/chat.socket.js` | Socket.io 상담 이벤트 등록 분리 |
| `backend/utils/ids.js` | ObjectId filter, UID 정규화, 상담방 ID, MongoDB 결과 helper 분리 |
| `backend/utils/normalizers.js` | 차량/사용자/메시지 정규화와 역할 상태 helper 분리 |
| `backend/utils/search.js` | 차량 검색 query 생성 helper 분리 |

## 주요 변경 내용

### 서버 진입 파일 축소

- `backend/server.js`는 약 1293줄에서 약 77줄로 축소했다.
- dotenv 로드는 routes/services를 불러오기 전에 실행해 `INITIAL_ADMIN_EMAILS` 같은 환경변수 판정 흐름을 유지했다.
- `/uploads`, `frontend/dist`, React fallback 등록 순서는 기존 구조와 동일하게 유지했다.
- `/api/users`, `/api/cars`, `/api/chats`, 기존 `/cars` 호환 라우트를 유지했다.

### REST 라우터 분리

- 차량 API는 `backend/routes/cars.routes.js`로 분리했다.
- 사용자 API는 `backend/routes/users.routes.js`로 분리했다.
- 상담 API는 `backend/routes/chats.routes.js`로 분리했다.
- 라우터는 요청/응답과 에러 응답만 담당하고, DB 처리와 도메인 판단은 service로 위임한다.

### 서비스 분리

- 차량 생성/수정/삭제, 사용자 역할 변경, 상담방 생성, 메시지 저장 같은 DB 처리 로직을 service 파일로 옮겼다.
- `requireDealerProfile`, `requireAdminProfile`, `assertCarOwner`는 `users.service.js`로 이동했다.
- 딜러 온라인 상태는 `dealerPresence.service.js`로 이동했다.
- AI Agent 확장용 context helper는 `agent.service.js`로 이동했다.

### Socket.io 분리

- `join-room`, `send-message`, `leave-room`, `disconnect` 이벤트 처리를 `backend/sockets/chat.socket.js`로 이동했다.
- `receive-message`, `dealer-online`, `dealer-offline`, `chat-error` 이벤트 이름은 유지했다.
- Socket.io 모듈은 `setupChatSocketHandlers(io)` 형태로 `io`를 주입받는다.

## 보존한 항목

| 항목 | 내용 |
| --- | --- |
| Render 배포 구조 | 단일 Web Service 유지 |
| API 경로 | `/api/cars`, `/api/users`, `/api/chats`, 기존 `/cars` 유지 |
| Socket.io 이벤트 | 요구사항 이벤트 이름 유지 |
| MongoDB 컬렉션 | 변경 없음 |
| 업로드 경로 | 루트 `uploads/`와 `/uploads/파일명` URL 유지 |
| Firebase 인증 정책 | 변경 없음. 서버 토큰 검증은 다음 단계 |
| 신규 패키지 | 없음 |

## 검증 결과

| 검증 항목 | 결과 |
| --- | --- |
| `node --check backend/server.js` | 성공 |
| `node --check backend/routes/cars.routes.js` | 성공 |
| `node --check backend/routes/users.routes.js` | 성공 |
| `node --check backend/routes/chats.routes.js` | 성공 |
| `node --check backend/services/*.js` | 성공 |
| `node --check backend/sockets/chat.socket.js` | 성공 |
| `node --check backend/utils/*.js` | 성공 |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build` | 성공 |

참고:

- 루트 빌드 중 frontend 의존성 moderate 취약점 2건이 보고되었다.
- Vite가 `.env`의 `NODE_ENV=production` 값을 경고하지만 빌드는 성공했다.
- 이번 단계에서는 실제 `npm.cmd start`와 API 호출 검증은 실행하지 않았다. 실제 `MONGODB_URI`가 준비된 환경에서 추가 확인이 필요하다.

## 남은 확인

1. 실제 MongoDB/Firebase 환경에서 회원가입, 로그인 후 프로필 저장, 딜러 신청, admin 역할 변경을 확인한다.
2. 승인된 딜러 기준 차량 등록/수정/삭제가 기존처럼 동작하는지 확인한다.
3. 구매자/딜러 브라우저 2개로 상담방 생성, 이전 메시지 조회, 실시간 메시지 송수신을 확인한다.
4. 다음 단계에서 Firebase ID Token 서버 검증과 권한 미들웨어를 도입한다.
