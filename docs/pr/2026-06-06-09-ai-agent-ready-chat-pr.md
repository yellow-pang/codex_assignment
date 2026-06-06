# PR: AI Agent 확장 구조 정리

## PR 제목

```text
refactor: AI Agent 확장 가능한 상담 구조 정리
```

## 작업 배경

Socket.io 실시간 상담은 구현되었지만, 요구사항에는 이후 AI Agent가 상담을 보조하거나 자동 응답할 수 있도록 구조를 분리해야 한다는 내용이 있다.
이번 PR은 실제 OpenAI 또는 외부 AI API를 연동하지 않고, 기존 상담 동작을 유지하면서 AI Agent가 참고할 수 있는 context 생성 구조와 placeholder 함수를 준비한다.

또한 기존 향후 개발 계획서에는 Socket.io 상담과 딜러 온라인 상태가 구현 전 기준으로 남아 있어, 이전 판단과 현재 구현 기준을 함께 알 수 있도록 기록형으로 보정했다.

## 변경 내용

### AI Agent context helper

- `getRecentRoomMessages(roomId, limit)` 함수를 추가했다.
- 최근 상담 메시지는 기본 20개로 제한한다.
- `createAgentCarContext(car)` 함수로 AI Agent가 참고할 차량 정보만 추려낸다.
- `buildAgentContext({ room, userMessage })` 함수로 상담방, 차량 정보, 최근 메시지, 딜러 온라인 상태, 사용자 질문을 하나로 묶는다.

### placeholder 함수

- `generateAgentReply(context)` 함수를 추가했다.
- 현재는 실제 AI API를 호출하지 않고 `null`을 반환한다.
- `null` 반환이므로 AI 자동 응답은 저장하거나 전송하지 않는다.
- 향후 실제 AI 연동 시 이 함수 내부만 교체할 수 있도록 했다.

### 메시지 처리 흐름

- `handleChatMessage`는 기존처럼 사용자 메시지를 저장한다.
- 메시지 저장 후 AI Agent context를 생성하고 `generateAgentReply`를 호출한다.
- Socket.io 전송부는 기존처럼 사용자 메시지만 `receive-message`로 전달한다.
- 딜러가 오프라인이고 AI 응답이 생기면 이후 단계에서 AI 메시지를 저장하고 전송할 수 있는 확장 위치를 주석으로 남겼다.

### 문서 보정

- `README.md`에 AI Agent 확장 준비 구조를 추가했다.
- `docs/progress.md`에 9단계 진행 기록을 추가했다.
- `docs/실시간_Car_Market_향후_개발_계획서.md`의 오래된 상태를 구현 기준으로 보정했다.
- 향후 개발 계획서의 딜러 온라인 상태 섹션은 기존 메모리 기반 판단을 지우지 않고, MongoDB `users` 문서 기반으로 변경한 이유를 기록형으로 남겼다.
- Step 문서와 Plan 문서를 추가했다.

## 변경 파일

```text
README.md
server.js
docs/plans/plan-09-ai-agent-ready-chat.md
docs/steps/2026-06-06-09-ai-agent-ready-chat.md
docs/pr/2026-06-06-09-ai-agent-ready-chat-pr.md
docs/progress.md
docs/실시간_Car_Market_향후_개발_계획서.md
```

## 보존된 항목

| 항목 | 이유 |
| --- | --- |
| 실제 AI API 미연동 | 이번 단계는 뼈대 정리만 진행 |
| 신규 패키지 없음 | 외부 AI SDK를 추가하지 않음 |
| 신규 환경변수 없음 | OpenAI 등 Secret이 필요하지 않음 |
| 기존 상담 동작 | `generateAgentReply`가 `null`을 반환하므로 사용자 경험 변경 없음 |
| Socket.io 이벤트 이름 | 요구사항의 이벤트 이름 유지 |
| API 경로 | 기존 `/api/chats` 구조 유지 |
| MongoDB 컬렉션 | 새 컬렉션 없이 기존 `cars`, `chat_rooms`, `messages`, `users` 조회 |

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

- Vite가 `.env`의 `NODE_ENV=production`에 대해 경고를 출력했지만 빌드는 성공했다.
- `npm.cmd run build`에서 moderate 취약점 2개가 보고되었지만, 강제 업데이트는 이번 범위에서 제외했다.

## 남은 리스크

- 실제 AI API 연동은 아직 없다.
- AI 자동 응답 저장과 전송은 다음 단계에서 별도 사용자 확인 후 활성화해야 한다.
- Firebase Admin SDK를 사용하지 않으므로 서버의 Firebase ID 토큰 검증은 아직 없다.
- 실제 상담 실동작은 Firebase 구매자/딜러 계정과 MongoDB Atlas 연결 환경에서 확인해야 한다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서와 현재 코드를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] 실제 AI API를 연동하지 않았다.
- [x] 신규 패키지를 추가하지 않았다.
- [x] 신규 환경변수를 추가하지 않았다.
- [x] AI Agent context helper를 추가했다.
- [x] `generateAgentReply` placeholder를 추가했다.
- [x] 기존 상담 메시지 저장과 전송 동작을 유지했다.
- [x] 향후 개발 계획서를 구현 기준 보정 기록 형태로 갱신했다.
- [x] 서버 JS 문법 검사를 실행했다.
- [x] 프론트엔드 빌드를 실행했다.
- [x] 루트 빌드를 실행했다.
- [ ] 실제 Firebase/MongoDB 환경에서 상담 송수신을 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.

