# 18단계 요구사항 차이점 문서화

## 1. 작업 목적

서비스 요구사항 정의서와 현재 구현 상태를 비교했을 때, 기능이 부족해서 다른 부분과 과제용 프로젝트 특성상 더 안전하거나 단순한 방향으로 확장된 부분을 구분해 기록한다.

이번 단계에서는 코드를 수정하지 않는다.
이미 구현된 흐름을 억지로 요구사항 문장에 맞추기보다, 왜 달라졌는지와 이후 구현 여부 판단 기준을 문서로 남긴다.

## 2. 브랜치 판단

이번 작업은 기능 코드 변경 없이 문서만 추가하는 작은 작업이다.

| 항목 | 판단 |
| --- | --- |
| 새 브랜치 필요 여부 | 필수 아님 |
| 권장 작업 위치 | 현재 `dev` 브랜치 |
| 새 브랜치를 만든다면 | `docs/requirements-gap-notes` |
| 커밋 범위 | 요구사항 차이점 Step 문서, PR 요약 문서, 진행 기록 |

기능 구현, API 추가, 권한 정책 변경, DB 구조 변경으로 이어지는 경우에는 새 브랜치를 만드는 것이 좋다.
하지만 이번처럼 문서만 남기고 끝내는 경우에는 `dev`에서 커밋해도 충분하다.

## 3. 요구사항과 현재 구현의 주요 차이

| 번호 | 차이점 | 현재 구현 | 판단 |
| --- | --- | --- | --- |
| 1 | 회원가입 시 딜러 유형 선택 | 화면에서는 딜러 선택이 가능하지만 서버는 일반 가입을 `buyer`로 저장하고, admin 승인 후 `dealer`로 전환한다. | 요구사항보다 엄격한 보안 확장 |
| 2 | 차량 사진 1장 이상 필수 | 사진 없이도 등록 가능하며, 이미지가 없으면 placeholder를 보여준다. | 과제 제출 안정성을 위한 완화 |
| 3 | `POST /api/chats/rooms/:roomId/messages` 메시지 저장 API | REST 저장 API는 없고, Socket.io `send-message` 이벤트에서 메시지를 저장한다. | 현재는 문서화 권장, 필요 시 얇은 API로 추가 가능 |
| 4 | Render 배포 방식 | 요구사항에는 Frontend Static Site와 Backend Web Service 분리 예시가 있으나, 현재는 단일 Render Web Service를 유지한다. | AGENTS.md 기준과 현재 CI/CD 구조에 맞는 선택 |
| 5 | 관리자 기능 | 요구사항에서는 선택 구현이지만 현재는 admin 역할, 딜러 승인, 관리자 화면까지 구현되어 있다. | 요구사항 초과 구현 |

## 4. 차이점별 사유

### 4.1 딜러 가입 정책

요구사항은 회원가입 시 사용자 유형을 `buyer` 또는 `dealer`로 선택할 수 있다고 되어 있다.
현재 화면도 딜러 선택지를 제공한다.

다만 서버는 누구나 즉시 딜러 권한을 얻는 구조를 피하기 위해 일반 회원가입은 `buyer`로 저장하고, 이후 admin 승인을 통해 `dealer`가 되도록 구현했다.

이 방식은 차량 등록, 수정, 삭제 권한을 더 안전하게 통제할 수 있다.
과제용 프로젝트에서 반드시 요구사항 문장 그대로 맞출 필요가 없다면 현재 방식 유지가 더 낫다.

### 4.2 차량 사진 필수 여부

요구사항에는 차량 사진 1장 이상 업로드가 적혀 있다.
현재 구현은 사진 없이도 등록할 수 있고, 사진이 없거나 Render 재배포 후 업로드 파일이 사라져도 placeholder 이미지를 보여준다.

Render 무료 환경에서는 `/uploads` 파일이 영구 보관되지 않을 수 있다.
따라서 제출 안정성을 고려하면 사진 필수 검증을 강하게 걸기보다, placeholder fallback을 두는 현재 방식이 더 안전하다.

실제 서비스로 확장할 때는 외부 이미지 스토리지 도입 후 사진 필수 정책을 적용하는 것이 좋다.

### 4.3 상담 메시지 저장 REST API

요구사항의 상담 API 표에는 다음 API가 포함되어 있다.

```text
POST /api/chats/rooms/:roomId/messages
```

현재 구현은 메시지 저장을 REST API가 아니라 Socket.io `send-message` 이벤트에서 처리한다.
흐름은 다음과 같다.

```text
클라이언트 send-message 이벤트
→ 서버 handleChatMessage 함수
→ messages 컬렉션 저장
→ 같은 상담방에 receive-message 이벤트 전송
```

실시간 상담 기능의 핵심 요구사항은 충족한다.
메시지가 MongoDB에 저장되고, 같은 상담방 사용자에게 실시간으로 전달되며, 새로고침 후 이전 메시지도 조회된다.

다만 평가자가 Backend API 표를 기준으로 Postman이나 curl에서 `POST /api/chats/rooms/:roomId/messages` 존재 여부를 직접 확인한다면 감점 가능성이 있다.

## 5. 3번 구현 여부 추천 범위

현재 단계에서는 3번 REST 메시지 저장 API를 구현하지 않고 문서화만 하는 것을 추천한다.

이유:

- 실시간 상담의 실제 사용자 흐름은 Socket.io로 이미 동작한다.
- 메시지 저장 로직은 `handleChatMessage`로 분리되어 있어 AI Agent 확장 요구사항에도 맞다.
- REST 저장 API를 추가하면 같은 메시지를 Socket.io와 REST 양쪽으로 보낼 수 있어 중복 저장 방지, 응답 이벤트 처리, UI 반영 정책을 다시 정해야 한다.
- 과제용 프로젝트에서 “왜 다른지” 설명할 수 있다면 현재 구조가 더 단순하다.

구현이 필요한 경우의 최소 범위:

| 상황 | 추천 |
| --- | --- |
| 제출 평가가 실제 화면 중심 | 구현하지 않음 |
| 평가자가 Socket.io 상담 동작과 MongoDB 저장을 확인 | 구현하지 않음 |
| 평가자가 API 표 전체를 curl/Postman으로 확인 | 얇은 REST API 추가 검토 |
| 팀 문서에서 API 표와 실제 API를 100% 일치시켜야 함 | 구현 권장 |

만약 구현한다면 새 기능으로 크게 만들지 말고, 기존 `handleChatMessage`를 재사용하는 얇은 라우트만 추가한다.

예상 구현 범위:

```text
POST /api/chats/rooms/:roomId/messages
Authorization: Bearer <Firebase ID Token>
body: { "text": "메시지 내용" }
```

처리 방식:

1. `requireAuth`, `requireUserProfile`로 인증 사용자를 확인한다.
2. `req.params.roomId`와 `req.body.text`를 기존 `handleChatMessage`에 전달한다.
3. 저장된 메시지를 JSON으로 반환한다.
4. REST 요청만으로는 상대방 화면에 실시간 이벤트가 가지 않을 수 있으므로, 실제 화면 전송은 계속 Socket.io를 기본으로 둔다.

이 방식은 API 표를 맞추는 데는 도움이 되지만, 실제 채팅 UX에는 큰 이득이 없다.
따라서 지금은 문서화로 충분하고, 제출 전 API 표 검증이 강하게 요구될 때만 별도 단계로 구현하는 것을 권장한다.

## 6. 현재 유지할 기준

| 항목 | 유지 기준 |
| --- | --- |
| 인증 | Firebase Authentication + Firebase Admin ID Token 검증 |
| 사용자 식별 | Firebase UID |
| 딜러 권한 | admin 승인 기반 `dealer`, `dealerStatus: "approved"` |
| 차량 등록 권한 | 승인된 딜러만 가능 |
| 상담 메시지 저장 | Socket.io `send-message` → MongoDB `messages` 저장 |
| AI Agent 확장 | `handleChatMessage`, `generateAgentReply` 분리 유지 |
| 배포 | Render 단일 Web Service 유지 |
| 업로드 | `multer` + `/uploads`, Render 파일 비영속성 문서화 |

## 7. 검증

이번 단계는 코드 변경이 없는 문서화 작업이므로 별도 빌드 검증은 필수로 보지 않는다.

직전 요구사항 점검에서 확인한 결과:

| 검증 | 결과 |
| --- | --- |
| 주요 백엔드 파일 `node --check` | 성공 |
| `npm.cmd run build` | 성공 |

빌드 중 기존과 같은 frontend 의존성 moderate 취약점 2건과 `.env`의 `NODE_ENV=production` 관련 Vite 경고가 표시되었지만 빌드는 성공했다.

## 8. 다음 판단 기준

제출 전에는 다음 기준으로 추가 구현 여부를 결정한다.

1. 화면 중심 제출이면 현재 구현 유지.
2. API 목록 전체를 검사하는 평가라면 3번 REST 메시지 저장 API 추가를 별도 단계로 진행.
3. 사진 필수 여부를 엄격히 보겠다면 차량 등록 검증에 이미지 필수 정책을 추가하되, Render 파일 비영속성 문제를 함께 설명.
4. 딜러 즉시 가입을 요구한다면 admin 승인 정책을 완화할 수 있지만, 보안상 현재 정책 유지를 권장.
