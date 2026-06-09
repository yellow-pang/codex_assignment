# PR: 챗봇 위젯 UI와 보안 보강

## PR 제목

```text
fix: AI 챗봇 UI와 보안 처리 보강
```

## 작업 배경

LangGraph 기반 AI 챗봇 기능 추가 후 실제 화면 확인 과정에서 몇 가지 UX 문제가 발견되었다.

- 긴 URL과 문의 채널 문구가 말풍선 밖으로 벗어남
- AI 답변의 `**굵게**` Markdown 문법이 그대로 노출됨
- 채팅방에서 AI 응답이 늦을 때 사용자가 처리 상태를 알기 어려움
- `AI_CHATBOT_ENABLED`의 의미가 배포 설정인지 AI API 설정인지 혼동될 수 있음
- AI 기능 추가로 Secret 관리, 프롬프트 인젝션, 반복 요청 방어를 다시 점검할 필요가 있음

## 변경 내용

### 1) 챗봇 말풍선 줄바꿈 보강

- 상담방 AI 메시지와 사이트 공통 챗봇 메시지에 긴 URL 줄바꿈 처리를 추가했다.
- `overflow-wrap:anywhere`, `break-words`, `min-w-0` 기반으로 말풍선 밖 텍스트 이탈을 방지했다.

### 2) AI 답변 굵게 표시 처리

- AI 답변의 `**굵게**` Markdown 문법을 실제 굵은 글씨로 표시했다.
- 외부 Markdown 패키지는 추가하지 않았다.
- HTML 직접 삽입 없이 React 요소로만 변환해 XSS 위험을 줄였다.

### 3) 채팅방 AI 대기/지연 UX 추가

- `AI에게 질문` 전송 직후 임시 AI 대기 말풍선을 표시했다.
- 실제 AI 응답이 도착하면 임시 말풍선을 자동으로 교체한다.
- 30초 이상 응답이 없으면 AI API 또는 네트워크 지연 가능성을 안내한다.
- Socket 오류가 발생하면 임시 메시지를 제거한다.

### 4) AI 보안 처리 보강

- 프롬프트 인젝션성 키워드를 추가했다.
- 시스템 프롬프트에 이전 지시 무시, 시스템 프롬프트 공개 요청을 따르지 않는 기준을 추가했다.
- 사이트 공통 챗봇에서 같은 질문을 짧은 시간 반복하면 `429`로 차단한다.
- `.env.example`의 OpenAI 키 예시값을 실제 키처럼 보이지 않는 placeholder로 변경했다.

### 5) 문서 정리

- 21단계 LangGraph 구현 문서에 섞인 fix 내용을 제거했다.
- 이번 브랜치의 수정 내용은 22단계 plan/step/PR 문서로 분리했다.
- README와 배포 체크리스트에 AI Secret과 보안 점검 항목을 보강했다.

## 변경 파일

```text
.env.example
README.md
backend/services/agentGraph.service.js
backend/services/siteChatbot.service.js
docs/deploy-checklist.md
docs/deploy-guide.md
docs/plans/plan-19-langgraph-chatbot.md
docs/plans/plan-22-chatbot-widget-ux-security-fix.md
docs/pr/2026-06-09-21-langgraph-chatbot-pr.md
docs/pr/2026-06-09-22-chatbot-widget-ux-security-fix-pr.md
docs/progress.md
docs/steps/2026-06-09-21-langgraph-chatbot.md
docs/steps/2026-06-09-22-chatbot-widget-ux-security-fix.md
frontend/src/components/ChatRoom.jsx
frontend/src/components/SiteChatbotWidget.jsx
```

## 비기능 영향

| 항목 | 내용 |
| --- | --- |
| API 경로 | 변경 없음 |
| Socket.io 이벤트 | 변경 없음 |
| DB 구조 | 변경 없음 |
| 패키지 | 추가 없음 |
| 보안 | Secret 예시값, 프롬프트 인젝션 방어, 반복 요청 방어 보강 |

## 검증

```text
node --check backend/services/agentGraph.service.js   → 성공
node --check backend/services/siteChatbot.service.js  → 성공
npm.cmd --prefix frontend run build                   → 성공
```

참고:

- Vite의 기존 `NODE_ENV=production` 경고는 계속 출력되지만 빌드는 성공했다.

## 다음 단계

1. 실제 브라우저에서 긴 URL과 문의 채널 문구 줄바꿈을 확인한다.
2. 실제 AI 응답에서 `**굵게**` 표현이 굵은 글씨로 보이는지 확인한다.
3. AI 질문 응답 지연 상태와 반복 요청 차단 UX를 실제 환경에서 확인한다.
