# 15단계 핵심 보안 강화

## 1. 작업 목적

이번 단계의 목적은 “브라우저가 말한 사용자 UID를 서버가 그대로 믿는 구조”를 “Firebase가 확인해 준 로그인 토큰을 서버가 직접 검증하는 구조”로 바꾸는 것이다.

비전공자 기준으로 풀어 말하면 다음과 같다.

- 기존 방식: 사용자가 “저는 A입니다”라고 적어 보내면 서버가 그 말을 믿는 구조
- 변경 방식: 사용자가 Firebase 로그인 후 받은 출입증을 보내고, 서버가 Firebase에 “이 출입증이 진짜인가요?”라고 확인하는 구조

이렇게 바꾸면 사용자가 개발자 도구나 API 도구로 `uid`, `dealerId`, `buyerId` 값을 바꿔 보내도 서버 권한을 속이기 어렵다.

## 2. 사용자가 설정해야 하는 것

### 2.1 Firebase Admin 서비스 계정이란?

Firebase Web config는 프론트엔드에서 Firebase 로그인 화면을 쓰기 위한 공개 설정이다.
반면 Firebase Admin 서비스 계정은 서버가 Firebase에 관리자 권한으로 질문할 때 쓰는 비밀 열쇠다.

이번 작업에서 서버는 이 비밀 열쇠를 사용해 브라우저가 보낸 Firebase ID Token이 진짜인지 검증한다.

주의:

- 이 값은 서버 전용 Secret이다.
- GitHub에 올리면 안 된다.
- React 코드에 넣으면 안 된다.
- README나 문서에 실제 값을 적으면 안 된다.

### 2.2 Firebase 콘솔에서 서비스 계정 JSON 받기

1. Firebase Console에 접속한다.
2. 현재 프로젝트를 선택한다.
3. 왼쪽 위 톱니바퀴 아이콘을 누른다.
4. `Project settings`를 연다.
5. `Service accounts` 탭을 연다.
6. `Firebase Admin SDK` 섹션을 확인한다.
7. `Generate new private key` 버튼을 누른다.
8. 확인 창에서 다시 `Generate key`를 누른다.
9. JSON 파일이 다운로드된다.

이 JSON 파일은 서버용 비밀 열쇠다.
다운로드 후 파일을 GitHub 저장소 폴더에 넣지 않는다.

### 2.3 로컬 `.env`에 등록하기

다운로드한 JSON 파일 내용을 복사해서 `.env`에 아래 이름으로 등록한다.

```text
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}
```

초보자 주의사항:

- `.env.example`에는 예시만 있다.
- 실제 값은 `.env`에만 넣는다.
- `.env`는 `.gitignore`에 들어 있으므로 커밋하지 않는다.
- JSON 전체가 하나의 값이어야 한다.
- `private_key` 안의 줄바꿈은 `\n` 형태로 남아 있어야 한다.

Firebase에서 받은 JSON 파일 내용을 아래처럼 파일 모양 그대로 여러 줄로 붙여넣으면 안 된다.

```text
FIREBASE_SERVICE_ACCOUNT_JSON={
  "type": "service_account",
  "project_id": "프로젝트ID",
  "private_key": "-----BEGIN PRIVATE KEY----- ...
}
```

`.env` 파일은 기본적으로 `KEY=VALUE` 한 줄을 하나의 설정값으로 읽는다.
그래서 JSON을 여러 줄로 붙여넣으면 서버가 전체 JSON을 읽지 못하고, `Firebase Admin 서비스 계정 JSON 형식이 올바르지 않습니다.` 오류가 날 수 있다.

가장 안전한 방법은 Firebase에서 받은 JSON 파일을 한 줄 JSON으로 바꾼 뒤 붙여넣는 것이다.
PowerShell에서는 아래 명령을 사용할 수 있다.

```powershell
$json = Get-Content -Raw -LiteralPath "C:\경로\firebase-service-account.json" | ConvertFrom-Json | ConvertTo-Json -Compress
"FIREBASE_SERVICE_ACCOUNT_JSON=$json" | Set-Clipboard
```

사용 방법:

1. `"C:\경로\firebase-service-account.json"` 부분을 실제 다운로드한 JSON 파일 경로로 바꾼다.
2. PowerShell에서 명령을 실행한다.
3. 클립보드에 `.env`에 붙여넣을 한 줄 값이 복사된다.
4. `.env` 파일에 붙여넣는다.
5. 서버를 재시작한다.

이 방식은 Secret 값을 터미널 화면에 직접 출력하지 않아서 비교적 안전하다.
붙여넣은 결과는 아래처럼 보여야 한다.

```text
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"프로젝트ID","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@프로젝트ID.iam.gserviceaccount.com"}
```

### 2.4 Render Environment에 등록하기

Render 배포 환경에서도 같은 값을 등록해야 한다.

1. Render Dashboard에 접속한다.
2. 현재 Web Service를 연다.
3. `Environment` 메뉴를 연다.
4. `Add Environment Variable`을 누른다.
5. Key에 아래 이름을 입력한다.

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

6. Value에는 Firebase에서 받은 서비스 계정 JSON 전체를 넣는다.
7. 저장한다.
8. Render 서비스를 재배포한다.

Render에 등록한 뒤에는 보호 API가 Firebase ID Token을 검증할 수 있다.
이 값이 없으면 로그인은 프론트에서 된 것처럼 보일 수 있지만, 서버 보호 API는 실패한다.

### 2.5 설정 후 확인할 흐름

설정이 끝나면 아래 순서로 확인한다.

1. 회원가입 또는 로그인한다.
2. 새로고침 후에도 내 정보가 유지되는지 확인한다.
3. buyer 계정으로 차량 등록을 시도하면 차단되는지 확인한다.
4. 승인된 dealer 계정으로 차량 등록이 되는지 확인한다.
5. 딜러 본인이 등록한 차량만 수정/삭제할 수 있는지 확인한다.
6. admin 계정만 사용자 목록과 역할 변경을 할 수 있는지 확인한다.
7. 상담방 목록, 상담방 상세, 메시지 전송이 로그인 사용자 기준으로 동작하는지 확인한다.

## 3. 코드 변경 요약

| 구분           | 변경 내용                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 패키지         | 루트에 `firebase-admin` 추가                                                                             |
| 서버 설정      | `backend/config/firebaseAdmin.js` 추가                                                                   |
| 인증 미들웨어  | `backend/middleware/auth.js`에 `requireAuth`, `requireAdmin`, `requireDealer`, `requireUserProfile` 추가 |
| 에러 응답      | `backend/middleware/errors.js` 추가, `{ message }` 형식 유지                                             |
| 서버 공통 설정 | `express.json({ limit: "1mb" })` 적용, Socket.io CORS 기본값 점검                                        |
| 차량 API       | 등록/수정/삭제를 인증된 승인 딜러 기준으로 재검증                                                        |
| 사용자 API     | 내 정보, 딜러 신청, 관리자 목록, 역할 변경을 인증 사용자 기준으로 처리                                   |
| 상담 API       | 상담방 생성/조회/메시지 조회를 인증 참여자 기준으로 검증                                                 |
| Socket.io      | 연결 시 Firebase ID Token 검증, 메시지 전송자는 인증 사용자 기준으로 저장                                |
| 프론트엔드     | `frontend/src/api/authenticatedFetch.js` 추가, 보호 API에 `Authorization: Bearer` 헤더 전달              |
| 문서           | `.env.example`, README, 배포 가이드, 체크리스트에 Admin SDK 설정 안내 추가                               |

## 4. 보안 기준 변경

더 이상 서버 권한 판단에 사용하지 않는 클라이언트 입력값:

| 값             | 기존 문제                           | 변경 후                             |
| -------------- | ----------------------------------- | ----------------------------------- |
| `uid`          | 다른 사용자 UID로 바꿔 보낼 수 있음 | 서버가 토큰에서 UID를 읽음          |
| `requesterUid` | admin 요청자를 속일 수 있음         | 서버가 인증된 admin인지 확인        |
| `dealerId`     | 차량 등록/삭제 딜러를 속일 수 있음  | 서버가 인증된 승인 딜러인지 확인    |
| `buyerId`      | 상담방 생성 구매자를 속일 수 있음   | 서버가 인증된 사용자를 buyer로 사용 |
| `senderId`     | 메시지 보낸 사람을 속일 수 있음     | Socket.io 인증 사용자로 저장        |

화면 표시나 내 메시지 구분을 위해 프론트에서 `userProfile.uid`를 사용하는 것은 유지한다.
다만 서버 권한 판단은 이 값을 믿지 않는다.

## 5. 변경한 주요 파일

| 파일                                         | 내용                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| `backend/config/firebaseAdmin.js`            | Firebase Admin SDK 초기화와 ID Token 검증                 |
| `backend/middleware/auth.js`                 | 인증/권한 미들웨어                                        |
| `backend/middleware/errors.js`               | 공통 에러 helper와 응답 middleware                        |
| `backend/server.js`                          | JSON size limit, Socket.io CORS, 공통 에러 응답 연결      |
| `backend/routes/cars.routes.js`              | 차량 보호 API에 인증/딜러 권한 적용                       |
| `backend/routes/users.routes.js`             | 사용자 보호 API에 인증/admin 권한 적용                    |
| `backend/routes/chats.routes.js`             | 상담 API에 인증/참여자 검증 적용                          |
| `backend/services/*.js`                      | 클라이언트 UID 대신 인증 프로필 기준으로 서비스 로직 수정 |
| `backend/sockets/chat.socket.js`             | Socket.io 연결 토큰 검증                                  |
| `frontend/src/api/authenticatedFetch.js`     | Firebase ID Token을 Authorization 헤더에 붙이는 helper    |
| `frontend/src/App.jsx`                       | 차량/상담 보호 API 호출 수정                              |
| `frontend/src/contexts/AuthContext.jsx`      | 내 정보/프로필 저장/딜러 신청 호출 수정                   |
| `frontend/src/components/AdminUserPanel.jsx` | 관리자 API 호출 수정                                      |
| `frontend/src/components/ChatRoom.jsx`       | 상담 API와 Socket.io 인증 수정                            |
| `frontend/src/components/ChatRoomList.jsx`   | 상담방 목록 API 호출 수정                                 |

## 6. 검증 결과

| 명령어                                           | 결과 |
| ------------------------------------------------ | ---- |
| `node --check backend/server.js`                 | 성공 |
| `node --check backend/config/firebaseAdmin.js`   | 성공 |
| `node --check backend/middleware/auth.js`        | 성공 |
| `node --check backend/middleware/errors.js`      | 성공 |
| `node --check backend/routes/cars.routes.js`     | 성공 |
| `node --check backend/routes/users.routes.js`    | 성공 |
| `node --check backend/routes/chats.routes.js`    | 성공 |
| `node --check backend/services/cars.service.js`  | 성공 |
| `node --check backend/services/users.service.js` | 성공 |
| `node --check backend/services/chats.service.js` | 성공 |
| `node --check backend/sockets/chat.socket.js`    | 성공 |
| `node --check backend/config/upload.js`          | 성공 |
| `npm.cmd --prefix frontend run build`            | 성공 |
| `npm.cmd run build`                              | 성공 |

빌드 중 기존과 같은 Vite 경고가 표시되었다.

```text
NODE_ENV=production is not supported in the .env file.
```

이 경고는 빌드 실패가 아니며, `.env`에 `NODE_ENV=production`이 있을 때 Vite가 안내하는 메시지다.

`npm install firebase-admin` 후 루트 의존성 감사에서 moderate 취약점 8건이 보고되었다.
루트 통합 빌드 과정에서 프론트엔드 의존성 감사는 moderate 취약점 2건을 보고했다.
이번 단계에서는 강제 업데이트가 기능 파급을 만들 수 있어 `npm audit fix --force`는 실행하지 않았다.

## 7. 남은 확인

실제 Firebase Admin 서비스 계정과 MongoDB Atlas 환경이 있어야 아래 항목을 확인할 수 있다.

1. `FIREBASE_SERVICE_ACCOUNT_JSON`을 로컬 `.env`에 등록한다.
2. Render Environment에도 같은 값을 등록한다.
3. 로그인 후 `/api/users/me`가 정상 응답하는지 확인한다.
4. 인증 토큰 없이 보호 API를 호출하면 `401`이 나오는지 확인한다.
5. buyer가 차량 등록을 시도하면 `403`이 나오는지 확인한다.
6. 승인된 dealer가 본인 차량만 수정/삭제할 수 있는지 확인한다.
7. admin만 사용자 목록 조회와 역할 변경을 할 수 있는지 확인한다.
8. 상담방 참여자가 아닌 사용자는 상담방 상세와 메시지를 볼 수 없는지 확인한다.
9. Socket.io 상담 메시지가 인증 사용자 이름과 UID로 저장되는지 확인한다.

## 8. 초보자용 문제 해결 메모

### 로그인은 되는데 내 정보 조회가 실패할 때

가능한 원인:

- `FIREBASE_SERVICE_ACCOUNT_JSON`이 없다.
- JSON 형식이 깨졌다.
- Firebase 프로젝트와 프론트의 Firebase 설정이 서로 다른 프로젝트를 보고 있다.
- MongoDB `users` 컬렉션에 해당 UID의 사용자 문서가 없다.

확인 순서:

1. Render Environment 또는 `.env`에 `FIREBASE_SERVICE_ACCOUNT_JSON`이 있는지 본다.
2. Firebase Web config의 `project_id`와 서비스 계정 JSON의 `project_id`가 같은지 본다.
3. 회원가입을 다시 시도해 MongoDB `users` 문서가 생성되는지 본다.

### 보호 API가 401을 반환할 때

`401`은 “로그인 출입증이 없거나 확인할 수 없다”는 뜻이다.

확인할 것:

- 사용자가 실제로 로그인했는가?
- 프론트 요청에 `Authorization: Bearer ...` 헤더가 붙었는가?
- Firebase ID Token이 만료되지 않았는가?

### 보호 API가 403을 반환할 때

`403`은 “로그인은 됐지만 권한이 없다”는 뜻이다.

예:

- buyer가 차량 등록을 시도함
- admin이 아닌 사용자가 사용자 목록을 요청함
- 상담방 참여자가 아닌 사용자가 메시지를 조회함

이 경우에는 서버가 정상적으로 막고 있는 것이다.

### 보호 API가 500을 반환할 때

서버 설정이나 DB 연결 문제일 수 있다.

확인할 것:

- `FIREBASE_SERVICE_ACCOUNT_JSON` 형식
- `MONGODB_URI`
- Render Logs
- 로컬 `.env` 오타

## 9. 커밋 전 확인

커밋 전 사용자가 확인할 것:

1. 실제 Secret 값이 문서나 코드에 들어가지 않았는지 확인한다.
2. `.env` 파일이 커밋 대상에 없는지 확인한다.
3. `package.json`, `package-lock.json`에 `firebase-admin` 추가가 반영됐는지 확인한다.
4. Render Environment에 `FIREBASE_SERVICE_ACCOUNT_JSON`을 등록한 뒤 배포한다.
