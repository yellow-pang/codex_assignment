# 8단계 Socket.io 실시간 상담과 딜러 온라인 상태 구현 상세

## 1. 작업 목표

`/chats/:roomId` 상담 화면에서 메시지 전송·수신을 실제로 동작시키고, `dealer-online`, `dealer-offline` 이벤트로 딜러 온라인 상태를 표시하도록 구현했다.

이번 단계는 Render Web Service 단일 배포 구조를 유지하면서 Express 서버와 같은 포트에서 Socket.io를 실행하는 방식으로 진행했다.

## 2. 변경 요약

| 파일 | 변경 내용 |
| --- | --- |
| `server.js` | HTTP server + Socket.io 연결, 상담 이벤트 처리, 메시지 저장, 딜러 온라인 상태 갱신 |
| `frontend/src/components/ChatRoom.jsx` | Socket.io client 연결, 메시지 전송·수신, 온라인 상태 표시 |
| `package.json`, `package-lock.json` | 루트 `socket.io` 의존성 추가 |
| `frontend/package.json`, `frontend/package-lock.json` | `socket.io-client` 의존성 추가 |
| `.env.example` | 선택 환경변수 `VITE_API_BASE_URL` 예시 추가 |
| `README.md` | 실시간 상담 동작과 MongoDB 온라인 상태 기준 보강 |
| `docs/deploy-guide.md` | Socket.io 배포 검증과 환경변수 설명 보강 |
| `docs/deploy-checklist.md` | 실시간 상담 배포 후 확인 항목 추가 |
| `docs/progress.md` | 8단계 진행 기록 추가 |

## 3. 서버 구현

### 3.1 Express와 Socket.io 같은 포트 실행

기존 `app.listen(port)` 구조를 유지하면 Socket.io 서버를 같은 포트에 붙이기 어렵다.
그래서 `http.createServer(app)`로 Express 앱을 감싸고, 그 server 인스턴스에 Socket.io를 연결했다.

```js
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || true,
  },
});
```

서버 시작은 아래처럼 변경했다.

```js
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
```

### 3.2 구현한 Socket.io 이벤트

요구사항의 이벤트 이름을 그대로 유지했다.

| 이벤트 | 방향 | 처리 |
| --- | --- | --- |
| `join-room` | client -> server | 상담방 존재 여부와 참여자 UID를 확인한 뒤 Socket.io room에 입장 |
| `send-message` | client -> server | 메시지를 검증하고 MongoDB에 저장 |
| `receive-message` | server -> client | 저장된 메시지를 같은 상담방 참여자에게 전달 |
| `leave-room` | client -> server | 상담방 room에서 나감 |
| `dealer-online` | server -> client | 딜러가 상담방에 접속하면 온라인 상태 전달 |
| `dealer-offline` | server -> client | 딜러의 마지막 socket 연결이 끊기면 오프라인 상태 전달 |

### 3.3 메시지 저장 방식

메시지 저장 로직은 `handleChatMessage` 함수로 분리했다.
이 함수는 이후 AI Agent 자동 응답이나 메시지 필터링을 붙일 때 확장 지점으로 사용할 수 있다.

저장 필드:

```json
{
  "roomId": "상담방 ID",
  "senderId": "Firebase UID",
  "senderName": "표시 이름",
  "text": "메시지 본문",
  "createdAt": "생성 시각"
}
```

검증 기준:

| 항목 | 처리 |
| --- | --- |
| `roomId` 없음 | 저장하지 않고 `chat-error` 전송 |
| `senderId` 없음 | 저장하지 않고 `chat-error` 전송 |
| 공백 메시지 | 저장하지 않음 |
| 1000자 초과 | 앞 1000자까지만 저장 |
| 상담방 없음 | 저장하지 않고 `chat-error` 전송 |
| 상담방 참여자가 아님 | 저장하지 않고 `chat-error` 전송 |

메시지 저장 후 `chat_rooms` 문서의 `lastMessage`, `lastMessageAt`, `updatedAt`도 함께 갱신한다.

## 4. 딜러 온라인 상태 구현

사용자 요청에 따라 단순 메모리 Map이 아니라 MongoDB를 이용하는 방식으로 구현했다.
별도 컬렉션을 새로 만들지 않고 기존 `users` 컬렉션의 딜러 사용자 문서에 필드를 추가한다.

추가 필드:

| 필드 | 설명 |
| --- | --- |
| `dealerOnline` | 현재 온라인 여부 |
| `dealerSocketIds` | 현재 연결된 Socket.io socket id 목록 |
| `dealerConnectedAt` | 온라인 전환 시각 |
| `dealerLastSeenAt` | 마지막 접속 또는 종료 시각 |

동일 딜러가 여러 탭 또는 여러 기기에서 접속할 수 있으므로 `dealerSocketIds` 배열을 사용한다.
마지막 socket id가 제거될 때만 `dealerOnline`을 `false`로 바꾸고 `dealer-offline`을 전송한다.

서버 재시작 시 이전 socket 연결은 모두 끊긴 상태이므로, 시작 과정에서 `dealerOnline: true`인 사용자를 오프라인으로 정리한다.

## 5. 프론트엔드 구현

`ChatRoom.jsx`는 아래 순서로 동작한다.

1. `GET /api/chats/rooms/:roomId`로 상담방 정보와 딜러 온라인 상태를 조회한다.
2. `GET /api/chats/rooms/:roomId/messages`로 이전 메시지를 조회한다.
3. Socket.io client를 연결한다.
4. 연결되면 `join-room` 이벤트를 보낸다.
5. `receive-message`를 받으면 메시지 목록에 추가한다.
6. 입력 폼 제출 시 `send-message` 이벤트를 보낸다.
7. `dealer-online`, `dealer-offline` 이벤트를 받아 상단 상태 표시를 갱신한다.
8. 컴포넌트가 사라지면 `leave-room`을 보낸 뒤 socket 연결을 종료한다.

Socket.io 연결 주소는 같은 origin을 기본으로 사용한다.
분리 배포처럼 별도 API 주소가 필요하면 `VITE_API_BASE_URL` 값을 사용한다.

## 6. 신규 API

### GET `/api/chats/rooms/:roomId`

상담방 상세 정보를 조회한다.

사용 목적:

- `/chats/:roomId` 직접 접근
- 새로고침 후 상담방 정보 복구
- 초기 딜러 온라인 상태 조회

응답에는 기존 상담방 정보와 함께 아래 필드를 포함한다.

```json
{
  "dealerOnline": true,
  "dealerLastSeenAt": "2026-06-06T00:00:00.000Z"
}
```

## 7. 검증 결과

| 검증 | 결과 |
| --- | --- |
| `node --check server.js` | 성공 |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build` | 성공 |

프론트엔드 빌드는 최초 샌드박스 내부 실행에서 esbuild `spawn EPERM`으로 실패했다.
권한 상승 후 동일 명령은 성공했다.

`npm.cmd run build` 과정에서 프론트엔드 의존성의 moderate 취약점 2개가 보고되었다.
이번 작업 범위는 Socket.io 상담 연결이므로 `npm audit fix --force`는 실행하지 않았다.

Vite 빌드 중 `.env`의 `NODE_ENV=production` 값에 대한 경고가 출력되었다.
빌드는 성공했지만, 로컬 `.env`에서 `NODE_ENV`를 Vite 빌드 모드로 쓰려는 경우 별도 정리가 필요하다.

## 8. 남은 실동작 확인

아래 항목은 실제 MongoDB Atlas와 Firebase 계정이 연결된 실행 환경에서 확인해야 한다.

1. 구매자와 딜러 계정으로 각각 로그인한다.
2. 같은 상담방을 브라우저 2개 또는 탭 2개에서 연다.
3. 구매자 메시지가 딜러 화면에 실시간 표시되는지 확인한다.
4. 딜러 메시지가 구매자 화면에 실시간 표시되는지 확인한다.
5. MongoDB `messages` 컬렉션에 메시지가 저장되는지 확인한다.
6. 딜러 접속 시 구매자 화면의 상태가 온라인으로 바뀌는지 확인한다.
7. 딜러 접속 종료 시 구매자 화면의 상태가 오프라인으로 바뀌는지 확인한다.
8. MongoDB `users` 문서의 딜러 온라인 상태 필드가 갱신되는지 확인한다.

