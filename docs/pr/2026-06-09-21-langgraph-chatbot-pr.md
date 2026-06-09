# PR: LangGraph 챗봇 기능 구현

## PR 제목

```text
feat: LangGraph 기반 AI 상담원 기능 추가
```

## 작업 배경

기존 실시간 상담은 구매자와 딜러가 Socket.io로 직접 대화하는 구조였다.
`plan-09`에서 AI Agent 확장 지점은 마련되어 있었지만 실제 AI 응답은 생성하지 않았다.

이번 PR은 사용자가 확정한 기준에 따라 OpenAI `gpt-5.4-mini`, LangChain, LangGraph를 이용해 AI 상담원을 실제 상담 흐름에 연결한다.

## 변경 내용

### 1) LangChain/LangGraph 의존성 반영

사용자가 루트에서 직접 아래 패키지를 설치했다.

```text
langchain
@langchain/core
@langchain/langgraph
@langchain/openai
```

백엔드에서만 AI를 실행하므로 `frontend`에는 설치하지 않았다.

### 2) AI 메시지 컬렉션 분리

- 신규 `chatbot_messages` 컬렉션을 추가했다.
- 기존 구매자/딜러 메시지는 `messages` 컬렉션에 유지한다.
- 상담 메시지 조회 API는 두 컬렉션을 합쳐 시간순으로 반환한다.

### 3) LangGraph 상담 흐름 추가

- `backend/services/agentGraph.service.js`를 추가했다.
- 의도 분류, 차량 정보 정리, 사용 제한 확인, OpenAI 답변 생성, 안전 필터링 노드를 구성했다.
- 자동차와 무관한 질문, 보안 정보 요청, 사용량 제한 초과는 OpenAI 호출 없이 직접 문의 안내로 처리한다.

### 4) Socket.io 상담 흐름 연결

- 기존 이벤트 이름은 유지했다.
- `send-message` payload에 `requestAgent`를 받을 수 있게 했다.
- 딜러 오프라인이거나 구매자가 `AI에게 질문` 버튼을 누르면 AI 응답을 생성한다.
- AI 응답은 `receive-message`로 기존 상담방에 전송한다.

### 5) 프론트엔드 AI 상담 UI 추가

- `ChatRoom.jsx`에 구매자용 `AI에게 질문` 버튼을 추가했다.
- AI 메시지에는 `AI 상담원` 배지와 전용 민트 계열 말풍선을 적용했다.
- AI 답변 줄바꿈이 유지되도록 표시를 보강했다.
- AI 질문 전송 직후 답변 대기 말풍선을 표시하고, 실제 AI 응답이 오면 교체되도록 했다.
- 30초 이상 응답이 없으면 AI API 또는 네트워크 지연 가능성을 안내한다.

### 6) 사이트 공통 플로팅 챗봇 추가

- 오른쪽 아래 플로팅 AI 챗봇 버튼을 추가했다.
- 버튼 클릭 시 모달형 AI 챗봇 화면이 열린다.
- 비로그인 사용자는 로그인 안내를 보고, 로그인 사용자는 사이트 사용법과 차량 추천 질문을 보낼 수 있다.
- 공통 챗봇 기록은 `chatbot_messages` 컬렉션에 `contextType: "site"`로 저장한다.
- 상담방 화면에서는 기존 상담 UI와 겹치지 않도록 플로팅 챗봇을 숨긴다.

### 7) 문서와 배포 가이드 갱신

- `.env.example`에 AI 상담원 환경변수를 추가했다.
- README, Render 배포 가이드, 배포 체크리스트에 OpenAI Secret과 사용 제한 설정을 문서화했다.
- step 문서에 사용자가 직접 해야 할 Render Environment 설정 가이드를 추가했다.

## 변경 파일

```text
package.json
package-lock.json
.env.example
backend/db.js
backend/services/collections.js
backend/services/agent.service.js
backend/services/agentGraph.service.js
backend/services/chats.service.js
backend/services/siteChatbot.service.js
backend/sockets/chat.socket.js
frontend/src/App.jsx
frontend/src/components/ChatRoom.jsx
frontend/src/components/SiteChatbotWidget.jsx
README.md
docs/deploy-guide.md
docs/deploy-checklist.md
docs/plans/plan-19-langgraph-chatbot.md
docs/steps/2026-06-09-21-langgraph-chatbot.md
docs/pr/2026-06-09-21-langgraph-chatbot-pr.md
docs/progress.md
```

## 비기능 영향

| 항목 | 내용 |
| --- | --- |
| 배포 구조 | Render Web Service 단일 배포 유지 |
| Socket.io 이벤트 이름 | 변경 없음 |
| API 경로 | 변경 없음 |
| DB 컬렉션 | `chatbot_messages` 추가 |
| 환경변수 | OpenAI/AI 상담원 설정 추가 |
| Secret 관리 | `OPENAI_API_KEY`는 사용자가 Render Environment에 직접 등록 |

## 검증

```text
node --check backend/services/agentGraph.service.js  → 성공
node --check backend/services/agent.service.js       → 성공
node --check backend/services/chats.service.js       → 성공
node --check backend/sockets/chat.socket.js          → 성공
node --check backend/db.js                           → 성공
LangGraph 범위 밖 질문 실행 테스트                   → 성공
```

남은 검증:

1. 실제 `OPENAI_API_KEY`, Firebase, MongoDB Atlas 환경에서 AI 응답 저장 확인
2. 딜러 오프라인 조건의 자동 응답 확인
3. `AI에게 질문` 버튼 응답 확인
4. Render Environment 등록 후 재배포 확인

## 다음 단계

1. 사용자가 Render Environment에 `OPENAI_API_KEY`와 AI 환경변수를 등록한다.
2. 실제 상담방에서 AI 메시지가 `chatbot_messages`에 저장되는지 확인한다.
3. 비용 추이를 보고 `AI_CHATBOT_DAILY_ROOM_LIMIT`, `AI_CHATBOT_DAILY_USER_LIMIT` 값을 조정한다.
