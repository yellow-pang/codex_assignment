# 실시간 Car Market

React + Vite 프론트엔드와 Node.js + Express 백엔드로 구성한 중고차 마켓 과제 프로젝트입니다.
차량 데이터와 상담 데이터는 MongoDB Atlas에 저장하고, Firebase Authentication으로 로그인 사용자를 식별합니다.
배포는 Render Web Service 단일 배포 구조를 사용합니다.

## 배포 URL

```text
https://codex-assignment.onrender.com/
```

현재 `.env.example`에 정리된 환경변수 이름은 실제 Render Environment에도 반영되어 있으며, 현재 배포된 상태입니다.
단, README와 문서에는 실제 Secret 값을 작성하지 않습니다.

## 주요 기능

- 차량 목록 조회와 복합 검색
- 차량 상세 URL 접근과 새로고침 유지
- 승인된 딜러의 차량 등록, 수정, 삭제
- `multer` 기반 차량 사진 다중 업로드와 `/uploads` 정적 제공
- Firebase 이메일/비밀번호 회원가입, 로그인, 로그아웃
- Firebase ID Token 서버 검증과 보호 API 인증
- MongoDB `users` 컬렉션 기반 사용자 프로필 저장
- `buyer`, `dealer`, `admin` 역할 관리
- 일반 사용자의 딜러 신청과 admin의 승인/거절
- 차량 상세 화면에서 딜러와 상담방 생성
- Socket.io 기반 실시간 메시지 송수신
- MongoDB `chat_rooms`, `messages` 컬렉션 기반 상담방과 메시지 저장
- MongoDB `users` 문서 기반 딜러 온라인 상태 표시
- OpenAI, LangChain, LangGraph 기반 AI 상담원 응답
- 사이트 공통 플로팅 AI 챗봇 버튼과 모달형 상담 UI
- MongoDB `chatbot_messages` 컬렉션 기반 AI 상담 메시지 분리 저장

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, MongoClient |
| Authentication | Firebase Authentication |
| Realtime | Socket.io |
| AI Chatbot | OpenAI, LangChain, LangGraph |
| Upload | multer, Express `/uploads` static |
| Deploy | Render Web Service |
| CI/CD | GitHub Actions + Render Deploy Hook |

## 실행 방법

루트 의존성 설치:

```bash
npm install
```

프론트엔드 의존성 설치:

```bash
npm.cmd --prefix frontend install
```

서버 실행:

```bash
npm.cmd start
```

현재 서버 진입 파일은 `backend/server.js`이며, 루트 `npm start`가 이 파일을 실행합니다.
React 빌드 결과는 계속 `frontend/dist`에 생성되고, Express가 같은 Render Web Service에서 정적 파일로 제공합니다.

프론트엔드 개발 서버 실행:

```bash
npm.cmd --prefix frontend run dev
```

빌드:

```bash
npm.cmd run build
```

프론트엔드 개발 서버는 `/api/*` 요청을 Express 서버로 프록시합니다.
배포 환경에서는 Express가 React 빌드 결과와 API, Socket.io를 같은 origin에서 제공합니다.

## 환경 변수

루트 `.env` 또는 Render Environment에 아래 값을 등록합니다.
`.env.example`의 환경변수 이름은 현재 Render Environment에 반영된 기준이며, 실제 Secret 값은 커밋하지 않습니다.

```text
NODE_ENV=production
PORT=3000
MONGODB_URI=MongoDB Atlas 접속 문자열
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
DB_NAME=car_market
COLLECTION_CARS=cars
COLLECTION_USERS=users
COLLECTION_CHAT_ROOMS=chat_rooms
COLLECTION_MESSAGES=messages
COLLECTION_CHATBOT_MESSAGES=chatbot_messages
CLIENT_URL=http://localhost:5173
INITIAL_ADMIN_EMAILS=admin@example.com
OPENAI_API_KEY=OpenAI API Key
AI_CHATBOT_ENABLED=false
AI_CHATBOT_MODEL=gpt-5.4-mini
AI_CHATBOT_TEMPERATURE=0.3
AI_CHATBOT_DAILY_ROOM_LIMIT=10
AI_CHATBOT_DAILY_USER_LIMIT=20
AI_CHATBOT_CONTEXT_MESSAGE_LIMIT=20
AI_CHATBOT_MAX_REPLY_CHARS=700
FIREBASE_SERVICE_ACCOUNT_JSON=Firebase Admin 서비스 계정 JSON 문자열
VITE_API_BASE_URL=
VITE_FIREBASE_API_KEY=Firebase Web API key
VITE_FIREBASE_AUTH_DOMAIN=프로젝트ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=Firebase 프로젝트 ID
VITE_FIREBASE_APP_ID=Firebase 웹 앱 ID
```

환경변수 메모:

- `PORT`는 Render가 자동으로 제공합니다.
- `MONGODB_URI`는 서버 Secret이므로 클라이언트 코드나 문서에 실제 값을 쓰지 않습니다.
- `CLIENT_URL`은 Socket.io CORS 기준으로 사용합니다.
- `VITE_API_BASE_URL`은 프론트엔드와 API가 분리 배포된 경우에만 사용합니다. 현재 Render 단일 Web Service에서는 비워둘 수 있습니다.
- Firebase Web config 값은 공개 식별 정보이지만, 실제 값은 `.env` 또는 Render Environment에만 등록합니다.
- Firebase 콘솔에서 Authentication 이메일/비밀번호 제공자를 활성화해야 합니다.
- `FIREBASE_SERVICE_ACCOUNT_JSON`은 서버가 Firebase 로그인 토큰을 검증하기 위한 비밀값입니다. Firebase 콘솔의 Service accounts에서 새 private key를 만든 뒤 JSON 내용을 한 줄 문자열로 등록합니다.
- `FIREBASE_SERVICE_ACCOUNT_JSON`은 절대 프론트엔드 코드, GitHub 저장소, README 실제 값에 작성하지 않습니다.
- `OPENAI_API_KEY`는 AI 상담원이 OpenAI API를 호출할 때 사용하는 서버 Secret입니다. 프론트엔드 코드나 `VITE_*` 환경변수로 만들지 않습니다.
- `AI_CHATBOT_ENABLED`는 비용 방지를 위해 기본 `false`를 권장합니다. 실제 AI 상담을 켤 때 Render Environment 또는 로컬 `.env`에서 `true`로 설정합니다.
- `AI_CHATBOT_MODEL` 기본값은 `gpt-5.4-mini`입니다.
- `AI_CHATBOT_DAILY_ROOM_LIMIT`, `AI_CHATBOT_DAILY_USER_LIMIT`는 방별/사용자별 하루 AI 응답 횟수 제한입니다.
- `AI_CHATBOT_CONTEXT_MESSAGE_LIMIT`는 AI가 참고할 최근 메시지 수이며, `AI_CHATBOT_MAX_REPLY_CHARS`는 답변 최대 글자 수입니다.

## Render 배포와 GitHub Actions

이 프로젝트는 Render Web Service 하나로 배포합니다.

| 항목 | 값 |
| --- | --- |
| Service Type | Web Service |
| Runtime | Node |
| Node Version | `20.19` 이상 |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Publish Directory | 사용하지 않음 |

GitHub Actions workflow:

- 파일: `.github/workflows/deploy.yml`
- 실행 조건: `main` 브랜치 push 또는 수동 실행
- 흐름: 루트 의존성 설치, 프론트엔드 의존성 설치, 선택적 테스트, 빌드, Render Deploy Hook 호출
- Secret: `RENDER_DEPLOY_HOOK_URL`

현재 workflow와 문서의 배포 방식은 일치하므로, 이번 정리 단계에서는 workflow 파일을 수정하지 않았습니다.

## 주요 API

차량 목록:

```bash
curl https://codex-assignment.onrender.com/api/cars
```

복합 검색:

```bash
curl "https://codex-assignment.onrender.com/api/cars/search?keyword=sonata&company=HYUNDAI&minPrice=1000&maxPrice=3000&minYear=2020"
```

상담방 생성:

```bash
curl -X POST https://codex-assignment.onrender.com/api/chats/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Firebase_ID_TOKEN" \
  -d "{\"carId\":\"차량 ObjectId\"}"
```

상담방 상세와 이전 메시지 조회:

```bash
curl -H "Authorization: Bearer Firebase_ID_TOKEN" \
  https://codex-assignment.onrender.com/api/chats/rooms/상담방ID
curl -H "Authorization: Bearer Firebase_ID_TOKEN" \
  https://codex-assignment.onrender.com/api/chats/rooms/상담방ID/messages
```

사이트 공통 AI 챗봇:

```bash
curl -H "Authorization: Bearer Firebase_ID_TOKEN" \
  https://codex-assignment.onrender.com/api/chats/site-bot/messages

curl -X POST https://codex-assignment.onrender.com/api/chats/site-bot/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Firebase_ID_TOKEN" \
  -d "{\"text\":\"3000만원 이하 SUV 추천해줘\"}"
```

## Socket.io 이벤트

| 이벤트 | 설명 |
| --- | --- |
| `join-room` | 상담방 입장 |
| `send-message` | 메시지 전송 |
| `receive-message` | 저장된 메시지 수신 |
| `leave-room` | 상담방 나가기 |
| `dealer-online` | 딜러 온라인 상태 알림 |
| `dealer-offline` | 딜러 오프라인 상태 알림 |

Socket.io 연결 시에도 Firebase ID Token을 전달하며, 메시지는 서버에서 인증 사용자와 상담방 참여자를 검증한 뒤 MongoDB `messages` 컬렉션에 저장됩니다.
딜러 온라인 상태는 MongoDB `users` 문서의 `dealerOnline`, `dealerSocketIds`, `dealerConnectedAt`, `dealerLastSeenAt` 필드로 관리합니다.
서버가 재시작되면 기존 Socket.io 연결은 유효하지 않으므로 시작 과정에서 딜러 온라인 상태를 오프라인으로 정리합니다.

## 요구사항과 다른 구현 기준

과제 요구사항을 기본으로 구현하되, 제출 안정성과 보안을 위해 일부 항목은 현재 구조에 맞게 조정했습니다.

| 항목 | 현재 기준 | 이유 |
| --- | --- | --- |
| 딜러 회원가입 | 회원가입 후 admin 승인으로 딜러 권한 부여 | 누구나 즉시 차량 등록 권한을 갖지 않도록 보강 |
| 차량 사진 | 사진이 없거나 로딩 실패하면 placeholder 표시 | Render 무료 환경의 업로드 파일 비영속성 대응 |
| 메시지 저장 API | REST 저장 API 대신 Socket.io `send-message`에서 MongoDB 저장 | 실제 상담 화면은 실시간 이벤트 흐름이 핵심 |
| Render 배포 | Web Service 단일 배포 유지 | Express API, React 정적 파일, Socket.io를 같은 서버에서 제공 |

상담 메시지는 `POST /api/chats/rooms/:roomId/messages` REST API가 아니라 Socket.io 이벤트로 저장합니다.
API 표 전체를 직접 검증해야 하는 경우에는 기존 `handleChatMessage` 함수를 재사용하는 얇은 REST 라우트를 별도 단계로 추가할 수 있습니다.
자세한 판단 기준은 `docs/steps/2026-06-07-18-requirements-gap-documentation.md`에 정리했습니다.

## AI Agent 확장 준비

이번 과제에서는 실제 AI API를 연동하지 않습니다.
다만 상담 메시지 처리 로직을 `handleChatMessage` 함수로 분리해 이후 AI Agent 자동 응답으로 확장할 수 있게 했습니다.

향후 확장 방향:

1. 사용자가 차량에 대해 질문합니다.
2. 서버가 상담방, 차량 정보, 최근 메시지, 딜러 온라인 상태를 조회합니다.
3. 딜러가 온라인이면 기존처럼 딜러에게 메시지를 전달합니다.
4. 딜러가 오프라인이면 이후 단계에서 AI Agent 응답을 생성할 수 있습니다.
5. AI Agent 응답은 `messages` 컬렉션에 저장하고 `receive-message`로 전송할 수 있습니다.

## 검증 결과

로컬 검증:

| 명령 | 결과 |
| --- | --- |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build` | 성공 |

Render 상태:

| 항목 | 상태 |
| --- | --- |
| Render 배포 | 사용자 확인 기준 배포 완료 |
| Render URL | `https://codex-assignment.onrender.com/` |
| Render Environment | `.env.example` 기준으로 반영 완료 |

Render 실동작 확인은 사용자 확인 기준입니다.
이 문서 정리 과정에서는 배포 설정이나 Secret을 직접 변경하지 않았습니다.

## 주의사항과 한계

- `.env` 파일은 커밋하지 않습니다.
- Render Secret, GitHub Secret, MongoDB 접속 문자열은 문서에 작성하지 않습니다.
- Firebase Admin SDK 기반 서버 토큰 검증을 사용하므로 Render Environment에 `FIREBASE_SERVICE_ACCOUNT_JSON`을 등록해야 보호 API가 동작합니다.
- 차량 사진은 `multer`로 서버의 `uploads/` 폴더에 저장합니다.
- 차량 등록/수정 시 최대 8장까지 업로드할 수 있고, MongoDB에는 대표 이미지 `imageUrl`과 전체 목록 `imageUrls`를 함께 저장합니다.
- 이미지 파일이 없거나 재배포 후 사라진 경우 화면에서는 `/uploads/default-car.png` placeholder로 대체됩니다.
- Render 무료 환경에서는 재배포, 인스턴스 재시작, 환경 재생성 시 `uploads/` 파일이 유지되지 않을 수 있습니다.
- 장기 운영이 필요하면 S3, Cloudinary 같은 외부 이미지 스토리지 도입을 검토해야 합니다.
- 실제 AI Agent API 연동은 향후 확장 작업입니다.

