# 21단계 LangGraph 챗봇 기능 구현

## 1. 작업 목적

기존 Socket.io 실시간 상담 기능에 OpenAI, LangChain, LangGraph 기반 AI 상담원을 추가했다.
딜러가 오프라인이거나 구매자가 `AI에게 질문` 버튼으로 메시지를 보낸 경우, AI 상담원이 차량 구매 상담 범위 안에서 답변하도록 구현했다.

## 2. 작업 요약

| 구분 | 내용 |
| --- | --- |
| AI provider | OpenAI |
| 모델 | `gpt-5.4-mini` |
| 오케스트레이션 | LangGraph |
| AI 메시지 저장 | 신규 MongoDB `chatbot_messages` 컬렉션 |
| AI 응답 조건 | 딜러 오프라인 또는 구매자의 `AI에게 질문` 버튼 |
| 프론트 표시 | `AI 상담원` 배지와 전용 민트 계열 말풍선 |
| 사용 제한 | 방별/사용자별 하루 응답 횟수 제한 |

## 3. 수정 파일

- `package.json`
- `package-lock.json`
- `.env.example`
- `backend/db.js`
- `backend/services/collections.js`
- `backend/services/agent.service.js`
- `backend/services/agentGraph.service.js`
- `backend/services/chats.service.js`
- `backend/sockets/chat.socket.js`
- `frontend/src/components/ChatRoom.jsx`
- `README.md`
- `docs/deploy-guide.md`
- `docs/deploy-checklist.md`
- `docs/plans/plan-19-langgraph-chatbot.md`
- `docs/progress.md`
- `docs/pr/2026-06-09-21-langgraph-chatbot-pr.md`

## 4. 구현 상세

### 4.1 패키지 설치

권한 요청 반복을 피하기 위해 사용자가 루트에서 직접 설치했다.

```powershell
npm.cmd install langchain @langchain/core @langchain/langgraph @langchain/openai
```

설치 결과 루트 `package.json`, `package-lock.json`에 LangChain/LangGraph/OpenAI provider 패키지가 반영되었다.

### 4.2 MongoDB 컬렉션 분리

AI 메시지는 기존 `messages` 컬렉션에 섞지 않고 `chatbot_messages` 컬렉션에 저장한다.

추가한 인덱스:

- `chatbot_messages_room_createdAt_id`
- `chatbot_messages_buyer_createdAt`
- `chatbot_messages_room_trigger_createdAt`

상담 메시지 조회 API는 기존 `messages`와 신규 `chatbot_messages`를 합쳐 시간순으로 반환한다.

### 4.3 LangGraph 실행 구조

`backend/services/agentGraph.service.js`를 추가해 아래 노드를 구성했다.

- `prepareContext`
- `classifyIntent`
- `retrieveCarInfo`
- `checkUsageLimit`
- `generateReply`
- `guardReply`

자동차와 무관한 질문, 보안 정보 요청, 사용량 제한 초과는 OpenAI 호출 없이 직접 문의 안내로 전환한다.

### 4.4 AI 안전 기준

시스템 프롬프트에 아래 기준을 넣었다.

- 차량 정보는 제공된 context 안에서만 답한다.
- 근거 없는 가격 보장, 사고 이력 보장, 성능 보장 문구를 쓰지 않는다.
- 금융, 법률, 보험, 세금에 대해 단정하지 않는다.
- 실제 계약, 결제, 환불, 보증 판단은 담당자 또는 공식 문의로 넘긴다.
- 개인정보, Firebase UID, 내부 DB 구조, 환경변수, API Key를 노출하지 않는다.
- 자동차와 무관한 질문은 정중히 거절하고 공식 문의 채널을 안내한다.

### 4.5 Socket.io 흐름

기존 이벤트 이름은 유지했다.

- `send-message`: 사용자가 일반 메시지 또는 AI 질문 메시지를 전송
- `receive-message`: 일반 메시지와 AI 상담원 메시지를 모두 수신

AI 응답이 생성되면 `chatbot_messages`에 저장한 뒤 같은 상담방에 `receive-message`로 전송한다.

### 4.6 프론트엔드 UI

`ChatRoom.jsx`에 `AI에게 질문` 버튼을 추가했다.
구매자만 버튼을 볼 수 있으며, 버튼으로 보낸 메시지는 `requestAgent: true`를 포함한다.

AI 상담원 메시지는 아래 방식으로 구분한다.

- `AI 상담원` 배지
- 민트 계열 전용 말풍선
- 일반 딜러/구매자 메시지와 다른 텍스트 색상
- 줄바꿈 보존

## 5. 사용자 작업 가이드

### 5.1 로컬 `.env` 설정

로컬에서 실제 AI 상담을 확인하려면 루트 `.env`에 아래 값을 추가한다.

```text
OPENAI_API_KEY=실제 OpenAI API Key
AI_CHATBOT_ENABLED=true
AI_CHATBOT_MODEL=gpt-5.4-mini
AI_CHATBOT_TEMPERATURE=0.3
AI_CHATBOT_DAILY_ROOM_LIMIT=10
AI_CHATBOT_DAILY_USER_LIMIT=20
AI_CHATBOT_CONTEXT_MESSAGE_LIMIT=20
AI_CHATBOT_MAX_REPLY_CHARS=700
```

주의:

- `.env`는 커밋하지 않는다.
- `OPENAI_API_KEY`는 `VITE_*` 이름으로 만들지 않는다.
- 프론트엔드 코드에 API Key를 넣지 않는다.

### 5.2 Render Environment 설정

Render Web Service의 Environment에 아래 값을 사용자가 직접 등록한다.

```text
OPENAI_API_KEY=실제 OpenAI API Key
AI_CHATBOT_ENABLED=true
AI_CHATBOT_MODEL=gpt-5.4-mini
AI_CHATBOT_TEMPERATURE=0.3
AI_CHATBOT_DAILY_ROOM_LIMIT=10
AI_CHATBOT_DAILY_USER_LIMIT=20
AI_CHATBOT_CONTEXT_MESSAGE_LIMIT=20
AI_CHATBOT_MAX_REPLY_CHARS=700
COLLECTION_CHATBOT_MESSAGES=chatbot_messages
```

Render에 Secret을 등록한 뒤 재배포해야 서버가 새 환경변수를 읽는다.

## 6. 직접 문의 안내 문구

자동차와 무관하거나 답변이 어려운 질문은 아래 가상 채널로 안내한다.

```text
정확한 안내가 필요한 내용은 1:1 문의로 확인해주세요.
대표 전화: 02-1234-5678
카카오 채널: https://pf.kakao.com/_car-market-ai
인스타그램: https://instagram.com/realtime_car_market
```

## 7. 검증 결과

| 검증 | 결과 |
| --- | --- |
| `node --check backend/services/agentGraph.service.js` | 성공 |
| `node --check backend/services/agent.service.js` | 성공 |
| `node --check backend/services/chats.service.js` | 성공 |
| `node --check backend/sockets/chat.socket.js` | 성공 |
| `node --check backend/db.js` | 성공 |
| LangGraph 범위 밖 질문 실행 테스트 | 성공 |

남은 검증:

1. 실제 `OPENAI_API_KEY`, Firebase, MongoDB Atlas 환경에서 AI 응답 저장을 확인한다.
2. 딜러 오프라인 조건에서 자동 AI 응답을 확인한다.
3. `AI에게 질문` 버튼으로 보낸 메시지에 AI 응답이 표시되는지 확인한다.
4. Render Environment에 AI 환경변수를 등록한 뒤 재배포한다.
