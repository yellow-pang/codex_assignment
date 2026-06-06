# 8단계 Socket.io 실시간 상담과 딜러 온라인 상태 작업 계획

## 1. 작업 배경

7단계 UI 개선으로 `/chats` 상담방 목록과 `/chats/:roomId` 상담 화면의 기본 UI가 준비되었다.
현재 상담 화면은 `GET /api/chats/rooms/:roomId/messages`로 이전 메시지를 조회하지만, 메시지 전송 버튼은 아직 실제 동작하지 않는다.

이번 단계에서는 요구사항에 맞춰 Socket.io를 Express 서버와 같은 포트에서 실행하고, `ChatRoom`의 메시지 전송·수신 기능과 딜러 온라인 상태 표시를 활성화한다.

참고 문서:

- `docs/실시간_Car_Market_서비스_요구사항_정의서.md`
- `docs/실시간_Car_Market_향후_개발_계획서.md`
- `docs/실시간_Car_Market_UI_개선_분석_보고서.md`
- `docs/progress.md`
- `docs/deploy-guide.md`
- `docs/deploy-checklist.md`
- `.github/workflows/deploy.yml`

## 2. 현재 구현 상태

| 영역              | 현재 상태                                      | 이번 단계 변경 방향                             |
| ----------------- | ---------------------------------------------- | ----------------------------------------------- |
| 상담방 생성       | `POST /api/chats/rooms` 구현됨                 | 유지                                            |
| 상담방 목록       | `GET /api/chats/rooms?uid=...` 구현됨          | 필요 시 온라인 상태 표시만 보강                 |
| 이전 메시지 조회  | `GET /api/chats/rooms/:roomId/messages` 구현됨 | 유지                                            |
| 메시지 저장       | `messages` 컬렉션 준비됨, 저장 API 없음        | Socket.io `send-message` 처리에서 저장          |
| 실시간 서버       | `socket.io` 의존성 없음                        | 루트에 `socket.io` 추가                         |
| 실시간 클라이언트 | `socket.io-client` 의존성 없음                 | 프론트엔드에 `socket.io-client` 추가            |
| 서버 실행 구조    | `app.listen(port)` 사용                        | `http.createServer(app)` + Socket.io로 변경     |
| ChatRoom 전송     | 입력값 초기화만 수행                           | `send-message` emit으로 전송                    |
| 온라인 상태       | 고정 문구 표시                                 | `dealer-online`, `dealer-offline` 이벤트로 표시 |

## 3. 작업 목표

- 루트 의존성에 `socket.io`를 추가한다.
- 프론트엔드 의존성에 `socket.io-client`를 추가한다.
- Express 서버를 HTTP server로 감싸 Socket.io를 같은 포트에서 실행한다.
- Socket.io 이벤트 이름은 요구사항과 동일하게 유지한다.
- 사용자가 상담방에 입장하면 `join-room`으로 room에 참여한다.
- 사용자가 메시지를 보내면 `send-message` 이벤트를 서버로 전달한다.
- 서버는 메시지를 MongoDB `messages` 컬렉션에 저장한 뒤 같은 room에 `receive-message`를 전송한다.
- 상담방 퇴장 또는 연결 해제 시 `leave-room`과 `disconnect` 흐름을 정리한다.
- 딜러 접속 상태는 MongoDB `users` 문서에 저장하고, `dealer-online`, `dealer-offline` 이벤트로 클라이언트에 알린다.
- AI Agent 확장을 고려해 메시지 저장/전송 처리 로직은 `handleChatMessage` 함수로 분리한다.

## 4. Socket.io 이벤트 설계

요구사항의 이벤트 이름을 그대로 사용한다.

| 이벤트            | 방향             | 설명                                                         |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| `join-room`       | client -> server | 상담방 입장. `roomId`, `userId`, `role`, `dealerId` 전달     |
| `send-message`    | client -> server | 메시지 전송. `roomId`, `senderId`, `senderName`, `text` 전달 |
| `receive-message` | server -> client | 저장된 메시지를 같은 room 참여자에게 전달                    |
| `leave-room`      | client -> server | 상담방 나가기                                                |
| `dealer-online`   | server -> client | 특정 딜러가 온라인 상태임을 알림                             |
| `dealer-offline`  | server -> client | 특정 딜러가 오프라인 상태임을 알림                           |

### 4.1 `join-room` payload 초안

```json
{
  "roomId": "carId_buyerId_dealerId",
  "userId": "firebase-user-uid",
  "userName": "사용자명",
  "role": "buyer",
  "dealerId": "firebase-dealer-uid"
}
```

서버는 `roomId`, `userId`를 기본 검증한다.
`role`이 `dealer`이고 `userId`가 `dealerId`와 같으면 해당 딜러를 온라인 상태로 표시한다.

### 4.2 `send-message` payload 초안

```json
{
  "roomId": "carId_buyerId_dealerId",
  "senderId": "firebase-user-uid",
  "senderName": "사용자명",
  "text": "안녕하세요. 이 차량 상담 가능할까요?"
}
```

서버 저장 예시:

```json
{
  "roomId": "carId_buyerId_dealerId",
  "senderId": "firebase-user-uid",
  "senderName": "사용자명",
  "text": "안녕하세요. 이 차량 상담 가능할까요?",
  "createdAt": "2026-06-06T00:00:00.000Z"
}
```

## 5. 딜러 온라인 상태 기준

사용자 확인 결과, 1차 구현은 MongoDB 기반으로 처리한다.
별도 컬렉션을 만들지 않고 기존 `users` 문서에 접속 상태 필드를 보강한다.

권장 저장 형태:

```json
{
  "uid": "dealer-firebase-uid",
  "dealerOnline": true,
  "dealerSocketIds": ["socket-id-1", "socket-id-2"],
  "dealerConnectedAt": "2026-06-06T00:00:00.000Z",
  "dealerLastSeenAt": "2026-06-06T00:00:00.000Z"
}
```

동일 딜러가 여러 탭 또는 여러 기기에서 접속할 수 있으므로 `dealerSocketIds` 배열을 기준으로 관리한다.
마지막 socket 연결이 끊겼을 때만 `dealer-offline`을 전송한다.
서버가 재시작되면 이전 실행의 socket 연결은 실제로 모두 끊긴 상태이므로, 서버 시작 시 `dealerOnline: true`인 사용자를 오프라인으로 정리한다.

## 6. 백엔드 구현 계획

### 6.1 서버 실행 구조 변경

현재:

```js
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
```

변경 방향:

```js
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || true,
  },
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
```

Render 단일 Web Service 구조는 유지한다.

### 6.2 메시지 처리 함수 분리

`server.js` 안에 우선 `handleChatMessage` 함수를 둔다.
이 함수는 이후 AI Agent 응답 또는 필터링을 추가할 때 확장 지점이 된다.

처리 순서:

1. payload 검증
2. `messages` 컬렉션에 저장
3. `chat_rooms.updatedAt` 갱신
4. 저장된 메시지 객체 반환
5. Socket.io room에 `receive-message` emit

### 6.3 입력 검증

| 항목               | 처리                              |
| ------------------ | --------------------------------- |
| `roomId` 없음      | 에러 emit 또는 처리 중단          |
| `senderId` 없음    | 에러 emit 또는 처리 중단          |
| `text` 공백        | 저장하지 않음                     |
| `text` 길이 과도함 | 1차 기준 1000자 제한              |
| 존재하지 않는 room | 메시지 저장 전 상담방 조회로 차단 |

Firebase Admin SDK 기반 토큰 검증은 현재 프로젝트 정책에 없으므로 이번 단계에 새로 도입하지 않는다.

## 7. 프론트엔드 구현 계획

### 7.1 Socket.io client 연결

`ChatRoom.jsx`에서 `socket.io-client`를 사용한다.

배포 기준은 같은 origin을 우선한다.

```js
const socket = io();
```

별도 API 주소가 필요한 환경은 `VITE_API_BASE_URL`이 있으면 사용할 수 있게 한다.

```js
const socket = io(import.meta.env.VITE_API_BASE_URL || undefined);
```

### 7.2 ChatRoom 동작

처리 순서:

1. 이전 메시지를 REST API로 조회한다.
2. Socket.io에 연결한다.
3. `join-room`을 emit한다.
4. `receive-message`를 수신하면 메시지 목록에 추가한다.
5. 입력 폼 제출 시 `send-message`를 emit한다.
6. 컴포넌트 unmount 시 `leave-room` emit 후 socket 연결을 정리한다.

### 7.3 온라인 상태 표시

상단 딜러 상태 텍스트를 아래처럼 바꾼다.

| 상태     | 표시                     |
| -------- | ------------------------ |
| 온라인   | 초록 점 + `온라인`       |
| 오프라인 | 회색 점 + `오프라인`     |
| 연결 중  | 회색 점 + `상태 확인 중` |

딜러 본인이 상담방에 들어온 경우에도 본인의 온라인 상태를 볼 수 있지만, 주된 사용자는 구매자다.

## 8. 예상 변경 파일

| 파일                                                 | 변경 내용                                              |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `package.json`                                       | `socket.io` 의존성 추가                                |
| `package-lock.json`                                  | 루트 의존성 lockfile 갱신                              |
| `frontend/package.json`                              | `socket.io-client` 의존성 추가                         |
| `frontend/package-lock.json`                         | 프론트엔드 lockfile 갱신                               |
| `server.js`                                          | HTTP server + Socket.io 연결, 이벤트 처리, 메시지 저장 |
| `frontend/src/components/ChatRoom.jsx`               | Socket.io 연결, 메시지 전송·수신, 온라인 상태 표시     |
| `frontend/src/components/ChatRoomList.jsx`           | 필요 시 상담방 목록 표시 보강                          |
| `README.md`                                          | Socket.io 상담 사용 설명 보강                          |
| `docs/deploy-guide.md`                               | Socket.io 배포/환경변수 설명 보강                      |
| `docs/deploy-checklist.md`                           | 실시간 상담 검증 항목 보강                             |
| `docs/progress.md`                                   | 8단계 진행 기록 추가                                   |
| `docs/steps/2026-06-06-08-socketio-chat-presence.md` | 구현 상세 문서 추가                                    |
| `docs/pr/2026-06-06-08-socketio-chat-presence-pr.md` | PR 요약 문서 추가                                      |

## 9. 이번 단계에서 하지 않을 일

- Firebase Admin SDK 토큰 검증은 도입하지 않는다.
- MongoDB 컬렉션 구조의 큰 변경은 하지 않는다.
- Socket.io 이벤트 이름은 변경하지 않는다.
- 외부 이미지 스토리지나 외부 AI API는 도입하지 않는다.
- OpenAI 등 실제 AI Agent API 연동은 하지 않는다.
- Render Web Service 단일 배포 구조는 변경하지 않는다.
- 관리자 상담 현황 대시보드 고도화는 별도 단계로 둔다.

## 10. 검증 계획

가능한 범위에서 아래 검증을 진행한다.

| 검증 항목        | 명령 또는 방법                                                     |
| ---------------- | ------------------------------------------------------------------ |
| 서버 문법 확인   | `node --check server.js`                                           |
| 프론트엔드 빌드  | `npm.cmd --prefix frontend run build`                              |
| 루트 빌드        | `npm.cmd run build`                                                |
| 서버 실행        | `npm.cmd start`                                                    |
| 이전 메시지 조회 | `/api/chats/rooms/:roomId/messages` 응답 확인                      |
| 실시간 송수신    | 브라우저 2개 또는 탭 2개에서 같은 room 접속 후 메시지 송수신 확인  |
| 딜러 온라인 상태 | 딜러 계정 접속/종료 시 `dealer-online`, `dealer-offline` 반영 확인 |

실제 MongoDB Atlas와 Firebase 환경변수가 필요하므로, 환경값이 유효하지 않으면 문법 확인과 빌드까지 진행하고 남은 실동작 검증 항목을 별도로 보고한다.

## 11. 사용자 확인 완료 사항

사용자 확인 결과 아래 기준으로 구현한다.

1. 신규 패키지는 사용자가 프론트엔드 패키지를 먼저 추가했고, 루트 `socket.io`도 승인 범위에 따라 추가한다.

```bash
npm.cmd install socket.io
npm.cmd --prefix frontend install socket.io-client
```

2. 딜러 온라인 상태는 1차 구현에서 MongoDB `users` 문서에 저장한다.

서버 재시작 시 이전 socket 연결은 유효하지 않으므로 서버 시작 과정에서 온라인 상태를 오프라인으로 정리한다.

3. 메시지 저장 시 `messages` 컬렉션에 아래 필드를 저장한다.

```json
{
  "roomId": "상담방 ID",
  "senderId": "Firebase UID",
  "senderName": "표시 이름",
  "text": "메시지 본문",
  "createdAt": "생성 시각"
}
```

4. 메시지 길이는 1차 구현에서 1000자로 제한한다.

5. Socket.io 클라이언트 연결 주소는 같은 origin을 기본값으로 두고, `VITE_API_BASE_URL`이 있으면 그 값을 사용하는 방식으로 진행한다.

6. Firebase Admin SDK 기반 서버 토큰 검증은 이번 단계에 도입하지 않고, 기존 프로젝트 방식처럼 Firebase UID와 MongoDB 사용자 정보를 기준으로 처리한다.
