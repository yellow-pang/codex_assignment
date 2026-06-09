# 22단계 챗봇 위젯 UI와 보안 보강

## 1. 작업 목적

AI 챗봇 기능 확인 중 발견된 말풍선 레이아웃, Markdown 표시, 답변 대기 UX, AI 보안 점검 항목을 보강했다.
이번 단계는 `fix/chatbot-widget-layout` 브랜치 기준의 후속 수정 작업이다.

## 2. 작업 요약

| 구분 | 내용 |
| --- | --- |
| 작업 유형 | 챗봇 UI/UX 수정, AI 보안 보강 |
| 신규 패키지 | 없음 |
| API 경로 변경 | 없음 |
| Socket.io 이벤트 변경 | 없음 |
| DB 구조 변경 | 없음 |

## 3. 수정 파일

- `.env.example`
- `README.md`
- `backend/services/agentGraph.service.js`
- `backend/services/siteChatbot.service.js`
- `docs/deploy-checklist.md`
- `docs/deploy-guide.md`
- `docs/progress.md`
- `frontend/src/components/ChatRoom.jsx`
- `frontend/src/components/SiteChatbotWidget.jsx`

## 4. 구현 상세

### 4.1 챗봇 말풍선 줄바꿈

공통 챗봇과 상담방 AI 말풍선에서 긴 URL이나 공백 없는 문자열이 말풍선 밖으로 벗어나지 않도록 보강했다.

적용한 방향:

- `min-w-0`
- `overflow-hidden`
- `break-words`
- `[overflow-wrap:anywhere]`
- `whitespace-pre-wrap`

### 4.2 AI 답변 굵게 표시

AI가 `**굵게**` Markdown 문법을 사용하면 기존에는 `**` 문자가 그대로 보였다.
외부 Markdown 패키지를 추가하지 않고, `**텍스트**` 패턴만 제한적으로 React 요소로 변환해 굵게 표시하도록 했다.

보안 기준:

- `dangerouslySetInnerHTML`을 사용하지 않는다.
- HTML 문자열을 직접 삽입하지 않는다.
- 링크 자동 변환은 하지 않는다.

### 4.3 채팅방 AI 대기/지연 UX

채팅방에서 구매자가 `AI에게 질문` 버튼을 누르면 임시 AI 메시지를 표시한다.

동작:

- 전송 직후 `AI 상담원이 답변을 준비 중입니다.` 말풍선을 표시한다.
- 실제 AI 메시지가 오면 임시 말풍선을 제거하고 실제 응답으로 교체한다.
- 30초 이상 응답이 없으면 AI API 또는 네트워크 지연 가능성을 안내한다.
- Socket 오류가 발생하면 임시 말풍선을 제거한다.

### 4.4 `AI_CHATBOT_ENABLED` 설명 보강

`AI_CHATBOT_ENABLED`는 배포 모드 값이 아니라 AI API 호출 활성화 플래그다.

- `false`: `OPENAI_API_KEY`가 있어도 OpenAI를 호출하지 않는다.
- `true`: OpenAI API 호출을 허용한다.

README와 배포 가이드에 이 설명을 추가했다.

### 4.5 AI 보안 보강

보강한 항목:

- `.env.example`의 `OPENAI_API_KEY` 예시를 실제 키처럼 보이지 않는 placeholder로 변경했다.
- 프롬프트 인젝션성 질문을 차단하기 위해 키워드를 추가했다.
- 시스템 프롬프트에 “이전 지시 무시”, “시스템 프롬프트 공개” 같은 요청을 따르지 않는 기준을 추가했다.
- 사이트 공통 챗봇에서 같은 질문이 짧은 시간 반복되면 `429`로 차단하도록 했다.
- 배포 체크리스트에 AI Secret, 프롬프트 인젝션, 반복 요청 점검 항목을 추가했다.

## 5. 검증 결과

| 검증 | 결과 |
| --- | --- |
| `node --check backend/services/agentGraph.service.js` | 성공 |
| `node --check backend/services/siteChatbot.service.js` | 성공 |
| `npm.cmd --prefix frontend run build` | 성공 |

참고:

- Vite의 기존 `NODE_ENV=production` 경고는 계속 출력되지만 빌드는 성공했다.

## 6. 남은 확인

1. 실제 브라우저에서 긴 URL과 문의 채널 문구가 말풍선 안에서 줄바꿈되는지 확인한다.
2. 실제 AI 응답의 `**굵게**` 표현이 굵은 글씨로 표시되는지 확인한다.
3. `AI에게 질문` 후 OpenAI 응답이 늦을 때 30초 지연 안내가 표시되는지 확인한다.
4. 같은 사이트 챗봇 질문을 빠르게 반복했을 때 `429` 응답과 사용자 안내가 적절한지 확인한다.
