# 19단계 LangChain/LangGraph 챗봇 기능 추가 계획

## 1. 문서 목적

이번 단계는 기존 Socket.io 상담 기능에 OpenAI, LangChain, LangGraph 기반 챗봇 응답 구조를 추가하기 위한 확정 계획 문서다.

현재 프로젝트에는 `backend/services/agent.service.js`가 이미 존재하며, `handleChatMessage`에서 상담방, 차량, 최근 메시지, 딜러 상태를 모아 `generateAgentReply(context)`를 호출하는 확장 지점이 마련되어 있다. 따라서 이번 작업은 기존 실시간 상담 흐름을 유지하면서 `generateAgentReply` 내부를 LangGraph 실행 흐름으로 교체/보강하는 방식으로 진행한다.

## 2. 현재 작업 상태

| 항목 | 내용 |
| --- | --- |
| 현재 브랜치 | `feat/langgraph-chatbot` |
| 작업 성격 | AI API, 환경변수, DB 컬렉션, UI가 포함된 큰 작업 |
| 이번 단계 범위 | 사용자 확정 사항 반영, 패키지 설치 안내, 구현 기준 고정 |
| 코드 수정 여부 | 사용자 패키지 설치 완료 후 진행 |
| 패키지 추가 여부 | 사용자가 직접 설치 완료 |
| 환경변수 변경 여부 | 추천 방식으로 진행 |
| 실제 AI API 연동 여부 | OpenAI 연동 |

참고: 사용자는 `feature/langgraph-chatbot` 브랜치를 만들었다고 했지만, `git status` 기준 실제 브랜치는 `feat/langgraph-chatbot`이다.

## 3. 확인한 기준 문서와 코드

1. `AGENTS.md`
2. `docs/requirements.md`
3. `docs/progress.md`
4. `docs/plans/plan-09-ai-agent-ready-chat.md`
5. `.github/workflows/deploy.yml`
6. `package.json`
7. `frontend/package.json`
8. `backend/services/agent.service.js`
9. `backend/services/chats.service.js`
10. `backend/sockets/chat.socket.js`
11. `backend/routes/chats.routes.js`

문서와 현재 코드의 차이:

- 초기 `docs/requirements.md`는 기존 과제용 CRUD 기준이라 로그인, MongoDB, Socket.io, AI Agent는 제외 범위로 적혀 있다.
- 실제 진행 기록과 현재 코드는 Firebase Authentication, MongoDB Atlas, Socket.io, 상담방/메시지 저장, AI Agent placeholder까지 확장되어 있다.
- 이번 계획은 초기 과제 요구사항보다 최신 코드와 `docs/progress.md`, `plan-09` 기준을 우선한다.

## 4. 공식 문서 기준

LangGraph JS 공식 문서 기준 기본 패키지는 `@langchain/langgraph`, `@langchain/core`다.
LangChain JS 공식 문서 기준 Node.js 20 이상 환경에서 `langchain`, `@langchain/core`를 설치한다.
OpenAI 모델을 LangChain에서 사용하려면 provider 패키지인 `@langchain/openai`가 필요하다.

현재 루트 `package.json`의 `engines.node`는 `>=20.19.0`이라 Node 버전 조건은 맞는다.

사용자 확정 모델은 `gpt-5.4-mini`다. OpenAI 공식 모델 문서 기준 `gpt-5.4-mini`는 Responses API와 Chat Completions API를 지원하는 모델이다.

공식 문서:

- LangGraph JS 설치: https://docs.langchain.com/oss/javascript/langgraph/install
- LangChain JS 설치: https://docs.langchain.com/oss/javascript/langchain/install
- OpenAI 통합: https://docs.langchain.com/oss/javascript/integrations/llms/openai
- OpenAI `gpt-5.4-mini` 모델: https://developers.openai.com/api/docs/models/gpt-5.4-mini

## 5. 사용자 확정 사항

사용자가 아래 기준으로 진행을 승인했다.

1. AI provider는 OpenAI로 진행한다.
2. 사용할 모델은 `gpt-5.4-mini`다.
3. 챗봇은 딜러가 오프라인일 때와 사용자가 "AI에게 질문" 버튼을 누른 경우에 동작한다.
4. 유지보수와 관리를 위해 AI 메시지는 새로운 MongoDB 컬렉션에 저장한다.
5. 프론트엔드에서는 AI 상담원을 딜러와 구분할 수 있도록 배지, 전용 말풍선 색상, 챗봇 전용 색상을 적용한다.
6. 환경변수는 추천 방식으로 진행한다.
7. 일반 사용자가 사용법, 추천 자동차, 차량 관련 질문을 하면 챗봇이 응답한다.
8. 자동차와 관련 없거나 답변이 어려운 질문은 직접 문의를 유도한다.
9. 직접 문의 유도 문구에는 가상의 대표 전화번호, 카카오 채널, 인스타그램 공식채널 주소를 사용한다.
10. 챗봇 대화는 무제한으로 열지 않고 횟수 제한을 둔다.
11. Render 비밀키 등록은 사용자가 직접 진행한다.
12. 패키지 설치도 사용자가 직접 진행한다.
13. 패키지 설치가 끝나면 코드 구현을 진행한다.
14. 채팅방에서 `AI에게 질문`을 누른 뒤 응답이 늦거나 문제가 생겨도 사용자가 상황을 알 수 있도록 AI 답변 대기/지연 상태를 표시한다.

## 6. 서버 중심 구현 원칙

챗봇은 프론트엔드가 아니라 백엔드에서 실행한다.

이유:

- OpenAI API Key 같은 서버 비밀값을 브라우저에 노출하지 않는다.
- 기존 상담 메시지 저장 흐름이 백엔드 `handleChatMessage`에 모여 있다.
- MongoDB 차량 정보와 상담 내역 조회도 백엔드에서 이미 처리하고 있다.
- Render Web Service 단일 배포 구조를 유지할 수 있다.

## 7. Socket.io 이벤트 유지

AGENTS.md 기준 Socket.io 이벤트 이름은 유지한다.

유지할 이벤트:

- `join-room`
- `send-message`
- `receive-message`
- `leave-room`
- `dealer-online`
- `dealer-offline`

챗봇 응답도 기존 `receive-message`로 내려보낸다. 새 이벤트는 만들지 않는 방향을 우선한다.

구매자가 `AI에게 질문` 버튼으로 메시지를 보낸 경우 프론트엔드는 임시 AI 대기 말풍선을 표시한다.
실제 AI 메시지가 `receive-message`로 도착하면 임시 말풍선을 교체하고, 일정 시간 동안 응답이 없으면 AI API 또는 네트워크 지연 가능성을 안내한다.

## 8. LangGraph 노드 구성

초기 그래프는 작게 시작한다.

| 노드 | 역할 |
| --- | --- |
| `prepareContext` | 기존 agent context를 그래프 state로 정리 |
| `classifyIntent` | 차량 추천, 사용법, 상담 연결, 범위 밖 질문 같은 의도 분류 |
| `retrieveCarInfo` | context 안의 차량 정보를 답변 근거로 정리 |
| `checkUsageLimit` | 방별/사용자별 일일 챗봇 응답 제한 확인 |
| `generateReply` | OpenAI `gpt-5.4-mini`로 답변 생성 |
| `guardReply` | 민감정보, 근거 없는 단정, 과도한 영업 문구 방지 |

1차 구현에서는 외부 검색이나 추가 도구 호출을 하지 않는다. 이미 조회된 차량, 상담방, 최근 메시지 context만 사용한다.

## 9. 응답 저장 흐름

추천 흐름:

1. 사용자가 `send-message` 전송
2. `handleChatMessage`가 사용자 메시지를 기존 `messages` 컬렉션에 저장
3. 기존 `buildAgentContext`로 차량/상담/딜러 상태 context 생성
4. 딜러가 오프라인이거나 사용자가 AI 질문 버튼을 누른 경우 LangGraph 실행
5. 챗봇 사용 제한을 확인
6. 챗봇 응답을 신규 `chatbot_messages` 컬렉션에 저장
7. 사용자 메시지와 챗봇 메시지를 기존 `receive-message` 이벤트로 전송

기존 딜러/구매자 메시지는 `messages` 컬렉션에 유지한다. AI 메시지는 유지보수와 관리를 위해 별도 컬렉션인 `chatbot_messages`에 저장한다.

상담방 메시지 조회 API는 `messages`와 `chatbot_messages`를 합쳐 시간순으로 반환한다. 프론트엔드는 `senderType: "agent"` 또는 `isAgentMessage: true`를 기준으로 AI 상담원 배지와 전용 말풍선 색상을 표시한다.

## 10. 신규 컬렉션 정책

신규 컬렉션명은 `chatbot_messages`로 한다.

예상 필드:

| 필드 | 설명 |
| --- | --- |
| `_id` | MongoDB ObjectId |
| `roomId` | 상담방 ID |
| `buyerId` | 구매자 UID |
| `dealerId` | 딜러 UID |
| `carId` | 차량 ID |
| `triggerType` | `dealer_offline` 또는 `user_ai_button` |
| `userMessageId` | 답변의 원인이 된 사용자 메시지 ID |
| `senderId` | `ai-agent` |
| `senderName` | `AI 상담원` |
| `senderType` | `agent` |
| `isAgentMessage` | `true` |
| `text` | AI 답변 본문 |
| `model` | 사용 모델명 |
| `provider` | `openai` |
| `createdAt` | 생성 시각 |
| `metadata` | intent, token usage, 제한 정책 결과 등 |

인덱스 후보:

- `{ roomId: 1, createdAt: 1 }`
- `{ buyerId: 1, createdAt: -1 }`
- `{ roomId: 1, triggerType: 1, createdAt: -1 }`

## 11. 챗봇 사용 제한

초기 제한 정책은 환경변수로 제어한다.

추천값:

- 방별 하루 AI 응답 최대 10회
- 사용자별 하루 AI 응답 최대 20회
- 최근 메시지 context 최대 20개
- AI 답변 최대 700자

환경변수 후보:

- `AI_CHATBOT_DAILY_ROOM_LIMIT=10`
- `AI_CHATBOT_DAILY_USER_LIMIT=20`
- `AI_CHATBOT_CONTEXT_MESSAGE_LIMIT=20`
- `AI_CHATBOT_MAX_REPLY_CHARS=700`

제한에 걸리면 AI 호출을 하지 않고 직접 문의 문구를 반환한다.

## 12. 범위 밖 질문 처리

챗봇은 자동차 구매, 차량 추천, 차량 상태, 가격대 비교, 상담 이용 방법, 등록 차량 정보 안내에 집중한다.

다음 질문은 짧게 거절하고 직접 문의를 유도한다.

- 자동차와 무관한 일반 잡담 또는 과제 외 질문
- 법률, 금융, 보험, 세금에 대한 단정적 조언
- 실제 차량 상태를 보장해야 하는 질문
- 플랫폼 내부 Secret, DB 정보, 개인정보 요청
- 모델이 확실히 답하기 어려운 질문

직접 문의 문구 초안:

```text
정확한 안내가 필요한 내용은 1:1 문의로 확인해주세요.
대표 전화: 02-1234-5678
카카오 채널: https://pf.kakao.com/_car-market-ai
인스타그램: https://instagram.com/realtime_car_market
```

## 13. AI 안전 문구

시스템 프롬프트에는 아래 기준을 포함한다.

- 차량 정보는 제공된 context 안에서만 답한다.
- 근거 없는 가격 보장, 사고 이력 보장, 성능 보장 문구를 쓰지 않는다.
- 금융, 법률, 보험, 세금에 대해 단정하지 않는다.
- 실제 계약, 결제, 환불, 보증 판단은 담당자 또는 공식 문의로 넘긴다.
- 사용자의 개인정보, Firebase UID, 내부 DB 구조, 환경변수, API Key를 노출하지 않는다.
- 자동차와 무관한 질문은 정중히 거절하고 공식 문의 채널을 안내한다.
- 답변은 한국어로, 초보 사용자도 이해하기 쉽게 짧고 구체적으로 작성한다.
- 딜러를 사칭하지 않고 항상 `AI 상담원`임을 전제로 답한다.

## 14. 예상 변경 파일

| 파일 | 변경 내용 |
| --- | --- |
| `package.json` | 사용자가 직접 패키지 설치 후 LangChain/LangGraph/OpenAI provider 패키지 반영 확인 |
| `package-lock.json` | 사용자가 직접 패키지 설치 후 패키지 설치 결과 반영 확인 |
| `.env.example` | AI API Key, 모델명, 챗봇 활성화 설정 추가 |
| `backend/db.js` | `chatbot_messages` 컬렉션명과 인덱스 추가 |
| `backend/services/collections.js` | `chatbot_messages` 컬렉션 접근 helper 추가 |
| `backend/services/agent.service.js` | LangGraph 실행 진입점으로 변경 |
| `backend/services/agentGraph.service.js` | LangGraph 노드와 그래프 정의 |
| `backend/services/chats.service.js` | 챗봇 응답 저장/전송 흐름 연결, 메시지 조회 병합 |
| `backend/sockets/chat.socket.js` | 필요 시 agent 메시지도 `receive-message`로 전송 |
| `frontend/src/components/ChatRoom.jsx` | AI 질문 버튼, AI 메시지 배지/전용 색상 추가 |
| `README.md` | 로컬 실행, 환경변수, 챗봇 동작 조건 설명 |
| `docs/deploy-guide.md` | Render 환경변수 등록 안내 |
| `docs/deploy-checklist.md` | 배포 전 AI 설정 확인 항목 추가 |
| `docs/progress.md` | 구현 완료 후 진행 기록 추가 |
| `docs/steps/2026-06-09-21-langgraph-chatbot.md` | 구현 완료 문서와 사용자 작업 가이드 추가 |
| `docs/pr/2026-06-09-21-langgraph-chatbot-pr.md` | PR 요약 문서 추가 |

## 15. 이번 단계에서 하지 않을 일

- Codex가 직접 LangChain/LangGraph 패키지를 설치하지 않는다.
- Socket.io 이벤트 이름을 변경하지 않는다.
- API 경로를 변경하지 않는다.
- Render Secret, GitHub Secret을 직접 변경하지 않는다.
- Render Web Service 단일 배포 구조를 분리 배포로 바꾸지 않는다.
- 외부 검색 도구, 벡터 DB, 결제, 카카오/인스타 실제 API 연동은 하지 않는다.
- 사용자가 패키지 설치를 완료하기 전에는 LangGraph import가 필요한 코드 구현을 진행하지 않는다.

## 16. 사용자 선행 작업

권한 요청 반복을 피하기 위해 패키지 설치는 사용자가 직접 진행한다.

루트 경로 `C:\Dev\codex_assignment`에서 아래 명령을 실행한다.

```powershell
npm.cmd install langchain @langchain/core @langchain/langgraph @langchain/openai
```

설치 후 사용자가 확인할 파일:

- `package.json`
- `package-lock.json`

설치 완료 후 사용자에게 알려주면 코드 구현을 진행한다.

## 17. Render 환경변수 후보

Render Web Service의 Environment에 아래 값을 등록한다. 실제 Secret 등록은 사용자가 직접 진행한다.

```text
OPENAI_API_KEY=사용자 OpenAI API Key
AI_CHATBOT_ENABLED=true
AI_CHATBOT_MODEL=gpt-5.4-mini
AI_CHATBOT_TEMPERATURE=0.3
AI_CHATBOT_DAILY_ROOM_LIMIT=10
AI_CHATBOT_DAILY_USER_LIMIT=20
AI_CHATBOT_CONTEXT_MESSAGE_LIMIT=20
AI_CHATBOT_MAX_REPLY_CHARS=700
```

주의:

- `OPENAI_API_KEY`는 클라이언트 코드나 `VITE_*` 환경변수로 만들지 않는다.
- Render Secret은 GitHub에 커밋하지 않는다.
- 로컬 `.env` 파일도 커밋하지 않는다.

## 18. 구현 단계 초안

사용자 패키지 설치 완료 후 아래 순서로 진행한다.

1. 설치된 `package.json`, `package-lock.json` 확인
2. `.env.example`, README, 배포 문서에 AI 환경변수 안내 추가
3. `backend/db.js`, `backend/services/collections.js`에 `chatbot_messages` 컬렉션 연결
4. `backend/services/agentGraph.service.js` 추가
5. `backend/services/agent.service.js`에서 LangGraph 실행 함수 호출
6. `backend/services/chats.service.js`에서 챗봇 응답 저장과 메시지 조회 병합 구현
7. `backend/sockets/chat.socket.js`에서 agent 메시지도 `receive-message`로 전송
8. `frontend/src/components/ChatRoom.jsx`에 AI 질문 버튼과 AI 메시지 UI 적용
9. 서버 문법 확인과 빌드 검증
10. step 문서, PR 문서, progress 문서 작성

## 19. 검증 계획

가능한 범위에서 아래 검증을 실행한다.

| 검증 항목 | 명령 또는 방법 |
| --- | --- |
| 서버 문법 확인 | `node --check backend/services/agent.service.js` |
| 서버 문법 확인 | `node --check backend/services/agentGraph.service.js` |
| 서버 문법 확인 | `node --check backend/services/chats.service.js` |
| 서버 문법 확인 | `node --check backend/sockets/chat.socket.js` |
| 프론트엔드 빌드 | `npm.cmd --prefix frontend run build` |
| 루트 빌드 | `npm.cmd run build` |
| 서버 실행 | `npm.cmd start` |
| Socket.io 상담 확인 | 로그인 사용자로 상담방 입장 후 메시지 송수신 확인 |
| 챗봇 응답 확인 | 딜러 오프라인 조건 또는 AI 질문 버튼으로 AI 메시지 저장/표시 확인 |

실제 OpenAI API Key, Firebase, MongoDB Atlas 환경변수가 없으면 실동작 검증은 제한된다. 이 경우 문법 확인과 빌드를 우선 보고하고, 실제 환경에서 확인해야 할 항목을 따로 남긴다.

## 20. 확정 구현 기준 요약

1. Provider는 OpenAI다.
2. 모델은 `gpt-5.4-mini`다.
3. 사용자가 루트 백엔드 의존성에 `langchain`, `@langchain/core`, `@langchain/langgraph`, `@langchain/openai`를 직접 설치한다.
4. 챗봇은 서버에서만 실행한다.
5. 자동 응답은 딜러가 오프라인일 때 또는 사용자가 AI 질문 버튼을 누른 경우에만 동작한다.
6. 챗봇 메시지는 `chatbot_messages` 컬렉션에 저장한다.
7. 챗봇 메시지는 `receive-message` 이벤트로 기존 상담방에 전송한다.
8. 프론트엔드에는 `AI 상담원` 배지와 전용 말풍선 색상을 표시한다.
9. 최근 메시지는 최대 20개만 context에 포함한다.
10. 답변은 차량 구매 상담 범위로 제한하고, 근거 없는 가격 보장이나 금융/법률 단정은 피한다.
