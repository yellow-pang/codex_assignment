# 22단계 챗봇 위젯 UI와 보안 보강 계획

## 1. 문서 목적

이번 단계는 `fix/chatbot-widget-layout` 브랜치에서 진행한 챗봇 UI 문제와 AI 보안 보강 작업의 범위를 분리해 기록하기 위한 계획 문서다.

21단계는 OpenAI, LangChain, LangGraph 기반 AI 상담원 기능 구현이 중심이었다.
이번 22단계는 기능 추가 이후 실제 확인 과정에서 발견된 UI/UX 문제와 보안 점검 보강을 다룬다.

## 2. 현재 작업 상태

| 항목 | 내용 |
| --- | --- |
| 현재 브랜치 | `fix/chatbot-widget-layout` |
| 작업 성격 | 챗봇 UI/UX 버그 수정, AI 보안 보강 |
| 신규 패키지 | 없음 |
| API 경로 변경 | 없음 |
| Socket.io 이벤트 변경 | 없음 |
| DB 컬렉션 구조 변경 | 없음 |

## 3. 문제 정의

확인된 문제는 아래와 같다.

1. AI 답변에 긴 URL과 문의 채널 문구가 포함되면 말풍선 밖으로 텍스트가 벗어난다.
2. AI가 `**굵게**` Markdown 문법을 사용하면 프론트에서 그대로 노출된다.
3. 채팅방에서 `AI에게 질문` 후 답변이 늦거나 실패하면 사용자는 처리 중인지 알기 어렵다.
4. `AI_CHATBOT_ENABLED=false`일 때 비활성 안내가 나오는 이유가 문서에서 충분히 명확하지 않다.
5. AI 기능 추가로 OpenAI Secret, 프롬프트 인젝션, 반복 요청 방어를 한 번 더 점검할 필요가 있다.

## 4. 작업 목표

- 챗봇 말풍선에서 긴 URL과 공백 없는 문자열이 안전하게 줄바꿈되도록 한다.
- AI 답변의 `**굵게**` 표현을 제한적으로 굵은 글씨로 렌더링한다.
- 채팅방 AI 질문 전송 후 대기/지연 상태를 표시한다.
- `AI_CHATBOT_ENABLED`가 AI API 호출 활성화 플래그임을 문서화한다.
- 프롬프트 인젝션성 질문 방어와 반복 요청 제한을 보강한다.
- 기존 21단계 문서에 섞인 fix 내용을 22단계 문서로 분리한다.

## 5. 구현 계획

### 5.1 챗봇 말풍선 줄바꿈

대상:

- `frontend/src/components/ChatRoom.jsx`
- `frontend/src/components/SiteChatbotWidget.jsx`

적용:

- `min-w-0`
- `overflow-hidden`
- `break-words`
- `[overflow-wrap:anywhere]`
- `whitespace-pre-wrap`

### 5.2 제한적 Markdown 렌더링

외부 Markdown 패키지는 추가하지 않는다.
`dangerouslySetInnerHTML`도 사용하지 않는다.

`**텍스트**` 패턴만 React 요소로 분리해 `<strong>`에 준하는 굵은 글씨로 표시한다.

### 5.3 AI 답변 대기/지연 상태

채팅방에서 구매자가 `AI에게 질문`을 누르면 임시 AI 메시지를 추가한다.

- 기본 문구: `AI 상담원이 답변을 준비 중입니다.`
- 실제 AI 메시지가 오면 임시 메시지를 제거하고 실제 응답으로 교체한다.
- 30초 이상 응답이 없으면 AI API 또는 네트워크 지연 가능성을 안내한다.
- Socket 오류가 발생하면 임시 메시지를 제거한다.

### 5.4 AI 보안 보강

보강 항목:

- `.env.example`의 OpenAI 키 예시를 실제 Secret처럼 보이지 않는 placeholder로 변경한다.
- 시스템 프롬프트에 프롬프트 인젝션 방어 문구를 추가한다.
- 차단 키워드에 시스템 프롬프트/개발자 메시지/이전 지시 무시 요청을 추가한다.
- 사이트 공통 챗봇의 동일 질문 반복 요청을 TTL 기준으로 차단한다.
- 배포 체크리스트에 AI Secret, 프롬프트 인젝션, 반복 요청 점검 항목을 추가한다.

## 6. 예상 변경 파일

| 파일 | 변경 내용 |
| --- | --- |
| `.env.example` | OpenAI 키 예시 placeholder 보정 |
| `README.md` | `AI_CHATBOT_ENABLED`와 AI 보안 설명 보강 |
| `backend/services/agentGraph.service.js` | 프롬프트 인젝션 방어 문구와 차단 키워드 추가 |
| `backend/services/siteChatbot.service.js` | 반복 요청 방어 추가 |
| `docs/deploy-checklist.md` | AI 보안 점검 항목 추가 |
| `docs/deploy-guide.md` | `AI_CHATBOT_ENABLED` 설명 보강 |
| `frontend/src/components/ChatRoom.jsx` | 줄바꿈, 굵게 표시, AI 대기/지연 상태 보강 |
| `frontend/src/components/SiteChatbotWidget.jsx` | 줄바꿈과 굵게 표시 보강 |
| `docs/progress.md` | 22단계 작업 기록 추가 |
| `docs/steps/2026-06-09-22-chatbot-widget-ux-security-fix.md` | 구현 완료 문서 추가 |
| `docs/pr/2026-06-09-22-chatbot-widget-ux-security-fix-pr.md` | PR 요약 문서 추가 |

## 7. 검증 계획

| 검증 항목 | 명령 또는 방법 |
| --- | --- |
| 서버 문법 확인 | `node --check backend/services/agentGraph.service.js` |
| 서버 문법 확인 | `node --check backend/services/siteChatbot.service.js` |
| 프론트엔드 빌드 | `npm.cmd --prefix frontend run build` |
| UI 확인 | 긴 URL, `**굵게**`, AI 대기/지연 말풍선 확인 |

## 8. 이번 단계에서 하지 않을 일

- 신규 npm 패키지를 추가하지 않는다.
- Socket.io 이벤트 이름을 변경하지 않는다.
- API 경로를 변경하지 않는다.
- DB 컬렉션 구조를 변경하지 않는다.
- Render Secret 또는 GitHub Secret을 직접 변경하지 않는다.
