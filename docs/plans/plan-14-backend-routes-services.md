# 14단계 백엔드 라우터와 서비스 세분화 계획

## 1. 문서 목적

13단계에서 루트 `server.js`, `db.js`를 `backend/` 아래로 이동하고 경로/업로드 설정을 분리했다.
이번 14단계는 실제 시큐어 코딩을 시작하기 전에 `backend/server.js`에 남아 있는 라우터, 서비스성 함수, 권한 helper, Socket.io 핸들러를 더 세분화하는 작업 방향을 정리한다.

이번 작업의 목표는 보안 기능을 추가하는 것이 아니라, Firebase ID Token 검증과 권한 미들웨어를 이후 단계에서 안전하게 넣을 수 있도록 백엔드 모듈 책임을 정리하는 것이다.

## 2. 현재 작업 상태

| 항목           | 내용                                                 |
| -------------- | ---------------------------------------------------- |
| 현재 브랜치    | `refactor/backend-routes-services`                   |
| 기준 단계      | 13단계 백엔드 구조 분리와 보안 기반 리팩토링 완료 후 |
| 미커밋 변경    | 계획 작성 전 기준 없음                               |
| 작업 성격      | 시큐어 코딩 전 백엔드 모듈 세분화                    |
| 코드 수정 여부 | 이 문서 작성 단계에서는 코드 수정 없음               |
| 배포 방향      | Render Web Service 단일 배포 유지                    |

## 3. 확인한 문서와 파일

| 구분           | 확인 대상                                                         | 확인 내용                                                                      |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 저장소 규칙    | `AGENTS.md`                                                       | 중간 이상 작업은 계획 문서 작성 후 사용자 확인 필요                            |
| 이전 계획      | `docs/plans/plan-13-backend-structure-secure-foundation.md`       | 라우터, 서비스, 미들웨어, Socket.io 핸들러 분리 필요성 확인                    |
| 이전 완료 문서 | `docs/steps/2026-06-07-13-backend-structure-secure-foundation.md` | `backend/` 이동, 경로 설정, 업로드 설정 분리 완료 확인                         |
| 배포 문서      | `docs/deploy-guide.md`, `docs/deploy-checklist.md`                | 단일 Render Web Service와 루트 통합 package 구조 유지 확인                     |
| 서버 진입 파일 | `backend/server.js`                                               | 약 1293줄. 라우터, 서비스성 함수, 권한 helper, Socket.io가 한 파일에 남아 있음 |
| DB 연결        | `backend/db.js`                                                   | MongoDB 연결과 컬렉션 이름 관리 유지                                           |
| 설정 파일      | `backend/config/paths.js`, `backend/config/upload.js`             | 경로와 업로드 설정은 이미 분리됨                                               |

## 4. 현재 `backend/server.js` 상태

`backend/server.js`에는 아래 책임이 아직 함께 남아 있다.

| 책임               | 현재 상태                                                                                  | 분리 필요성                         |
| ------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| Express 앱 생성    | 서버 파일에서 담당                                                                         | 유지 가능                           |
| 정적 파일 제공     | `/uploads`, `frontend/dist`, React fallback 등록                                           | 서버 파일에 유지 가능               |
| 차량 API           | `carsRouter`가 서버 파일 내부에 있음                                                       | 라우터/서비스 분리 필요             |
| 사용자 API         | `usersRouter`가 서버 파일 내부에 있음                                                      | 라우터/서비스 분리 필요             |
| 상담 API           | `chatsRouter`가 서버 파일 내부에 있음                                                      | 라우터/서비스 분리 필요             |
| 권한 helper        | `requireDealerProfile`, `requireAdminProfile`, `assertCarOwner` 등이 서버 파일 내부에 있음 | 후속 인증 미들웨어를 위해 분리 필요 |
| 정규화/검증 helper | UID, 사용자, 차량, 검색 조건, 메시지 정규화 함수가 서버 파일 내부에 있음                   | utils 분리 필요                     |
| 딜러 온라인 상태   | DB 업데이트 함수와 Socket.io emit 함수가 서버 파일 내부에 있음                             | service/socket 분리 필요            |
| AI Agent 준비      | context helper와 `generateAgentReply` placeholder가 서버 파일 내부에 있음                  | service 분리 필요                   |
| Socket.io 이벤트   | `setupSocketHandlers`가 서버 파일 내부에 있음                                              | socket module 분리 필요             |

## 5. 구현 목표

1. `backend/server.js`는 앱 생성, 공통 middleware 등록, 라우터 등록, 정적 파일 제공, Socket.io 연결, 서버 시작만 담당하도록 축소한다.
2. 차량, 사용자, 상담 REST API를 `backend/routes/*`로 분리한다.
3. DB 조회/수정과 비즈니스 로직을 `backend/services/*`로 분리한다.
4. UID, ObjectId, 검색 조건, 정규화 helper를 `backend/utils/*`로 분리한다.
5. 딜러 온라인 상태와 상담 메시지 처리를 서비스 파일로 분리한다.
6. Socket.io 이벤트 등록을 `backend/sockets/chat.socket.js`로 분리한다.
7. API 경로, 응답 형식, Socket.io 이벤트 이름, MongoDB 컬렉션 구조는 변경하지 않는다.
8. Firebase Admin SDK 도입, 토큰 검증, 실제 인증/인가 정책 변경은 다음 시큐어 코딩 단계로 넘긴다.

## 6. 추천 폴더 구조

```text
backend/
  server.js
  db.js
  config/
    paths.js
    upload.js
  middleware/
    errors.js
  routes/
    cars.routes.js
    users.routes.js
    chats.routes.js
  services/
    agent.service.js
    cars.service.js
    chats.service.js
    dealerPresence.service.js
    users.service.js
  sockets/
    chat.socket.js
  utils/
    ids.js
    normalizers.js
    search.js
```

## 7. 파일별 분리 방향

### 7.1 `backend/server.js`

| 유지할 책임     | 내용                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| dotenv 설정     | 루트 `.env` 경로 유지                                                  |
| Express 생성    | `app`, HTTP server, Socket.io server 생성                              |
| 공통 middleware | `express.json`, `/uploads`, React 정적 파일 등록                       |
| 라우터 등록     | `/api/users`, `/api/cars`, `/api/chats`, 기존 `/cars` 호환 라우트 등록 |
| 에러 처리       | 업로드/공통 에러 middleware 연결                                       |
| React fallback  | `/`, `*` fallback 유지                                                 |
| 서버 시작       | MongoDB 연결, 딜러 온라인 상태 초기화, Socket.io 핸들러 등록, listen   |

### 7.2 `backend/routes/cars.routes.js`

| 라우트        | 기존 동작                            |
| ------------- | ------------------------------------ |
| `GET /`       | 차량 목록 조회                       |
| `GET /search` | 복합 검색                            |
| `GET /:id`    | 차량 상세 조회                       |
| `POST /`      | 승인된 딜러 차량 등록, 이미지 업로드 |
| `PUT /:id`    | 차량 소유 딜러 수정, 이미지 교체     |
| `DELETE /:id` | 차량 소유 딜러 삭제                  |

### 7.3 `backend/routes/users.routes.js`

| 라우트                 | 기존 동작                                       |
| ---------------------- | ----------------------------------------------- |
| `POST /`               | Firebase 회원가입 후 MongoDB 사용자 프로필 저장 |
| `GET /`                | 관리자 기준 사용자 목록 조회                    |
| `GET /me`              | UID 기준 내 프로필 조회                         |
| `POST /dealer-request` | buyer 딜러 신청                                 |
| `PATCH /:uid/role`     | admin 사용자 역할/딜러 상태 변경                |
| `GET /dealers`         | 승인된 딜러 목록 조회                           |

### 7.4 `backend/routes/chats.routes.js`

| 라우트                        | 기존 동작                           |
| ----------------------------- | ----------------------------------- |
| `POST /rooms`                 | 차량 기준 상담방 생성 또는 재사용   |
| `GET /rooms`                  | 로그인 사용자 기준 상담방 목록 조회 |
| `GET /rooms/:roomId`          | 상담방 상세 조회                    |
| `GET /rooms/:roomId/messages` | 이전 메시지 조회                    |

### 7.5 `backend/services/*`

| 파일                        | 책임                                                     |
| --------------------------- | -------------------------------------------------------- |
| `cars.service.js`           | 차량 목록/검색/상세/등록/수정/삭제, 차량 소유자 확인     |
| `users.service.js`          | 사용자 정규화, 프로필 저장, admin/dealer 조회, 역할 변경 |
| `chats.service.js`          | 상담방 생성/조회, 메시지 저장, 참여자 검증               |
| `dealerPresence.service.js` | 딜러 온라인/오프라인 상태 갱신과 시작 시 초기화          |
| `agent.service.js`          | AI Agent context 생성과 `generateAgentReply` placeholder |

### 7.6 `backend/utils/*`

| 파일             | 책임                                                            |
| ---------------- | --------------------------------------------------------------- |
| `ids.js`         | `ObjectId` 기반 차량 ID filter 생성, UID 정규화, 상담방 ID 생성 |
| `normalizers.js` | 차량 입력, 사용자 입력, 사용자 문서, 메시지 본문 정규화         |
| `search.js`      | 검색어 escape, 숫자 검색 조건 파싱, 차량 검색 query 생성        |

### 7.7 `backend/sockets/chat.socket.js`

| 이벤트         | 기존 동작                                                   |
| -------------- | ----------------------------------------------------------- |
| `join-room`    | 상담방 존재/참여자 확인 후 room 입장, 딜러 온라인 상태 emit |
| `send-message` | 메시지 저장 후 `receive-message` emit                       |
| `leave-room`   | room 나가기                                                 |
| `disconnect`   | 딜러 오프라인 상태 갱신                                     |

## 8. 이번 단계에서 변경하지 않는 항목

| 항목                        | 이유                                                   |
| --------------------------- | ------------------------------------------------------ |
| Firebase Admin SDK 추가     | 실제 인증 검증은 다음 시큐어 코딩 단계에서 진행        |
| 인증/인가 정책 변경         | 이번 단계는 구조 분리이며 권한 판단 결과를 바꾸지 않음 |
| API 경로 변경               | 프론트엔드 호출과 배포 문서가 `/api/*` 기준            |
| Socket.io 이벤트 이름 변경  | 요구사항 이벤트 이름 유지                              |
| MongoDB 컬렉션 구조 변경    | DB 구조 변경은 큰 작업이며 사용자 확인 필요            |
| 환경변수 이름 변경          | Render Environment 재설정이 필요할 수 있음             |
| Render 배포 구조 변경       | 단일 Web Service 유지                                  |
| `backend/package.json` 추가 | 루트 통합 package 구조 유지                            |
| 신규 npm 패키지 추가        | 구조 분리에는 새 패키지가 필요하지 않음                |

## 9. 작업 순서

1. `backend/utils/ids.js`, `backend/utils/normalizers.js`, `backend/utils/search.js`를 만든다.
2. `backend/services/users.service.js`를 만들고 사용자/권한 helper를 이동한다.
3. `backend/services/cars.service.js`를 만들고 차량 DB 처리와 소유자 확인을 이동한다.
4. `backend/services/dealerPresence.service.js`를 만들고 딜러 온라인 상태 처리를 이동한다.
5. `backend/services/agent.service.js`를 만들고 AI Agent context helper와 placeholder를 이동한다.
6. `backend/services/chats.service.js`를 만들고 상담방/메시지 처리 로직을 이동한다.
7. `backend/routes/users.routes.js`, `cars.routes.js`, `chats.routes.js`를 만든다.
8. `backend/sockets/chat.socket.js`를 만들고 Socket.io 이벤트 등록을 이동한다.
9. `backend/middleware/errors.js`를 만들고 업로드 에러 middleware 연결을 정리한다.
10. `backend/server.js`는 라우터와 Socket.io 모듈을 조립하는 진입 파일로 축소한다.
11. 각 단계마다 주요 파일 `node --check`를 실행한다.
12. 전체 이동 후 `npm.cmd --prefix frontend run build`, `npm.cmd run build`를 실행한다.
13. 구현 완료 후 Step, PR, progress, 필요한 배포 문서를 갱신한다.

## 10. 리스크와 대응

| 리스크                                       | 대응                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| 모듈 분리 중 순환 참조가 생길 수 있음        | 서비스가 utils와 db helper를 참조하고, 라우터는 서비스만 참조하도록 방향을 고정 |
| 라우터 분리 중 API 경로가 바뀔 수 있음       | 기존 `app.use` prefix와 router 내부 path를 표로 대조                            |
| Socket.io에서 `io` 접근이 꼬일 수 있음       | `setupChatSocketHandlers(io)` 형태로 명시적으로 주입                            |
| 딜러 온라인 상태 emit이 누락될 수 있음       | `dealer-online`, `dealer-offline` 이벤트 이름을 검색 검증                       |
| 권한 helper 이동 중 응답 코드가 바뀔 수 있음 | 기존 error `statusCode`와 message를 유지                                        |
| 보안 기능 변경이 섞일 수 있음                | 토큰 검증/정책 변경은 이번 단계에서 하지 않음                                   |
| 문서와 실제 구조가 달라질 수 있음            | 완료 후 README, deploy 문서, progress, Step, PR 갱신                            |

## 11. 검증 기준

| 검증                  | 기준                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| 서버 문법 확인        | `backend/**/*.js` 주요 파일 `node --check` 성공                                                      |
| 프론트 빌드           | `npm.cmd --prefix frontend run build` 성공                                                           |
| 루트 빌드             | `npm.cmd run build` 성공                                                                             |
| API 경로 검색         | `/api/cars`, `/api/users`, `/api/chats`, `/cars` 유지                                                |
| Socket.io 이벤트 검색 | `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline` 유지 |
| 정적 파일 경로        | `frontend/dist`, `/uploads` 제공 경로 유지                                                           |
| 문서                  | Step, PR, progress에 변경 내용과 남은 보안 리스크 기록                                               |

## 12. 이번 계획의 결론

14단계는 시큐어 코딩 직전의 마지막 구조 리팩토링 단계로 진행한다.

이번 단계가 끝나면 `backend/server.js`는 서버 조립만 담당하고, 실제 도메인 로직은 routes/services/utils/sockets로 나뉜다.
그 다음 단계에서 Firebase ID Token 검증, `requireAuth`, `requireDealer`, `requireAdmin`, Socket.io 인증 보강을 적용하는 것이 가장 안정적이다.
