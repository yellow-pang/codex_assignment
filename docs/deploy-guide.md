# Render 배포 및 GitHub Actions CI/CD 가이드

## 1. 프로젝트 배포 구조 요약

현재 프로젝트는 `backend` 폴더에 Express 서버가 있고, `frontend` 폴더에 Vite React 프로젝트가 있는 구조이다.
Render 배포는 기존처럼 루트 `package.json`의 통합 스크립트를 사용하는 단일 Web Service 구조를 유지한다.

| 구분 | 위치 | 역할 |
| --- | --- | --- |
| Express API | `backend/server.js` | 자동차 CRUD REST API, Socket.io, React 정적 파일 제공 |
| MongoDB 연결 | `backend/db.js` | MongoDB Atlas 연결과 컬렉션 준비 |
| 백엔드 경로/업로드 설정 | `backend/config/` | React 빌드 경로, 업로드 경로, `multer` 설정 관리 |
| 차량 사진 업로드 | `uploads/` | `multer`가 저장한 차량 사진 제공. 최대 8장 다중 업로드, 루트 경로 유지 |
| React 앱 | `frontend/` | 자동차 CRUD 화면 제공 |
| React 빌드 결과 | `frontend/dist/` | Express가 정적 파일로 제공 |
| CI/CD 설정 | `.github/workflows/deploy.yml` | 빌드 성공 후 Render Deploy Hook 호출 |

구조 판단 결과는 `backend Express + frontend React + 루트 통합 package` 구조이다.
과제용 배포 방식으로는 Render Web Service 하나에서 Express와 React를 함께 제공하는 방식을 추천한다.

현재 배포 URL:

```text
https://codex-assignment.onrender.com/
```

사용자 확인 기준으로 `.env.example`에 정리된 환경변수 이름은 Render Environment에도 반영되어 있으며 현재 배포된 상태다.
실제 Secret 값은 이 문서에 작성하지 않는다.

## 2. Render 배포 방식 설명

Render에는 `Web Service` 하나를 생성한다.
빌드 단계에서는 React 앱을 빌드하고, 실행 단계에서는 Express 서버를 실행한다.
Express 서버는 `frontend/dist` 폴더를 정적 파일로 제공하므로 사용자는 Render URL에서 React 화면을 볼 수 있다.
`backend/server.js`는 백엔드 폴더 기준에서 루트 `frontend/dist`와 `uploads/` 경로를 계산한다.

React와 Express를 분리해서 React Static Site와 Express Web Service 두 개로 배포하는 방법도 가능하다.
하지만 과제용 프로젝트에서는 설정이 늘어나므로 단일 Web Service 방식이 더 단순하다.
현재 프로젝트는 API, React 정적 파일, Socket.io를 같은 Render Web Service에서 제공한다.

## 3. GitHub Actions CI/CD 흐름 설명

`main` 브랜치에 push되거나 수동 실행하면 GitHub Actions가 다음 순서로 동작한다.

1. 소스 코드를 checkout한다.
2. Node.js 20을 설정한다.
3. 루트 의존성을 설치한다.
4. `frontend` 의존성을 설치한다.
5. 테스트 스크립트가 있으면 실행하고, 없으면 건너뛴다.
6. 루트 `npm run build`를 실행한다.
7. 빌드가 성공하면 Render Deploy Hook을 호출한다.

Deploy Hook URL은 코드에 직접 작성하지 않고 GitHub Secrets의 `RENDER_DEPLOY_HOOK_URL`에 등록한다.

## 4. 배포 전 로컬 확인 명령어

루트 폴더에서 다음 명령어를 실행한다.

```bash
npm install
npm run build
npm start
```

서버 실행 후 확인할 주소:

```text
http://localhost:3000
http://localhost:3000/api/cars
```

`/api/cars`에서 자동차 목록 JSON이 보이면 API 연결이 정상이다.
루트 `npm start`는 내부적으로 `node backend/server.js`를 실행한다.

## 5. GitHub Push 전 확인사항

- `.env` 파일을 커밋하지 않는다.
- `.env.example`에는 실제 비밀값을 넣지 않는다.
- `npm run build`가 성공하는지 확인한다.
- `backend/server.js`에서 `process.env.PORT`를 사용하고 있는지 확인한다.
- React 코드에서 `localhost` API 주소를 직접 호출하지 않는지 확인한다.
- GitHub Actions Secret 등록 전에는 Deploy Hook이 동작하지 않는다.

## 6. Render Web Service 생성 절차

1. Render에 로그인한다.
2. `New +` 버튼을 누른다.
3. `Web Service`를 선택한다.
4. GitHub 저장소를 연결한다.
5. 현재 프로젝트 저장소를 선택한다.
6. 아래 Render 설정값을 입력한다.
7. Deploy Hook URL을 생성해서 GitHub Secrets에 등록한다.
8. Auto-Deploy는 GitHub Actions와 중복될 수 있으므로 `Off`를 권장한다.

## 7. Render 설정값

| 항목 | 값 |
| --- | --- |
| Service Type | Web Service |
| Runtime | Node |
| Node Version | `20.19` 이상 |
| Branch | `main` |
| Root Directory | 비워둠 또는 루트 |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Publish Directory | 사용하지 않음 |
| Auto-Deploy | Off 권장 |

### Environment Variables

| 이름 | 값 | 설명 |
| --- | --- | --- |
| `NODE_ENV` | `production` | 배포 환경 표시 |
| `PORT` | Render 자동 제공 | Express 서버 포트 |
| `MONGODB_URI` | MongoDB Atlas 접속 문자열 | 서버에서만 사용하는 DB 접속 비밀값 |
| `MONGODB_DNS_SERVERS` | `1.1.1.1,8.8.8.8` | 로컬 또는 배포 환경에서 Atlas SRV DNS 조회가 막힐 때 선택적으로 사용 |
| `DB_NAME` | `car_market` | 사용할 MongoDB 데이터베이스 이름 |
| `COLLECTION_CARS` | `cars` | 차량 데이터 컬렉션 |
| `COLLECTION_USERS` | `users` | 사용자 추가 정보 컬렉션 |
| `COLLECTION_CHAT_ROOMS` | `chat_rooms` | 상담방 컬렉션 |
| `COLLECTION_MESSAGES` | `messages` | 상담 메시지 컬렉션 |
| `COLLECTION_CHATBOT_MESSAGES` | `chatbot_messages` | AI 상담 메시지 컬렉션 |
| `CLIENT_URL` | 로컬 또는 배포된 React 주소 | Socket.io CORS 설정에 사용할 클라이언트 주소 |
| `INITIAL_ADMIN_EMAILS` | 최초 관리자 이메일 | 쉼표로 여러 이메일 등록 가능, 서버에서만 사용 |
| `OPENAI_API_KEY` | OpenAI API Key | AI 상담원이 OpenAI API를 호출할 때 사용하는 서버 Secret |
| `AI_CHATBOT_ENABLED` | `true` 또는 `false` | AI 상담원 기능 활성화 여부 |
| `AI_CHATBOT_MODEL` | `gpt-5.4-mini` | AI 상담원 응답 생성 모델 |
| `AI_CHATBOT_TEMPERATURE` | `0.3` | AI 응답 다양성 설정 |
| `AI_CHATBOT_DAILY_ROOM_LIMIT` | `10` | 상담방별 하루 AI 응답 제한 |
| `AI_CHATBOT_DAILY_USER_LIMIT` | `20` | 사용자별 하루 AI 응답 제한 |
| `AI_CHATBOT_CONTEXT_MESSAGE_LIMIT` | `20` | AI가 참고할 최근 메시지 수 |
| `AI_CHATBOT_MAX_REPLY_CHARS` | `700` | AI 답변 최대 글자 수 |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin 서비스 계정 JSON 문자열 | 서버에서 Firebase ID Token을 검증할 때 사용하는 Secret |
| `VITE_API_BASE_URL` | 비워둠 또는 API 서버 주소 | 같은 origin 배포가 아닐 때 Socket.io 클라이언트가 사용할 서버 주소 |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | React Firebase Authentication 설정 |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | 예: `프로젝트ID.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Firebase 프로젝트 ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | Firebase 웹 앱 식별자 |

`PORT`는 Render가 자동으로 제공하므로 직접 입력하지 않아도 된다.
`MONGODB_URI`는 비밀값이므로 GitHub 저장소, 문서, 클라이언트 코드에 실제 값을 작성하지 않는다.
`OPENAI_API_KEY`도 서버 Secret이므로 GitHub 저장소, 문서, 프론트엔드 코드, `VITE_*` 환경변수에 실제 값을 작성하지 않는다.
Firebase Web config 값은 클라이언트에서 사용하는 공개 식별 정보이지만, 실제 값은 `.env` 또는 Render Environment에만 등록하고 `.env.example`에는 예시만 작성한다.
15단계 보안 강화 이후에는 `.env.example`에 `FIREBASE_SERVICE_ACCOUNT_JSON`이 추가되었으므로 Render Environment에도 이 값을 새로 등록해야 한다.
단일 Web Service 배포에서는 `VITE_API_BASE_URL`을 비워둘 수 있다.

`FIREBASE_SERVICE_ACCOUNT_JSON`은 Firebase 콘솔의 Service accounts에서 발급하는 서버용 비밀값이다.
이 값은 서버가 브라우저에서 온 Firebase ID Token이 진짜인지 확인할 때 사용한다.
실제 JSON 내용은 GitHub, README, 프론트엔드 코드에 작성하지 않고 Render Environment 또는 로컬 `.env`에만 등록한다.
private key 안의 줄바꿈은 환경변수에 넣을 때 `\n` 형태로 보존되어야 한다.

### AI 상담원 설정

AI 상담원은 OpenAI, LangChain, LangGraph를 백엔드에서만 실행한다.
Render Environment에 `OPENAI_API_KEY`를 등록하고, 실제 운영에서 AI 상담을 켤 때 `AI_CHATBOT_ENABLED=true`로 설정한다.
비용 방지를 위해 로컬 예시와 초기 설정에서는 `AI_CHATBOT_ENABLED=false`를 사용할 수 있다.

AI 상담원은 아래 조건에서만 응답한다.

1. 딜러가 오프라인인 상담방에서 구매자가 메시지를 보낸 경우
2. 구매자가 채팅창의 `AI에게 질문` 버튼으로 메시지를 보낸 경우

AI 메시지는 기존 `messages` 컬렉션이 아니라 `chatbot_messages` 컬렉션에 저장된다.
상담 메시지 조회 API는 일반 메시지와 AI 메시지를 합쳐 시간순으로 반환한다.
AI 답변은 차량 구매 상담 범위로 제한하며, 자동차와 무관하거나 법률/금융/보험/세금처럼 단정하기 어려운 질문은 가상의 대표 전화, 카카오 채널, 인스타그램 주소로 직접 문의를 유도한다.

### Firebase Authentication 설정 주의사항

이번 단계의 인증은 Firebase Authentication 이메일/비밀번호 로그인을 사용한다.
Firebase 콘솔에서 사용자가 직접 이메일/비밀번호 제공자를 활성화해야 한다.

회원가입 후 추가 사용자 정보는 MongoDB `users` 컬렉션에 저장한다.
MongoDB 사용자 프로필 저장이 실패하면 클라이언트에서 방금 생성한 Firebase 계정을 삭제하는 보정을 시도한다.

서버는 Firebase Admin SDK로 Firebase ID Token을 먼저 검증하고, 검증된 UID로 MongoDB `users` 컬렉션의 `role`, `dealerStatus`를 조회해 권한을 확인한다.
클라이언트가 body나 query로 보내는 `uid`, `dealerId`, `requesterUid`, `buyerId`, `senderId`는 서버 권한 판단에 사용하지 않는다.
일반 회원가입은 `buyer`로 생성되고, 딜러 권한은 admin 승인을 받은 사용자만 사용할 수 있다.
차량 등록, 수정, 삭제는 승인된 딜러만 가능하며 수정과 삭제는 차량을 등록한 딜러 본인만 가능하다.

### 최초 관리자 설정

Render Environment 또는 로컬 `.env`에 `INITIAL_ADMIN_EMAILS`를 등록한다.

```text
INITIAL_ADMIN_EMAILS=admin@example.com
```

여러 명이 필요하면 쉼표로 구분한다.

```text
INITIAL_ADMIN_EMAILS=admin@example.com,owner@example.com
```

해당 이메일로 회원가입하면 서버가 MongoDB `users` 문서를 `role: "admin"`으로 저장한다.
이미 회원가입한 뒤라면 MongoDB Atlas 콘솔에서 해당 사용자의 `role`을 `admin`으로 직접 변경할 수도 있다.

### 차량 사진 업로드 주의사항

차량 사진은 `multer`를 사용해 서버의 `uploads/` 폴더에 저장하고, Express가 `/uploads` 정적 경로로 제공한다.
차량 등록/수정 시 최대 8장까지 업로드할 수 있으며, MongoDB `cars` 문서에는 대표 이미지 `imageUrl`과 전체 이미지 목록 `imageUrls`를 함께 저장한다.
사진이 없거나 이미지 파일 로딩에 실패한 차량은 `/uploads/default-car.png`를 기본 이미지 경로로 사용하므로, 기본 이미지를 표시하려면 해당 경로에 이미지 파일을 추가한다.

Render 무료 환경에서는 배포된 Web Service의 파일 시스템이 영구 저장소가 아니다.
재배포, 인스턴스 재시작, 환경 재생성 시 `uploads/`에 저장된 파일이 사라질 수 있다.
이번 구현은 깨진 이미지가 그대로 노출되지 않도록 placeholder fallback을 강화했지만, 실제 업로드 사진을 영구 보관하려면 S3, Cloudinary 같은 외부 이미지 스토리지를 검토한다.

### 차량 등록 설정

관리자 화면의 `차량 등록 설정` 탭에서 연식, 가격, 주행거리 입력 단위와 최대 사진 개수를 저장할 수 있다.
설정은 MongoDB `settings` 컬렉션에 `key: "carForm"` 문서로 저장된다.
기본값은 연식 1년, 가격 100만원, 주행거리 1,000km, 최대 사진 8장이다.

## 8. Render Deploy Hook 생성 방법

1. Render 서비스 상세 화면으로 이동한다.
2. `Settings` 메뉴를 연다.
3. `Deploy Hook` 항목을 찾는다.
4. Deploy Hook URL을 생성한다.
5. URL을 복사한다.
6. 이 URL은 비밀값이므로 코드나 문서에 실제 값을 작성하지 않는다.

## 9. GitHub Secrets 등록 방법

1. GitHub 저장소로 이동한다.
2. `Settings` 메뉴를 연다.
3. `Secrets and variables`를 선택한다.
4. `Actions`를 선택한다.
5. `New repository secret`을 클릭한다.
6. Name에 `RENDER_DEPLOY_HOOK_URL`을 입력한다.
7. Secret 값에 Render Deploy Hook URL을 붙여넣는다.
8. 저장한다.

## 10. GitHub Actions Workflow 설명

워크플로우 파일 위치:

```text
.github/workflows/deploy.yml
```

주요 설정:

| 항목 | 내용 |
| --- | --- |
| Workflow 이름 | `CI/CD Deploy to Render` |
| 실행 조건 | `main` 브랜치 push, 수동 실행 |
| Node 버전 | 20 |
| 설치 명령 | `npm ci`, `npm ci --prefix frontend` |
| 빌드 명령 | `npm run build` |
| 배포 명령 | `curl -fsSL -X POST "$RENDER_DEPLOY_HOOK_URL"` |

테스트 스크립트가 현재 없으므로 workflow는 테스트 단계를 자동으로 건너뛴다.
현재 `.github/workflows/deploy.yml`은 루트 통합 스크립트 기준 설명과 일치하므로 backend 폴더 분리 후에도 workflow 파일을 수정하지 않는다.

## 11. 배포 후 확인 방법

Render 배포가 끝나면 Render에서 제공하는 URL로 접속한다.

현재 배포 URL:

```text
https://codex-assignment.onrender.com/
```

확인할 항목:

- React 자동차 관리 화면이 표시되는지 확인한다.
- `https://배포주소/api/cars`에서 자동차 목록 JSON이 응답되는지 확인한다.
- 자동차 등록, 수정, 삭제 버튼이 동작하는지 확인한다.
- 차량 사진 여러 장 업로드 후 목록에는 대표 이미지가, 상세 화면에는 실제 사진 개수에 맞는 갤러리가 보이는지 확인한다.
- 사진 없는 차량에서 `/uploads/default-car.png` 기본 이미지가 보이는지 확인한다.
- 업로드된 이미지 파일이 없거나 로딩 실패한 경우에도 깨진 이미지 대신 placeholder가 보이는지 확인한다.
- 로그인 후 `/cars/:id` 상세 URL에 직접 접근하고 새로고침해도 상세 정보가 유지되는지 확인한다.
- 차량 상세 화면에서 `딜러와 상담하기`를 눌렀을 때 `/chats/:roomId` 준비 화면으로 이동하는지 확인한다.
- MongoDB `chat_rooms` 컬렉션에 상담방 문서가 생성 또는 갱신되는지 확인한다.
- `/chats/:roomId`에서 메시지를 전송하면 MongoDB `messages` 컬렉션에 저장되고 같은 상담방 화면에 실시간으로 표시되는지 확인한다.
- 딜러 계정으로 상담방에 접속하면 구매자 화면에 `dealer-online`, 접속 종료 시 `dealer-offline` 상태가 표시되는지 확인한다.
- MongoDB `users` 문서의 `dealerOnline`, `dealerSocketIds`, `dealerConnectedAt`, `dealerLastSeenAt` 필드가 접속 상태에 따라 갱신되는지 확인한다.
- 서버 재시작 후 이전 Socket.io 연결 흔적이 오프라인 상태로 정리되는지 확인한다.
- 차량 등록자 본인이 자기 차량으로 상담방을 만들면 서버가 차단하는지 확인한다.
- 브라우저 새로고침 후 화면이 유지되는지 확인한다.
- Render Logs에 포트 또는 빌드 오류가 없는지 확인한다.
- GitHub Actions 실행 결과가 성공인지 확인한다.

## 12. 자주 발생하는 오류와 해결 방법

| 오류 | 원인 | 해결 방법 |
| --- | --- | --- |
| `process.env.PORT` 누락 | Render가 제공한 포트를 사용하지 않음 | `const port = process.env.PORT || 3000` 사용 |
| `npm start` 없음 | Render Start Command가 실행할 스크립트 없음 | 루트 `package.json`에 `start` 추가 |
| React 빌드 경로 오류 | Express 정적 경로와 Vite 출력 경로가 다름 | `frontend/dist` 경로 확인 |
| localhost API 호출 문제 | 배포 환경에서 localhost는 사용자 PC가 아님 | React에서는 `/api/...` 상대 경로 사용 |
| 새로고침 시 404 | React fallback 설정 없음 | API 라우트 뒤에 `app.get("*")` fallback 배치 |
| 환경변수 누락 | Render 또는 GitHub Secrets에 값이 없음 | Render Environment와 GitHub Secrets 확인 |
| `MONGODB_URI 환경변수가 설정되지 않았습니다.` | 서버 실행 환경에 MongoDB 접속 문자열이 없음 | 로컬 `.env` 또는 Render Environment에 `MONGODB_URI` 등록 |
| `querySrv ECONNREFUSED _mongodb._tcp...` | DNS 서버가 Atlas SRV 레코드 조회를 거부함 | `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8` 설정 또는 PC DNS 변경 |
| `MongoDB 연결 실패` | 접속 문자열, Atlas IP 허용, 사용자 권한 문제 | Atlas Network Access, Database User, 접속 문자열 확인 |
| 차량 이미지 404 | `uploads` 파일이 없거나 기본 이미지가 없음 | `uploads/default-car.png` 또는 업로드된 파일 존재 여부 확인 |
| 업로드 파일 사라짐 | Render 무료 환경의 파일 시스템 비영속성 | 외부 이미지 스토리지 도입 검토 |
| `Cannot find module 'react-router-dom'` | React Router 의존성이 아직 설치되지 않음 | `npm.cmd --prefix frontend install react-router-dom` 실행 후 lockfile 커밋 |
| `/cars/:id` 새로고침 문제 | React fallback 또는 Router 설정 문제 | Express fallback이 API 라우트 뒤에 있는지, `BrowserRouter`가 적용됐는지 확인 |
| 상담방 생성 실패 | 인증 토큰 없음, 차량 딜러 정보 누락, MongoDB 사용자 문서 없음, 자기 자신 상담 요청 | 로그인 상태, `Authorization: Bearer` 전달, 차량의 `dealerId`, MongoDB `users` 문서 확인 |
| 보호 API가 모두 401 응답 | Firebase ID Token이 없거나 만료됨 | 로그인 상태와 프론트 요청의 `Authorization: Bearer` 헤더 확인 |
| 보호 API가 모두 500 응답 | `FIREBASE_SERVICE_ACCOUNT_JSON` 누락 또는 JSON 형식 오류 | Render Environment 또는 로컬 `.env`의 서비스 계정 JSON 값을 확인 |
| Deploy Hook 실패 | Secret 이름이 다르거나 URL이 비어 있음 | `RENDER_DEPLOY_HOOK_URL` 이름 확인 |
| `Cannot find module 'tailwindcss'` | Render 빌드에서 프론트엔드 devDependencies가 설치되지 않음 | 루트 `build` 스크립트에서 `npm install --include=dev --prefix frontend` 사용 |

## 13. 과제 제출용 설명 문구

이 프로젝트는 MongoDB Atlas, Firebase Authentication, Socket.io를 사용해 차량 검색, 딜러 권한 관리, 차량 사진 업로드, 실시간 상담을 구현한 실시간 Car Market 웹 애플리케이션입니다.
Render Web Service 하나로 Express API, Socket.io 서버, React 빌드 결과물을 함께 제공하며, GitHub Actions에서 빌드 성공 후 Render Deploy Hook을 호출하는 CI/CD 흐름을 구성했습니다.
현재 배포 URL은 `https://codex-assignment.onrender.com/`입니다.
