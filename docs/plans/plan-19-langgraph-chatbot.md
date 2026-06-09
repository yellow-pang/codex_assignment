# 19단계 LangChain/LangGraph 챗봇 기능 추가 계획

## 1. 문서 목적

이번 단계는 기존 Socket.io 상담 기능에 LangChain과 LangGraph 기반 챗봇 응답 구조를 추가하기 전, 구현 범위와 사용자 확인 사항을 정리하기 위한 계획 문서다.

현재 프로젝트에는 `backend/services/agent.service.js`가 이미 존재하며, `handleChatMessage`에서 상담방, 차량, 최근 메시지, 딜러 상태를 모아 `generateAgentReply(context)`를 호출하는 확장 지점이 마련되어 있다. 따라서 이번 작업은 기존 상담 흐름을 유지하면서 `generateAgentReply` 내부를 LangGraph 실행 흐름으로 바꾸는 방식으로 진행하는 것이 가장 작고 안전하다.

## 2. 현재 작업 상태

| 항목                  | 내용                                  |
| --------------------- | ------------------------------------- |
| 현재 브랜치           | `feat/langgraph-chatbot`              |
| 작업 성격             | 큰 작업 가능성이 있는 중간 이상 작업  |
| 이번 단계 범위        | 계획 문서 작성, 사용자 확인 사항 정리 |
| 코드 수정 여부        | 없음                                  |
| 패키지 추가 여부      | 사용자 확인 후 진행                   |
| 환경변수 변경 여부    | 사용자 확인 후 진행                   |
| 실제 AI API 연동 여부 | 사용자 확인 후 진행                   |

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

## 4. 공식 문서 기준 패키지 후보

LangChain 공식 문서 기준 Node.js 20 이상 환경에서 LangChain JS는 `langchain`, `@langchain/core`를 설치한다.
LangGraph JS 공식 문서 기준 기본 패키지는 `@langchain/langgraph`, `@langchain/core`다.
OpenAI 모델을 LangChain에서 사용하려면 별도 provider 패키지인 `@langchain/openai`가 필요하다.

현재 루트 `package.json`의 `engines.node`는 `>=20.19.0`이라 Node 버전 조건은 맞는다.

공식 문서:

- LangGraph JS 설치: https://docs.langchain.com/oss/javascript/langgraph/install
- LangChain JS 설치: https://docs.langchain.com/oss/javascript/langchain/install
- OpenAI 통합: https://docs.langchain.com/oss/javascript/integrations/llms/openai

## 5. 기본 구현 방향 제안

### 5.1 서버 중심 구현

챗봇은 프론트엔드가 아니라 백엔드에서 실행한다.

이유:

- OpenAI API Key 같은 서버 비밀값을 브라우저에 노출하지 않는다.
- 기존 상담 메시지 저장 흐름이 백엔드 `handleChatMessage`에 모여 있다.
- MongoDB 차량 정보와 상담 내역 조회도 백엔드에서 이미 처리하고 있다.

### 5.2 기존 Socket.io 이벤트 유지

AGENTS.md 기준 Socket.io 이벤트 이름은 유지한다.

유지할 이벤트:

- `join-room`
- `send-message`
- `receive-message`
- `leave-room`
- `dealer-online`
- `dealer-offline`

챗봇 응답도 가능하면 기존 `receive-message`로 내려보낸다. 새 이벤트가 꼭 필요하면 사전에 사용자 확인을 받는다.

### 5.3 LangGraph 노드 구성 초안

초기 그래프는 작게 시작한다.

| 노드              | 역할                                              |
| ----------------- | ------------------------------------------------- |
| `prepareContext`  | 기존 agent context를 그래프 state로 정리          |
| `classifyIntent`  | 가격, 차량상태, 상담연결, 일반질문 같은 의도 분류 |
| `retrieveCarInfo` | 이미 context에 있는 차량 정보를 답변 근거로 정리  |
| `generateReply`   | LLM으로 답변 생성                                 |
| `guardReply`      | 민감정보, 근거 없는 단정, 과도한 영업 문구 방지   |

1차 구현에서는 도구 호출을 최소화하고, 이미 조회된 context만 사용하는 방향을 우선한다.

### 5.4 응답 저장 흐름

추천 흐름:

1. 사용자가 `send-message` 전송
2. `handleChatMessage`가 사용자 메시지를 `messages` 컬렉션에 저장
3. 기존 `buildAgentContext`로 차량/상담/딜러 상태 context 생성
4. 딜러가 오프라인이거나 챗봇 사용 조건을 만족하면 LangGraph 실행
5. 챗봇 응답을 `messages` 컬렉션에 `senderType: "agent"` 또는 `senderId: "ai-agent"` 형태로 저장
6. 사용자 메시지와 챗봇 메시지를 `receive-message`로 전송

단, `senderType`, `agent` 표시 방식은 메시지 데이터 구조에 영향을 주므로 사용자 확인 후 확정한다.

## 6. 예상 변경 파일

| 파일                                                    | 변경 내용                                                |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `package.json`                                          | LangChain/LangGraph/OpenAI provider 패키지 추가          |
| `package-lock.json`                                     | 패키지 설치 결과 반영                                    |
| `.env.example`                                          | 사용자 확인 후 AI API Key, 모델명, 챗봇 활성화 설정 추가 |
| `backend/services/agent.service.js`                     | LangGraph 실행 진입점으로 변경                           |
| `backend/services/chats.service.js`                     | 챗봇 응답 저장/전송 흐름 연결                            |
| `backend/services/agentGraph.service.js` 또는 유사 파일 | LangGraph 노드와 그래프 정의                             |
| `frontend/src/components/ChatRoom.jsx`                  | 챗봇 메시지 표시 UI 보강이 필요할 경우 수정              |
| `README.md`                                             | 로컬 실행, 환경변수, 챗봇 동작 조건 설명                 |
| `docs/deploy-guide.md`                                  | Render 환경변수 등록 안내                                |
| `docs/deploy-checklist.md`                              | 배포 전 AI 설정 확인 항목 추가                           |
| `docs/progress.md`                                      | 구현 완료 후 진행 기록 추가                              |
| `docs/steps/2026-06-09-21-langgraph-chatbot.md`         | 구현 완료 문서 추가                                      |
| `docs/pr/2026-06-09-21-langgraph-chatbot-pr.md`         | PR 요약 문서 추가                                        |

## 7. 이번 단계에서 사용자 확인이 필요한 사항

아래 항목은 AGENTS.md 기준 사용자 확인 없이 진행하지 않는다.

1. 실제 AI provider 선택

- OpenAI를 사용할지, 다른 LLM provider를 사용할지 확정이 필요하다.
- OpenAI를 사용하면 `@langchain/openai`와 서버 환경변수 `OPENAI_API_KEY`가 필요하다.

2. 사용할 모델명

- 예: `gpt-4.1-mini`, `gpt-4o-mini` 등
- 비용, 응답 속도, 품질 기준에 따라 달라진다.

3. 챗봇 자동 응답 조건

- 딜러가 오프라인일 때만 자동 응답
- 항상 첫 답변만 자동 응답
- 사용자가 "AI에게 질문" 버튼을 누른 경우만 응답
- 모든 상담 메시지에 자동 응답

추천은 `딜러가 오프라인일 때만 자동 응답`이다. 기존 실시간 상담 기능을 덜 흔든다.

4. 메시지 저장 구조

- 챗봇 메시지를 `messages` 컬렉션에 저장할지 확정해야 한다.
- 저장한다면 `senderId`, `senderName`, `senderType`, `isAgentMessage` 같은 표시 필드를 정해야 한다.

추천은 기존 메시지 구조를 유지하되 `senderId: "ai-agent"`, `senderName: "AI 상담원"`, `senderType: "agent"`를 추가하는 방식이다.

5. 프론트엔드 표시 방식

- 챗봇 메시지를 일반 메시지처럼 보여줄지
- "AI 상담원" 배지와 안내 문구를 붙일지
- 사용자가 딜러 메시지와 AI 메시지를 명확히 구분할 수 있어야 한다.

6. 환경변수 추가

- `.env.example`, README, Render 환경변수 안내에 어떤 이름으로 추가할지 확인이 필요하다.
- 추천 후보:
  - `OPENAI_API_KEY`
  - `AI_CHATBOT_ENABLED`
  - `AI_CHATBOT_MODEL`
  - `AI_CHATBOT_TEMPERATURE`

7. 비용과 제한 정책

- 메시지당 호출할지, 최근 N개 메시지만 context로 보낼지, 답변 길이를 제한할지 정해야 한다.
- 추천은 최근 메시지 20개 이하, 답변 700자 이하, 차량/상담 범위를 벗어난 질문은 짧게 제한하는 방식이다.

8. 배포 환경 적용 여부

- 로컬에서만 먼저 붙일지, Render 운영 환경까지 바로 적용할지 확인해야 한다.
- Render에 실제 Secret을 등록하는 작업은 사용자가 직접 진행한다.

## 8. 이번 단계에서 하지 않을 일

- 사용자 확인 없이 LangChain/LangGraph 패키지를 설치하지 않는다.
- 사용자 확인 없이 `.env.example` 또는 환경변수 이름을 바꾸지 않는다.
- 사용자 확인 없이 OpenAI 등 실제 AI API를 연동하지 않는다.
- 사용자 확인 없이 Socket.io 이벤트 이름을 변경하지 않는다.
- 사용자 확인 없이 API 경로를 변경하지 않는다.
- 사용자 확인 없이 MongoDB 컬렉션 구조를 크게 변경하지 않는다.
- 사용자 확인 없이 Render Secret, GitHub Secret을 변경하지 않는다.
- 사용자 확인 없이 배포 구조를 Web Service 단일 배포에서 분리하지 않는다.

## 9. 구현 단계 초안

사용자 확인 후 아래 순서로 진행한다.

1. 루트 백엔드에 LangChain/LangGraph 관련 패키지 설치
2. `.env.example`, README, 배포 문서에 AI 환경변수 안내 추가
3. `backend/services/agentGraph.service.js` 추가
4. `backend/services/agent.service.js`에서 LangGraph 실행 함수 호출
5. `backend/services/chats.service.js`에서 챗봇 응답 저장과 Socket.io 전송 구조 연결
6. `frontend/src/components/ChatRoom.jsx`에서 AI 메시지 표시 보강
7. 서버 문법 확인과 빌드 검증
8. step 문서, PR 문서, progress 문서 작성

## 10. 검증 계획

가능한 범위에서 아래 검증을 실행한다.

| 검증 항목           | 명령 또는 방법                                    |
| ------------------- | ------------------------------------------------- |
| 서버 문법 확인      | `node --check backend/services/agent.service.js`  |
| 서버 문법 확인      | `node --check backend/services/chats.service.js`  |
| 서버 문법 확인      | 신규 서버 파일이 있으면 `node --check <file>`     |
| 프론트엔드 빌드     | `npm.cmd --prefix frontend run build`             |
| 루트 빌드           | `npm.cmd run build`                               |
| 서버 실행           | `npm.cmd start`                                   |
| Socket.io 상담 확인 | 로그인 사용자로 상담방 입장 후 메시지 송수신 확인 |
| 챗봇 응답 확인      | 딜러 오프라인 조건에서 AI 메시지 저장/표시 확인   |

실제 OpenAI API Key, Firebase, MongoDB Atlas 환경변수가 없으면 실동작 검증은 제한된다. 이 경우 문법 확인과 빌드를 우선 보고하고, 실제 환경에서 확인해야 할 항목을 따로 남긴다.

## 11. 우선 추천 확정안

다음 기준으로 진행하는 것을 추천한다.

1. Provider는 OpenAI로 시작한다.
2. 패키지는 루트 백엔드 의존성에 `langchain`, `@langchain/core`, `@langchain/langgraph`, `@langchain/openai`를 추가한다.
3. 챗봇은 서버에서만 실행한다.
4. 자동 응답은 딜러가 오프라인일 때만 동작한다.
5. 챗봇 메시지는 `messages` 컬렉션에 저장한다.
6. 챗봇 메시지는 `receive-message` 이벤트로 기존 상담방에 전송한다.
7. 프론트엔드에는 `AI 상담원` 배지를 표시한다.
8. 환경변수는 `OPENAI_API_KEY`, `AI_CHATBOT_ENABLED`, `AI_CHATBOT_MODEL`, `AI_CHATBOT_TEMPERATURE`를 사용한다.
9. 최근 메시지는 최대 20개만 context에 포함한다.
10. 답변은 차량 구매 상담 범위로 제한하고, 근거 없는 가격 보장이나 금융/법률 단정은 피한다.
