# PR: Socket.io 실시간 상담과 딜러 온라인 상태 구현

## PR 제목

```text
feat: Socket.io 실시간 상담과 딜러 온라인 상태 구현
```

## 작업 배경

7단계에서 상담방 목록과 채팅 화면 UI는 준비되었지만, `ChatRoom`의 메시지 전송 버튼은 실제로 동작하지 않았다.
요구사항의 실시간 상담 기능을 완성하려면 Express 서버와 같은 포트에서 Socket.io를 실행하고, 상담방 입장, 메시지 전송·수신, 딜러 온라인 상태 이벤트를 연결해야 했다.

또한 딜러 온라인 상태는 단순 메모리 상태보다 추적이 쉬운 MongoDB 기반 구현 가능성을 확인한 뒤, 기존 `users` 컬렉션에 접속 상태 필드를 보강하는 방식으로 진행했다.

## 변경 내용

### Socket.io 서버 연결

- 루트 서버에 `socket.io`를 추가했다.
- Express 앱을 `http.createServer(app)`로 감싸 Socket.io를 같은 포트에서 실행하도록 변경했다.
- Render Web Service 단일 배포 구조는 유지했다.
- Socket.io CORS origin은 `CLIENT_URL` 환경변수를 우선 사용하도록 했다.

### 상담방 이벤트

- 요구사항의 이벤트 이름을 그대로 유지했다.
- `join-room`: 상담방 존재 여부와 참여자 UID를 확인한 뒤 Socket.io room에 입장한다.
- `send-message`: 메시지를 검증하고 MongoDB `messages` 컬렉션에 저장한다.
- `receive-message`: 저장된 메시지를 같은 상담방 참여자에게 전달한다.
- `leave-room`: 상담방 room에서 나간다.
- `dealer-online`: 딜러 접속 상태를 온라인으로 전달한다.
- `dealer-offline`: 딜러 접속 상태를 오프라인으로 전달한다.

### 메시지 저장

- 서버가 `send-message`를 받으면 `handleChatMessage` 함수에서 메시지를 처리한다.
- 메시지 본문은 공백 제거 후 최대 1000자로 제한한다.
- 상담방이 없거나, 메시지 발신자가 상담방 참여자가 아니면 저장하지 않고 `chat-error`를 보낸다.
- 메시지 저장 후 `chat_rooms` 문서의 `lastMessage`, `lastMessageAt`, `updatedAt`도 갱신한다.

### 딜러 온라인 상태

- 새 컬렉션은 만들지 않고 기존 `users` 컬렉션에 온라인 상태 필드를 추가한다.
- `dealerOnline`, `dealerSocketIds`, `dealerConnectedAt`, `dealerLastSeenAt` 필드로 딜러 접속 상태를 관리한다.
- 동일 딜러가 여러 탭 또는 여러 기기로 접속할 수 있으므로 `dealerSocketIds` 배열을 기준으로 마지막 연결 종료 여부를 판단한다.
- 서버 시작 시 이전 실행에서 남은 딜러 온라인 상태를 오프라인으로 정리한다.

### 프론트엔드 ChatRoom

- 프론트엔드에 `socket.io-client`를 추가했다.
- `ChatRoom.jsx`에서 이전 메시지는 REST API로 조회하고, 신규 메시지는 Socket.io로 전송·수신하도록 변경했다.
- `receive-message` 이벤트를 받으면 메시지 목록에 즉시 추가한다.
- 상단 딜러 상태 표시를 `온라인`, `오프라인`, `상태 확인 중`으로 표시하도록 변경했다.
- Socket.io 연결 주소는 같은 origin을 기본으로 사용하고, `VITE_API_BASE_URL`이 있으면 해당 값을 사용한다.

### 신규 API

- `GET /api/chats/rooms/:roomId` 상담방 상세 API를 추가했다.
- 이 API는 `/chats/:roomId` 직접 접근 또는 새로고침 시 상담방 정보와 초기 딜러 온라인 상태를 복구하는 데 사용한다.

### 문서 갱신

- `README.md`에 실시간 상담 동작과 MongoDB 기반 딜러 온라인 상태 기준을 추가했다.
- `.env.example`에 선택 환경변수 `VITE_API_BASE_URL` 예시를 추가했다.
- 배포 가이드와 배포 체크리스트에 Socket.io 상담 검증 항목을 추가했다.
- progress, step, plan 문서를 갱신했다.

## 변경 파일

```text
.env.example
README.md
package.json
package-lock.json
server.js
frontend/package.json
frontend/package-lock.json
frontend/src/components/ChatRoom.jsx
docs/plans/plan-08-socketio-chat-presence.md
docs/steps/2026-06-06-08-socketio-chat-presence.md
docs/pr/2026-06-06-08-socketio-chat-presence-pr.md
docs/progress.md
docs/deploy-guide.md
docs/deploy-checklist.md
```

## 보존된 항목

| 항목 | 이유 |
| --- | --- |
| Render 단일 Web Service 구조 | Express API, React 정적 파일, Socket.io를 같은 서버에서 제공 |
| Firebase Admin SDK 미도입 | 기존 프로젝트 방식대로 Firebase UID와 MongoDB 사용자 정보를 기준으로 처리 |
| Socket.io 이벤트 이름 | 요구사항의 이벤트 이름 유지 |
| API 기본 경로 | `/api/chats` 구조 유지 |
| MongoDB 컬렉션 | 새 컬렉션 없이 기존 `users`, `chat_rooms`, `messages` 사용 |

## 검증

실행 완료:

```text
node --check server.js
npm.cmd --prefix frontend run build
npm.cmd run build
```

결과:

```text
성공
```

참고:

- 프론트엔드 빌드는 최초 샌드박스 내부 실행에서 esbuild `spawn EPERM`으로 실패했으나, 권한 상승 후 성공했다.
- `npm.cmd run build`에서 moderate 취약점 2개가 보고되었지만, 강제 업데이트는 이번 범위에서 제외했다.
- Vite가 `.env`의 `NODE_ENV=production`에 대해 경고를 출력했지만 빌드는 성공했다.

## 남은 리스크

- 실제 Firebase 구매자/딜러 계정과 MongoDB Atlas 연결 환경에서 실시간 송수신을 최종 확인해야 한다.
- Render 배포 후 Socket.io가 같은 origin에서 정상 연결되는지 확인해야 한다.
- 서버 재시작 시 기존 Socket.io 연결은 모두 끊기므로, 시작 과정에서 딜러 온라인 상태를 오프라인으로 정리한다.
- Firebase Admin SDK를 사용하지 않으므로 서버의 Firebase ID 토큰 검증은 아직 없다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서와 현재 코드를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] 루트 서버에 `socket.io`를 추가했다.
- [x] 프론트엔드에 `socket.io-client`를 추가했다.
- [x] Express 서버를 HTTP server 구조로 변경했다.
- [x] Socket.io 이벤트 이름을 요구사항과 동일하게 유지했다.
- [x] `ChatRoom` 메시지 전송·수신을 활성화했다.
- [x] 메시지를 MongoDB `messages` 컬렉션에 저장하도록 했다.
- [x] 딜러 온라인 상태를 MongoDB `users` 문서 기반으로 관리했다.
- [x] 서버 JS 문법 검사를 실행했다.
- [x] 프론트엔드 빌드를 실행했다.
- [x] 루트 빌드를 실행했다.
- [ ] 실제 Firebase/MongoDB 환경에서 구매자·딜러 실시간 상담을 확인한다.
- [ ] Render 배포 후 Socket.io 연결을 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.

