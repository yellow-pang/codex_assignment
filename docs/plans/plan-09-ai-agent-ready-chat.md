# 9단계 AI Agent 확장 구조 정리 작업 계획

## 1. 작업 배경

8단계에서 Socket.io 실시간 상담과 MongoDB 기반 딜러 온라인 상태 표시가 구현되었다.
현재 `server.js`에는 `handleChatMessage(payload)` 함수가 있어 사용자가 보낸 메시지를 검증하고 `messages` 컬렉션에 저장한 뒤 Socket.io room에 전달한다.

요구사항에서는 이번 과제에서 실제 AI Agent를 완성하지 않아도 되지만, 이후 AI Agent가 상담 흐름에 끼어들 수 있도록 구조를 분리하라고 명시한다.
따라서 이번 단계는 OpenAI 등 외부 AI API를 호출하지 않고, AI Agent 확장에 필요한 데이터 조회 함수와 placeholder 함수를 준비하는 작업으로 제한한다.

참고 문서:

- `docs/실시간_Car_Market_서비스_요구사항_정의서.md`
- `docs/실시간_Car_Market_향후_개발_계획서.md`
- `docs/progress.md`
- `README.md`
- `docs/deploy-guide.md`
- `docs/deploy-checklist.md`

## 2. 현재 구현 상태

| 영역             | 현재 상태                                          | 이번 단계 변경 방향                                  |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------- |
| 실시간 상담      | Socket.io `send-message`, `receive-message` 구현됨 | 유지                                                 |
| 메시지 저장      | `handleChatMessage`에서 MongoDB `messages` 저장    | AI 확장 context 생성 흐름으로 보강                   |
| 딜러 온라인 상태 | MongoDB `users` 문서의 `dealerOnline` 등으로 관리  | AI 응답 조건 판단에 재사용 가능하게 정리             |
| 차량 정보 조회   | 차량 API에서는 사용 중                             | 상담 메시지 처리에서 AI context용으로 조회           |
| 이전 메시지 조회 | REST API로 구현됨                                  | AI context용 최근 메시지 조회 함수 추가              |
| AI Agent 응답    | 없음                                               | 실제 호출 없는 `generateAgentReply` placeholder 추가 |
| 외부 AI API      | 없음                                               | 이번 단계에서도 도입하지 않음                        |

## 3. 작업 목표

- `handleChatMessage`가 AI Agent 확장에 필요한 상담 context를 만들 수 있도록 구조를 정리한다.
- 상담방 정보, 차량 정보, 최근 상담 메시지, 딜러 온라인 상태를 함께 조회하는 helper 함수를 추가한다.
- 실제 AI API 호출 없이 `generateAgentReply` placeholder 함수를 추가한다.
- 딜러가 오프라인일 때 AI Agent 자동 응답을 붙일 수 있는 코드 위치를 명확히 남긴다.
- 기본 동작은 지금과 동일하게 유지한다. 즉, 현재 단계에서는 AI 메시지를 자동 저장하거나 전송하지 않는다.
- AI Agent 확장 방향을 README, progress, step, PR 문서에 남긴다.
- 오래된 개발 계획서의 구현 상태를 현재 코드 기준으로 보정한다.

## 4. 백엔드 구현 계획

### 4.1 상담 context helper 추가

`server.js`에 아래 역할의 함수를 추가한다.

| 함수                                       | 역할                                                              |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `getRecentRoomMessages(roomId, limit)`     | AI가 참고할 최근 메시지를 최신순 제한 후 시간순으로 반환          |
| `buildAgentContext({ room, userMessage })` | 상담방, 차량, 최근 메시지, 딜러 상태를 하나의 context 객체로 구성 |
| `generateAgentReply(context)`              | 실제 AI API 호출 없이 `null`을 반환하는 placeholder               |

예상 context 형태:

```json
{
  "room": {
    "roomId": "상담방 ID",
    "buyerId": "구매자 UID",
    "dealerId": "딜러 UID",
    "carId": "차량 ID"
  },
  "car": {
    "name": "차량명",
    "company": "제조사",
    "price": 3000,
    "year": 2023,
    "mileage": 35000,
    "location": "서울",
    "description": "차량 설명"
  },
  "messages": [
    {
      "senderId": "Firebase UID",
      "senderName": "사용자명",
      "text": "이전 메시지",
      "createdAt": "생성 시각"
    }
  ],
  "dealerPresence": {
    "isOnline": false,
    "lastSeenAt": "마지막 접속 시각"
  },
  "userMessage": {
    "senderId": "Firebase UID",
    "text": "사용자 질문"
  }
}
```

### 4.2 `handleChatMessage` 흐름 정리

현재 메시지 저장 흐름은 유지한다.

정리 후 흐름:

1. payload 검증
2. 상담방 조회와 참여자 검증
3. 사용자 메시지 저장
4. `chat_rooms` 마지막 메시지 정보 갱신
5. AI Agent 확장 context 생성
6. `generateAgentReply(context)` 호출
7. 현재는 `null` 반환이므로 자동 응답 저장 없음
8. 사용자 메시지를 Socket.io room에 `receive-message`로 전달

중요한 점:

- `generateAgentReply`는 외부 API를 호출하지 않는다.
- AI 응답이 `null`이면 현재 상담 동작과 완전히 동일하게 유지한다.
- 향후 실제 AI를 붙일 때는 `generateAgentReply` 내부만 교체할 수 있게 한다.

### 4.3 AI 자동 응답은 이번 단계에서 비활성

이번 단계에서는 딜러가 오프라인이어도 AI 답변을 실제로 생성하거나 저장하지 않는다.
다만 아래 주석과 구조를 남긴다.

```js
// 딜러가 오프라인이고 generateAgentReply가 응답을 반환하면
// 이후 단계에서 AI 메시지를 messages 컬렉션에 저장하고 receive-message로 전송할 수 있다.
```

## 5. 데이터와 보안 기준

AI Agent context에는 서버에서 이미 조회 가능한 데이터만 사용한다.

포함 가능:

- 상담방 ID
- 차량명, 제조사, 가격, 연식, 주행거리, 지역, 차량 설명
- 최근 상담 메시지
- 딜러 온라인 여부
- 사용자 질문

포함하지 않을 것:

- MongoDB 접속 문자열
- 서버 환경변수
- Firebase Secret
- 내부 오류 stack trace
- 불필요한 사용자 이메일 또는 민감 정보

## 6. 예상 변경 파일

| 파일                                              | 변경 내용                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `server.js`                                       | AI Agent context helper, `generateAgentReply` placeholder, `handleChatMessage` 흐름 정리 |
| `README.md`                                       | AI Agent 확장 구조 설명 추가                                                             |
| `docs/progress.md`                                | 9단계 진행 기록 추가                                                                     |
| `docs/실시간_Car_Market_향후_개발_계획서.md`      | Socket.io/딜러 온라인 상태/AI Agent 상태를 현재 구현 기준으로 보정                       |
| `docs/steps/2026-06-06-09-ai-agent-ready-chat.md` | 구현 상세 문서 추가                                                                      |
| `docs/pr/2026-06-06-09-ai-agent-ready-chat-pr.md` | 이전 PR 문서 양식에 맞춘 PR 요약 추가                                                    |

필요하지 않으면 `.env.example`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`는 변경하지 않는다.
실제 AI API를 붙이지 않으므로 신규 환경변수나 Secret은 추가하지 않는다.

## 7. 이번 단계에서 하지 않을 일

- OpenAI, LangChain, 외부 LLM, 실제 AI Agent API를 연동하지 않는다.
- 새 npm 패키지를 추가하지 않는다.
- AI 응답을 실제로 자동 전송하지 않는다.
- MongoDB 컬렉션 구조를 크게 변경하지 않는다.
- Socket.io 이벤트 이름을 변경하지 않는다.
- API 경로를 변경하지 않는다.
- Firebase Admin SDK 토큰 검증을 새로 도입하지 않는다.
- Render Web Service 단일 배포 구조를 변경하지 않는다.

## 8. 검증 계획

가능한 범위에서 아래 검증을 진행한다.

| 검증 항목                  | 명령 또는 방법                                                         |
| -------------------------- | ---------------------------------------------------------------------- |
| 서버 문법 확인             | `node --check server.js`                                               |
| 프론트엔드 빌드            | `npm.cmd --prefix frontend run build`                                  |
| 루트 빌드                  | `npm.cmd run build`                                                    |
| 기존 메시지 저장 흐름 확인 | `handleChatMessage` 변경 후 `send-message` 흐름이 기존과 동일한지 확인 |

실제 MongoDB Atlas와 Firebase 환경변수가 필요한 실시간 상담 실동작은 가능하면 별도 브라우저 2개로 확인한다.
환경값이 없거나 서버 실행이 제한되면 문법 확인과 빌드 결과를 우선 보고한다.

## 9. 사용자 확인 완료 사항

사용자 확인 결과 아래 기준으로 구현한다.

1. 이번 단계에서는 실제 OpenAI 또는 외부 AI API를 연동하지 않고, `generateAgentReply` placeholder만 추가한다.

2. `generateAgentReply`는 기본적으로 `null`을 반환해 기존 상담 동작을 바꾸지 않는 방향으로 진행한다.

3. AI Agent context에 포함할 데이터는 차량 정보, 최근 메시지, 사용자 질문, 딜러 온라인 상태로 제한한다.

4. 최근 메시지 조회 범위는 20개로 제한한다.

5. 딜러가 오프라인이어도 이번 단계에서는 AI 자동 응답을 실제로 저장/전송하지 않고, 확장 가능한 주석과 함수 구조만 남긴다.

6. 신규 패키지와 신규 환경변수는 추가하지 않는다.

7. 오래된 `docs/실시간_Car_Market_향후_개발_계획서.md`의 현재 상태 표와 딜러 온라인 상태 설명은 이전 판단을 삭제하지 않고, 구현 기준으로 왜 보정했는지 알 수 있는 기록 형식으로 바꾼다.
