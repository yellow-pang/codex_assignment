# 9단계 AI Agent 확장 구조 정리 구현 상세

## 1. 작업 목표

이번 단계는 실제 AI Agent를 완성하는 작업이 아니다.
Socket.io 상담 흐름에 나중에 AI Agent가 들어올 수 있도록 서버 메시지 처리 구조를 정리하고, 실제 외부 API 호출 없이 placeholder 함수를 준비하는 것이 목표다.

사용자 확인에 따라 아래 기준으로 진행했다.

- OpenAI 또는 외부 AI API는 연동하지 않는다.
- 새 npm 패키지와 새 환경변수는 추가하지 않는다.
- `generateAgentReply`는 기본적으로 `null`을 반환한다.
- 기존 상담 메시지 저장과 실시간 전송 동작은 바꾸지 않는다.
- 최근 메시지는 20개만 AI Agent context에 포함한다.
- 오래된 향후 개발 계획서는 이전 판단을 삭제하지 않고 구현 기준 보정 기록으로 남긴다.

## 2. 변경 요약

| 파일 | 변경 내용 |
| --- | --- |
| `server.js` | AI Agent context helper와 `generateAgentReply` placeholder 추가 |
| `README.md` | AI Agent 확장 준비 설명 추가 |
| `docs/실시간_Car_Market_향후_개발_계획서.md` | 실제 구현 기준 보정 기록 추가 |
| `docs/progress.md` | 9단계 진행 기록 추가 |
| `docs/plans/plan-09-ai-agent-ready-chat.md` | 작업 계획과 사용자 확인 완료 사항 정리 |
| `docs/pr/2026-06-06-09-ai-agent-ready-chat-pr.md` | PR 요약 문서 추가 |

## 3. 서버 구조 변경

### 3.1 최근 메시지 조회

`getRecentRoomMessages(roomId, limit)` 함수를 추가했다.

역할:

- `messages` 컬렉션에서 특정 상담방의 최근 메시지를 조회한다.
- 기본 조회 개수는 20개다.
- 과도한 조회를 막기 위해 최대 50개까지만 허용한다.
- AI Agent가 대화 흐름을 이해하기 쉽도록 최신순으로 가져온 뒤 시간순으로 다시 정렬한다.

포함 필드:

- `senderId`
- `senderName`
- `text`
- `createdAt`

### 3.2 차량 context 생성

`createAgentCarContext(car)` 함수를 추가했다.

AI Agent가 참고할 수 있는 차량 정보만 추려서 반환한다.

포함 필드:

- 차량 ID
- 차량명
- 제조사
- 가격
- 연식
- 주행거리
- 지역
- 연료
- 차종
- 차량 설명

MongoDB 내부 정보나 불필요한 민감 정보는 포함하지 않는다.

### 3.3 AI Agent context 생성

`buildAgentContext({ room, userMessage })` 함수를 추가했다.

이 함수는 아래 데이터를 한 번에 묶는다.

- 상담방 정보
- 차량 정보
- 최근 상담 메시지
- 딜러 온라인 상태
- 사용자가 방금 보낸 메시지

이 context는 이후 실제 AI API를 연결할 때 프롬프트 재료로 사용할 수 있다.

### 3.4 placeholder 함수

`generateAgentReply(context)` 함수를 추가했다.

현재 동작:

```js
return null;
```

이 함수가 `null`을 반환하므로 현재 단계에서는 AI 자동 응답을 저장하거나 전송하지 않는다.
향후 실제 AI Agent를 붙일 때는 이 함수 내부만 교체하면 된다.

## 4. `handleChatMessage` 흐름

기존 `handleChatMessage`는 사용자 메시지를 검증하고 MongoDB에 저장한 뒤 저장된 메시지를 반환했다.

이번 단계 후 흐름:

1. `roomId`, `senderId`, `text` 검증
2. 상담방 조회
3. 상담방 참여자 여부 확인
4. 사용자 메시지 저장
5. `chat_rooms`의 마지막 메시지 정보 갱신
6. `buildAgentContext`로 AI Agent context 생성
7. `generateAgentReply` 호출
8. 사용자 메시지와 placeholder 응답 결과 반환

Socket.io 전송부는 반환값 중 사용자 메시지만 기존처럼 `receive-message`로 보낸다.
따라서 현재 사용자 경험은 기존 Socket.io 상담과 동일하다.

## 5. 향후 AI 자동 응답 위치

현재는 아래 조건을 코드 주석으로 남겼다.

```js
// 딜러가 오프라인이고 agentReply가 있으면 이후 단계에서 AI 메시지를
// messages 컬렉션에 저장하고 receive-message로 전송할 수 있다.
```

다음 단계에서 실제 AI 응답을 활성화할 때는 아래 흐름을 추가하면 된다.

1. 딜러 온라인 상태가 오프라인인지 확인한다.
2. `generateAgentReply(context)`가 응답 문자열을 반환한다.
3. AI 메시지를 `messages` 컬렉션에 저장한다.
4. 같은 상담방에 `receive-message`로 AI 메시지를 전송한다.

## 6. 향후 개발 계획서 보정 방식

`docs/실시간_Car_Market_향후_개발_계획서.md`에는 초기 판단 기준의 내용이 남아 있었다.
예를 들어 Socket.io 상담은 “실시간 메시지 미구현”, 딜러 온라인 상태는 “메모리 기반”으로 기록되어 있었다.

이번 수정에서는 기존 판단을 단순 삭제하지 않고 아래 방식으로 보정했다.

- 현재 상태 표는 실제 구현 기준으로 갱신했다.
- AI Agent 단계에는 `handleChatMessage`가 먼저 분리되었고, 이번 단계에서 context helper를 추가한다는 보정 기록을 남겼다.
- 딜러 온라인 상태 섹션은 “초기 계획은 메모리 기반이었으나, 실제 구현은 MongoDB `users` 문서 기반으로 확정했다”는 기록형 설명으로 변경했다.
- 왜 MongoDB 기반으로 바꿨는지, 서버 재시작 시 어떤 보정이 필요한지 함께 적었다.

## 7. 검증 결과

| 검증 | 결과 |
| --- | --- |
| `node --check server.js` | 성공 |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build` | 성공 |

참고:

- Vite 빌드 중 `.env`의 `NODE_ENV=production` 경고가 출력되지만 빌드는 성공한다.
- `npm.cmd run build`에서 moderate 취약점 2개가 보고되었지만, 이번 작업 범위는 AI Agent 확장 구조 정리이므로 강제 업데이트는 실행하지 않았다.

## 8. 남은 작업

- 실제 AI API 연동은 다음 단계에서 별도 사용자 확인 후 진행한다.
- AI 자동 응답 저장과 전송은 `generateAgentReply`가 실제 응답을 반환하는 단계에서 활성화한다.
- Firebase Admin SDK 기반 서버 토큰 검증은 아직 도입하지 않았다.

