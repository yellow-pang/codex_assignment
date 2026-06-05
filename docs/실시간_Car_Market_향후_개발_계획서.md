# 실시간 Car Market 향후 개발 계획서

## 1. 문서 목적

이 문서는 `실시간 Car Market 서비스 요구사항 정의서`와 현재 프로젝트 구현 상태를 비교한 뒤, 앞으로 어떤 순서로 개발을 진행할지 정리하기 위해 작성한다.

현재 프로젝트는 기존 자동차 CRUD 앱을 Render 단일 Web Service로 배포할 수 있도록 구성한 상태이며, 새 요구사항인 Firebase Authentication, MongoDB Atlas, 차량 사진 업로드, Socket.io 상담, AI Agent 확장 준비는 아직 본격 구현 전 단계로 판단한다.

## 2. 기준 문서 및 확인한 파일

| 구분           | 확인 대상                                                                    |
| -------------- | ---------------------------------------------------------------------------- |
| 신규 요구사항  | `docs/실시간_Car_Market_서비스_요구사항_정의서.md`                           |
| 기존 요구사항  | `docs/requirements.md`                                                       |
| 진행 기록      | `docs/progress.md`                                                           |
| 배포 문서      | `docs/deploy-guide.md`, `docs/deploy-checklist.md`                           |
| GitHub Actions | `.github/workflows/deploy.yml`                                               |
| 백엔드         | `server.js`, `package.json`                                                  |
| 프론트엔드     | `frontend/src/App.jsx`, `frontend/src/components/*`, `frontend/package.json` |

## 3. 현재 구현 상태 요약

| 영역                    | 현재 상태                                   | 판단                 |
| ----------------------- | ------------------------------------------- | -------------------- |
| Express 서버            | `server.js`에서 자동차 CRUD API 제공        | 부분 구현            |
| React 프론트엔드        | 목록, 등록, 수정, 상세, 삭제 화면 제공      | 부분 구현            |
| Tailwind CSS / daisyUI  | 적용 완료                                   | 구현                 |
| 차량 데이터 저장        | 서버 메모리 배열 사용                       | 신규 요구사항 미충족 |
| MongoDB Atlas           | 패키지와 연결 코드 없음                     | 미구현               |
| Firebase Authentication | 패키지와 인증 화면 없음                     | 미구현               |
| 사용자 역할             | 일반 사용자, 딜러 구분 없음                 | 미구현               |
| 차량 검색               | 제조사 검색, 가격 필터만 분리 구현          | 부분 구현            |
| 차량 상세               | 상태 기반 상세 화면 제공                    | 부분 구현            |
| 사진 업로드             | `multer`, `/uploads` 정적 제공 없음         | 미구현               |
| Socket.io 상담          | 패키지와 서버/클라이언트 코드 없음          | 미구현               |
| AI Agent 확장 구조      | 상담 처리 함수 분리 구조 없음               | 미구현               |
| Render 배포             | 단일 Web Service 배포 문서와 빌드 구조 있음 | 구현                 |
| GitHub Actions CI/CD    | 빌드 후 Render Deploy Hook 호출             | 구현                 |

## 4. 현재 API 상태

현재 서버는 React 배포 환경에서 `/api` 접두사를 제거해 기존 Express API로 연결한다.

| 기능           | 현재 Express API                | 신규 요구사항 API                   | 상태                      |
| -------------- | ------------------------------- | ----------------------------------- | ------------------------- |
| 차량 목록 조회 | `GET /cars`                     | `GET /api/cars`                     | 배포 미들웨어로 연결 가능 |
| 차량 상세 조회 | `GET /cars/:id`                 | `GET /api/cars/:id`                 | 배포 미들웨어로 연결 가능 |
| 차량 등록      | `POST /cars`                    | `POST /api/cars`                    | JSON 등록만 가능          |
| 차량 수정      | `PUT /cars/:id`                 | `PUT /api/cars/:id`                 | 기본 CRUD 가능            |
| 차량 삭제      | `DELETE /cars/:id`              | `DELETE /api/cars/:id`              | 기본 CRUD 가능            |
| 제조사 검색    | `GET /cars/search?company=...`  | `GET /api/cars/search?...`          | 일부 가능                 |
| 가격 검색      | `GET /cars/filter?minPrice=...` | `GET /api/cars/search?minPrice=...` | API 통합 필요             |
| 사용자 API     | 없음                            | `/api/users/*`                      | 미구현                    |
| 상담 API       | 없음                            | `/api/chats/*`                      | 미구현                    |

## 5. CI/CD 및 Render 배포 상태

현재 GitHub Actions workflow는 다음 순서로 동작한다.

1. `main` 브랜치 push 또는 수동 실행 시 시작한다.
2. Node.js 20을 설정한다.
3. 루트와 `frontend` 의존성을 `npm ci`로 설치한다.
4. 테스트 스크립트가 있으면 실행하고, 없으면 건너뛴다.
5. `npm run build`로 React 앱을 빌드한다.
6. GitHub Secret `RENDER_DEPLOY_HOOK_URL`을 사용해 Render Deploy Hook을 호출한다.

이 구조는 현재 단일 Render Web Service 배포에는 적합하다. 다만 신규 요구사항처럼 백엔드와 프론트엔드를 Render Web Service와 Static Site로 분리할 경우, workflow와 환경 변수 문서를 함께 수정해야 한다.

## 6. 로컬 검증 결과

| 검증 항목             | 결과                                       |
| --------------------- | ------------------------------------------ |
| `npm run build`       | 성공                                       |
| Vite production build | 성공                                       |
| 확인된 이슈           | 프론트엔드 의존성 moderate 취약점 2건 보고 |

현재 빌드 성공은 기존 CRUD 앱 기준이다. MongoDB, Firebase, Socket.io 기능은 아직 없으므로 해당 기능 검증은 진행하지 않았다.

## 7. 사용자 확인 사항 처리 결과

이전에 확인이 필요했던 항목은 사용자 답변을 기준으로 아래와 같이 처리했다.

| 항목                    | 처리 결과                                                              |
| ----------------------- | ---------------------------------------------------------------------- |
| Render 배포 구조        | Web Service 단일 배포 유지                                             |
| MongoDB Atlas 연결 방식 | 요구사항 우선으로 `MongoClient` 사용                                   |
| Firebase와 Render 역할  | Firebase는 인증, Render는 Express API/Socket.io/React 배포로 역할 분리 |
| 사용자 역할 값          | `buyer`, `dealer` 그대로 사용                                          |
| 차량 등록 권한          | 요구사항에 맞춰 딜러만 등록/수정 가능                                  |
| 차량 사진 저장          | 추천 방식인 Express `/uploads`와 `multer` 사용                         |
| 상담 화면 범위          | 상담방 목록 화면까지 포함                                              |
| 딜러 온라인 상태        | Socket.io 접속 상태 기반으로 구현하고 확장 예시 추가                   |
| UI 개편 범위            | 별도 UI 확정 방향 반영                                                 |
| 관리자 기능             | 관리자 화면과 상담 현황까지 포함                                       |

## 8. 권장 개발 방향

현재 프로젝트 상태와 CI/CD 구조를 고려하면 다음 방향을 권장한다.

| 항목         | 권장안                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| 배포 구조    | 1차 구현은 현재 단일 Render Web Service 유지                           |
| API 경로     | React 호출은 `/api/*` 유지, Express 라우트도 `/api/*` 기준으로 정리    |
| 데이터베이스 | `MongoClient`로 MongoDB Atlas 연결                                     |
| 인증         | Firebase Authentication 클라이언트 인증 + MongoDB 사용자 프로필 저장   |
| 이미지       | 1차는 `multer`와 `/uploads` 구현, README에 Render 파일 비영속성 명시   |
| 상담         | Socket.io room 기반 실시간 채팅, 메시지는 MongoDB 저장                 |
| AI Agent     | 실제 LLM 호출 없이 `handleChatMessage`, `generateAgentReply` 함수 분리 |

단일 Render Web Service를 유지하면 React는 Express가 제공하는 정적 파일로 배포되고, API와 Socket.io도 같은 origin에서 동작한다. 이 방식은 CORS와 환경 변수 설정이 단순해 과제 완성 가능성이 높다.

## 9. 단계별 구현 계획

### 9.1 1단계: 서버 구조 정리

- `server.js`의 모든 자동차 API를 `/api/cars` 기준으로 정리한다.
- 기존 메모리 배열 데이터는 MongoDB 연결 전까지 seed 또는 fallback 용도로만 둔다.
- `express.json`, 정적 파일 제공, React fallback 순서를 유지한다.
- 기존 GitHub Actions 빌드 흐름이 깨지지 않도록 `npm run build`를 계속 검증한다.

### 9.2 2단계: MongoDB Atlas 연동

- 루트 의존성에 `mongodb`, `dotenv`를 추가한다.
- MongoDB 연결 파일을 분리한다.
- `.env.example`에 `MONGODB_URI`, `DB_NAME`, 컬렉션 이름을 추가한다.
- `cars`, `users`, `chat_rooms`, `messages` 컬렉션을 기준으로 API를 작성한다.
- 차량 CRUD가 메모리 배열이 아니라 MongoDB에 저장되도록 변경한다.

### 9.3 3단계: 차량 검색 고도화

- `GET /api/cars/search` 하나로 검색 API를 통합한다.
- `keyword`, `company`, `minPrice`, `maxPrice`, `minYear`, `maxYear` 복합 검색을 지원한다.
- 기존 `/cars/filter`와 `/api/cars/filter` 가격 필터 라우트는 새 API로 대체하고 제거한다.
- 프론트엔드 검색 폼에 차량명, 제조사, 가격, 연식 조건을 모두 추가한다.

### 9.4 4단계: 차량 등록과 사진 업로드

- 루트 의존성에 `multer`를 추가한다.
- Express에서 `/uploads`를 정적 파일로 제공한다.
- 차량 등록 API를 `multipart/form-data`로 전환한다.
- 프론트엔드 등록 폼에 차종, 연료, 주행거리, 지역, 설명, 차량 사진 필드를 추가한다.
- 목록과 상세 화면에서 `imageUrl`을 출력한다.

### 9.5 5단계: Firebase 인증

- 프론트엔드 의존성에 `firebase`를 추가한다.
- Firebase 설정 파일과 인증 상태 관리 구조를 만든다.
- 로그인, 회원 가입, 로그아웃 화면을 추가한다.
- 회원 가입 시 사용자 유형을 선택하고 MongoDB `users` 컬렉션에 추가 프로필을 저장한다.
- 딜러만 차량 등록 화면에 접근할 수 있도록 권한 체크를 적용한다.

### 9.6 6단계: 차량 상세와 상담 진입

- React Router를 도입해 `/cars/:id` 상세 URL을 지원한다.
- 새로고침해도 상세 조회가 가능하도록 `GET /api/cars/:id`를 호출한다.
- 상세 화면에 딜러 정보와 `딜러와 상담하기` 버튼을 배치한다.
- 상담방 생성 API `POST /api/chats/rooms`를 구현한다.

### 9.7 7단계: Socket.io 실시간 상담

- 루트 의존성에 `socket.io`를 추가한다.
- 프론트엔드 의존성에 `socket.io-client`를 추가한다.
- Express 서버를 HTTP server로 감싸 Socket.io를 같은 포트에서 실행한다.
- `join-room`, `send-message`, `receive-message`, `leave-room` 이벤트를 구현한다.
- 메시지를 MongoDB `messages` 컬렉션에 저장한다.
- 상담 화면에서 이전 메시지 조회와 실시간 수신을 모두 지원한다.

### 9.8 8단계: AI Agent 확장 구조 정리

- Socket.io 메시지 처리 로직을 `handleChatMessage` 함수로 분리한다.
- 차량 정보, 상담방 정보, 이전 메시지를 함께 조회할 수 있는 구조를 만든다.
- 실제 AI 호출 없이 `generateAgentReply` placeholder 함수를 둔다.
- 딜러 오프라인 시 AI Agent 자동 응답으로 확장 가능한 주석과 문서를 남긴다.

### 9.9 9단계: Render 및 GitHub Actions 문서 업데이트

- `.env.example`에 MongoDB, Firebase, Socket.io 관련 환경 변수를 추가한다.
- `docs/deploy-guide.md`와 `docs/deploy-checklist.md`를 신규 기능 기준으로 업데이트한다.
- GitHub Actions에서 빌드 실패 가능성이 있는 의존성 설치 순서를 재검토한다.
- 배포 후 확인 항목에 로그인, 검색, 사진, 상담 기능을 추가한다.

### 9.10 10단계: README 제출용 정리

- 프로젝트 소개를 실시간 Car Market 서비스 기준으로 수정한다.
- 주요 기능, 실행 방법, 환경 변수, MongoDB Atlas 설정, Firebase 설정, Socket.io 이벤트 목록을 작성한다.
- Render 배포 주소와 AI Agent 확장 아이디어 항목을 추가한다.

## 10. 개발 우선순위

| 우선순위 | 작업                               | 이유                                      |
| -------- | ---------------------------------- | ----------------------------------------- |
| 1        | MongoDB Atlas 연동                 | 차량, 사용자, 상담 데이터 저장의 기반     |
| 2        | 차량 검색 및 상세 데이터 구조 확장 | 기존 CRUD를 마켓 서비스 요구사항으로 전환 |
| 3        | 사진 업로드                        | 차량 목록과 상세 화면의 핵심 요구사항     |
| 4        | Firebase 인증과 역할 관리          | 차량 등록 권한과 상담 사용자 식별에 필요  |
| 5        | Socket.io 상담                     | 실시간 서비스 핵심 기능                   |
| 6        | AI Agent 확장 구조                 | 최종 요구사항 정리 및 향후 확장 대비      |
| 7        | 배포 문서와 README 정리            | 제출물 완성                               |

## 11. 확정 개발 방향

사용자 답변을 바탕으로 다음 방향을 확정한다.

| 항목              | 확정 방향                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render 배포 구조  | 현재처럼 Render Web Service 단일 배포를 유지한다.                                                                                                                                           |
| 요구사항 우선순위 | 레거시가 아니면 요구사항의 기술을 우선 사용한다. 최신 방식이 더 적합하면 사유를 문서에 남기고 변경할 수 있다.                                                                               |
| MongoDB 연결 방식 | 요구사항에 맞춰 `MongoClient`를 우선 사용한다.                                                                                                                                              |
| 사용자 역할       | `buyer`, `dealer` 값을 그대로 사용한다.                                                                                                                                                     |
| 차량 등록 권한    | 요구사항에 맞춰 딜러만 차량 등록, 수정이 가능하도록 구현한다.                                                                                                                               |
| 차량 사진 저장    | 1차 구현은 추천 방식인 Express `/uploads`와 `multer`를 사용한다. Render 파일 비영속성은 README와 배포 문서에 명시한다.                                                                      |
| 상담 화면         | 상담방 목록 화면까지 포함한다.                                                                                                                                                              |
| 딜러 온라인 상태  | Socket.io 접속 상태를 기반으로 구현하되, 향후 확장 가능한 온라인 상태 저장 예시를 문서와 코드 구조에 남긴다.                                                                                |
| UI 개편           | 차량 목록 중심 첫 화면, 사용자 카드형 목록, 딜러/관리자 테이블형 관리 화면, 다크 모드 미포함, 기본 placeholder 이미지 사용, 사이드바 우선 관리자 UX, daisyUI 패키지 제거 방향으로 진행한다. |
| 관리자 기능       | 관리자 화면과 상담 현황까지 포함한다.                                                                                                                                                       |

## 12. Firebase와 Render 역할 정리

Firebase 프로젝트를 사용하더라도 Render를 유지하는 이유는 두 서비스의 역할이 다르기 때문이다.

| 서비스                  | 이 프로젝트에서의 역할                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Firebase Authentication | 이메일/비밀번호 회원 가입, 로그인, 로그인 상태 유지, 사용자 UID 발급                             |
| Render Web Service      | Express API 서버 실행, MongoDB Atlas 연동, Socket.io 실시간 상담 서버 실행, React 빌드 결과 제공 |
| MongoDB Atlas           | 차량, 사용자 프로필, 상담방, 메시지 데이터 저장                                                  |

Firebase Authentication은 인증 서비스이므로 사용자의 신원을 확인하고 UID를 발급한다. 하지만 현재 요구사항에는 Express REST API, MongoDB Atlas, `multer` 사진 업로드, Socket.io 서버가 포함되어 있으므로 Node.js 서버를 실행할 배포 환경이 필요하다. Render Web Service는 Express 서버와 Socket.io를 같은 포트에서 실행할 수 있어 현재 구조와 요구사항에 맞다.

Firebase Hosting이나 Firebase Functions로도 일부 대체는 가능하다. 그러나 이번 프로젝트 요구사항의 배포 항목이 Render이고, 이미 GitHub Actions에서 Render Deploy Hook을 호출하는 CI/CD가 구성되어 있으므로 1차 구현은 Render Web Service 단일 배포를 유지한다.

## 13. 관리자 및 상담 현황 확장 계획

관리자 기능은 필수 범위 밖으로 언급되어 있었지만, 사용자 요청에 따라 다음 범위까지 포함한다.

| 화면            | 주요 기능                                                             |
| --------------- | --------------------------------------------------------------------- |
| 관리자 대시보드 | 전체 차량 수, 사용자 수, 상담방 수, 최근 메시지 요약                  |
| 차량 관리       | 전체 차량 목록 조회, 삭제 또는 상태 확인                              |
| 사용자 관리     | 사용자 역할 확인, 딜러/일반 사용자 구분                               |
| 상담 현황       | 상담방 목록, 차량명, 구매자, 딜러, 마지막 메시지, 최근 상담 시간 표시 |

1차 구현에서는 관리자 권한 판별을 사용자 프로필의 `role` 값으로 처리한다. 필요하면 `admin` 역할을 추가할 수 있도록 사용자 데이터 구조를 확장 가능하게 둔다.

## 14. UI 확정 방향

UI 개선은 별도 구현 단계에서 진행하되, 다음 방향은 확정한다.

| 항목               | 확정 방향                                                                     |
| ------------------ | ----------------------------------------------------------------------------- |
| 첫 화면            | 차량 목록과 검색 중심                                                         |
| 일반 사용자 목록   | 이미지 중심 카드형 UI                                                         |
| 딜러/관리자 화면   | 테이블형 관리 UI                                                              |
| 다크 모드          | 1차 구현 미포함                                                               |
| 이미지 없음 처리   | 기본 placeholder 이미지 사용                                                  |
| placeholder 이미지 | 필요 시 사용자가 이미지 생성 프롬프트를 제공하고 이미지 전용 생성 도구로 생성 |
| 관리자 내비게이션  | 사이드바 우선, UX 개선 효과가 있으면 상단 탭 병행                             |
| daisyUI            | class 제거 후 패키지도 제거                                                   |

daisyUI 제거는 UI 대체가 끝난 뒤 진행한다. `frontend/tailwind.config.js`의 plugin 설정, `frontend/package.json`의 `daisyui` 의존성, `frontend/package-lock.json`을 함께 정리하고 `npm run build`로 검증한다.

## 15. 딜러 온라인 상태 확장 예시

1차 구현에서는 Socket.io 접속 상태를 메모리 기반으로 관리한다.

```js
const onlineDealers = new Map();
// key: dealerId
// value: { socketId, connectedAt, lastSeenAt }
```

향후 확장 시에는 MongoDB `dealer_presence` 컬렉션 또는 Redis 같은 외부 저장소를 사용할 수 있다.

```json
{
  "dealerId": "firebase-user-uid",
  "status": "online",
  "socketId": "socket-id",
  "lastSeenAt": "2026-06-05T10:00:00.000Z",
  "updatedAt": "2026-06-05T10:00:00.000Z"
}
```

Render 인스턴스가 하나인 1차 과제 범위에서는 메모리 기반 상태로 충분하다. 여러 인스턴스나 장기 운영으로 확장할 경우 외부 저장소를 사용한다.

## 16. 다음 액션

1. 확정된 순서대로 MongoDB, 차량 검색, 사진 업로드, Firebase 인증, Socket.io 상담, 관리자/상담 현황을 구현한다.
2. UI 구현 단계에서는 확정된 UI 방향에 따라 daisyUI class와 패키지를 제거한다.
3. 매 단계마다 `npm run build`와 핵심 API 호출을 검증한다.
4. 최종적으로 README와 배포 문서를 제출 기준으로 업데이트한다.
