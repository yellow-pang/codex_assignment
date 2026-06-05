# 2026-06-05 5단계 Firebase 인증 상세 설명

## 이 문서의 목표

이번 단계에서는 Firebase Authentication으로 회원가입과 로그인을 구현하고, MongoDB `users` 컬렉션에 사용자 추가 프로필을 저장했다.

이 문서는 다음 내용을 처음 보는 사람이 이해할 수 있게 정리한다.

- Firebase 설정과 인증 상태를 프론트엔드에서 어떻게 관리하는지
- 회원가입 시 사용자 역할을 MongoDB에 어떻게 저장하는지
- 서버가 딜러 권한을 어떻게 확인하는지
- 차량 수정과 삭제를 등록한 딜러 본인으로 제한한 방식
- Firebase 계정 생성 후 MongoDB 저장 실패 시 어떤 보정을 하는지

## 한 줄 요약

Firebase 이메일/비밀번호 인증을 추가하고, MongoDB `users` 프로필의 `uid`와 `role`을 기준으로 딜러만 차량을 등록하며 등록한 딜러 본인만 수정/삭제할 수 있게 했다.

## 작업 전 상태

4단계까지는 MongoDB 차량 CRUD, 복합 검색, 사진 업로드가 구현되어 있었다.
하지만 로그인 사용자와 딜러 역할이 없어서 누구나 등록/수정/삭제 화면에 접근할 수 있었다.

| 기능 | 기존 상태 | 한계 |
| --- | --- | --- |
| 회원가입/로그인 | 없음 | Firebase Authentication 미연동 |
| 사용자 프로필 | `users` 컬렉션만 준비됨 | 저장/조회 API 없음 |
| 차량 등록 권한 | 누구나 접근 가능 | 딜러 제한 없음 |
| 차량 수정/삭제 권한 | 누구나 버튼 접근 가능 | 등록한 딜러 본인 제한 없음 |
| 딜러 정보 | 차량 문서에 자동 저장 안 됨 | 상담 단계에서 딜러 식별 어려움 |

## 변경한 파일 요약

| 파일 | 변경 이유 |
| --- | --- |
| `server.js` | 사용자 API와 딜러 권한 방어 추가 |
| `frontend/package.json` | `firebase` 의존성 추가 |
| `frontend/package-lock.json` | `firebase` 설치 결과 반영 |
| `frontend/vite.config.js` | Vite가 루트 `.env`의 Firebase 값을 읽도록 설정 |
| `frontend/src/firebase.js` | Firebase 앱과 Auth 초기화 |
| `frontend/src/contexts/AuthContext.jsx` | 인증 상태, 로그인, 회원가입, 로그아웃 전역 관리 |
| `frontend/src/main.jsx` | `AuthProvider`로 앱 감싸기 |
| `frontend/src/App.jsx` | 인증 화면 흐름과 차량 권한 체크 연결 |
| `frontend/src/components/LoginForm.jsx` | 로그인 폼 추가 |
| `frontend/src/components/RegisterForm.jsx` | 회원가입 폼 추가 |
| `frontend/src/components/Header.jsx` | 로그인/회원가입/로그아웃/딜러 등록 버튼 표시 |
| `frontend/src/components/CarTable.jsx` | 수정/삭제 버튼을 관리 가능한 차량에만 표시 |
| `frontend/src/components/CarDetail.jsx` | 상세 화면 수정/삭제 버튼 권한 제한 |
| `.env.example` | Firebase Vite 환경변수 예시 추가 |
| `README.md` | Firebase 환경변수와 인증/권한 안내 추가 |
| `docs/deploy-guide.md` | Render Firebase 환경변수와 인증 설정 안내 추가 |
| `docs/deploy-checklist.md` | Firebase 배포 후 확인 항목 추가 |
| `docs/실시간_Car_Market_향후_개발_계획서.md` | 5단계 구현 상태 보정 |

## 서버 변경 내용

### 1. 사용자 API 추가

`server.js`에 `/api/users` 라우터를 추가했다.

| 기능 | Method | URL |
| --- | --- | --- |
| 사용자 정보 저장 | `POST` | `/api/users` |
| 내 정보 조회 | `GET` | `/api/users/me?uid=...` |
| 딜러 목록 조회 | `GET` | `/api/users/dealers` |

`POST /api/users`는 Firebase UID 기준으로 사용자 프로필을 upsert한다.
이미 같은 UID가 있으면 이메일, 표시 이름, 역할, 수정 시간을 갱신한다.

### 2. 사용자 데이터 구조

MongoDB `users` 컬렉션에는 아래 구조로 저장한다.

```json
{
  "uid": "firebase-user-uid",
  "email": "user@test.com",
  "displayName": "홍길동",
  "role": "buyer",
  "createdAt": "2026-06-05T00:00:00.000Z",
  "updatedAt": "2026-06-05T00:00:00.000Z"
}
```

역할은 `buyer`, `dealer`만 허용한다.
`admin`은 이후 별도 단계에서 추가한다.

### 3. 딜러 권한 방어

차량 등록, 수정, 삭제 요청은 서버에서 MongoDB `users` 컬렉션을 조회해 실제 딜러인지 확인한다.

처리 기준:

- `POST /api/cars`: `dealerId`로 딜러 프로필을 조회하고, 딜러일 때만 등록한다.
- `PUT /api/cars/:id`: 딜러인지 확인한 뒤 기존 차량의 `dealerId`와 요청 딜러 UID가 같은지 확인한다.
- `DELETE /api/cars/:id`: 등록한 딜러 본인일 때만 삭제한다.

클라이언트가 보낸 `dealerName`, `dealerRole` 값은 차량 저장 데이터로 그대로 신뢰하지 않는다.
서버가 MongoDB 사용자 프로필에서 딜러 이름과 역할을 다시 확인한다.

## 프론트엔드 변경 내용

### 1. Firebase 초기화

`frontend/src/firebase.js`에서 Vite 환경변수로 Firebase Web config를 읽는다.

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

실제 값은 `.env` 또는 Render Environment에 등록한다.
로컬 개발에서도 프론트엔드가 루트 `.env` 값을 읽을 수 있도록 `frontend/vite.config.js`에 `envDir: "../"`를 설정했다.

### 2. 인증 상태 관리

`AuthContext.jsx`는 다음 값을 전역으로 제공한다.

```text
currentUser
userProfile
isAuthLoading
isDealer
login
register
logout
authError
```

Firebase의 `onAuthStateChanged`로 로그인 상태를 감지하고, Firebase user가 있으면 `/api/users/me?uid=...`로 MongoDB 프로필을 조회한다.
이 구조 때문에 새로고침 후에도 Firebase 인증 상태가 복원되면 사용자 프로필도 다시 로드된다.

### 3. 회원가입 보정

회원가입 흐름은 다음 순서다.

1. Firebase 계정을 생성한다.
2. Firebase displayName을 갱신한다.
3. MongoDB `users` 컬렉션에 추가 프로필을 저장한다.
4. 프로필 저장이 실패하면 방금 생성한 Firebase 계정에 대해 `deleteUser`를 호출한다.

Firebase 계정 삭제 보정까지 실패하면 사용자가 Firebase 콘솔에서 계정 상태를 확인해야 한다는 메시지를 표시한다.

### 4. 화면 접근 기준

| 화면 또는 기능 | 접근 기준 |
| --- | --- |
| 차량 목록 | 비로그인 사용자도 가능 |
| 차량 상세 | 로그인 사용자만 가능 |
| 차량 등록 | 딜러만 가능 |
| 차량 수정 | 차량을 등록한 딜러 본인만 가능 |
| 차량 삭제 | 차량을 등록한 딜러 본인만 가능 |
| 로그인/회원가입 | 비로그인 사용자 진입 가능 |

## 이번 단계에서 하지 않은 것

- Firebase Admin SDK와 서버 ID 토큰 검증은 추가하지 않았다.
- Firebase 프로젝트 생성과 이메일/비밀번호 제공자 활성화는 사용자가 Firebase 콘솔에서 직접 진행한다.
- 관리자 `admin` 역할은 추가하지 않았다.
- React Router와 `/cars/:id` 상세 URL은 6단계에서 진행한다.
- Socket.io 상담 기능은 7단계에서 진행한다.
- daisyUI 제거와 전체 UI 개편은 진행하지 않았다.

## 검증 방법

문법과 빌드를 확인한다.

```bash
node --check server.js
npm.cmd --prefix frontend run build
```

현재 확인 결과:

- `cmd.exe /c node --check server.js`: 성공
- `cmd.exe /c npm.cmd --prefix frontend run build`: 성공
- `npm.cmd run build`: 사용자가 직접 실행 예정
- `npm.cmd start`: 사용자가 직접 실행 예정

실제 Firebase와 MongoDB 환경변수를 등록한 뒤 아래 흐름을 확인한다.

```text
1. buyer 회원가입
2. buyer 로그인과 새로고침 유지
3. buyer 차량 등록 차단 확인
4. dealer 회원가입
5. dealer 차량 등록 확인
6. 등록한 dealer 본인 차량 수정/삭제 확인
7. 다른 dealer 또는 buyer가 해당 차량 수정/삭제 불가 확인
8. 로그아웃 확인
```

## Firebase Console에서 사용자가 해야 할 일

Firebase 프로젝트 설정과 인증 제공자 활성화는 코드에서 대신 처리하지 않는다.
사용자가 Firebase Console에서 아래 항목을 직접 확인한다.

| 항목 | 처리 내용 |
| --- | --- |
| 프로젝트 확인 | 사용할 Firebase 프로젝트가 맞는지 확인한다. |
| 웹 앱 등록 | 프로젝트 설정에서 웹 앱이 등록되어 있는지 확인한다. |
| Web config 확인 | `apiKey`, `authDomain`, `projectId`, `appId` 값을 확인해 `.env`의 `VITE_FIREBASE_*` 값과 맞춘다. |
| Authentication 이동 | Firebase Console의 `Authentication` 메뉴로 이동한다. |
| 이메일/비밀번호 활성화 | `Sign-in method`에서 `Email/Password` 제공자를 활성화한다. |
| Authorized domains 확인 | 로컬 개발용 `localhost`와 배포 도메인이 허용 도메인에 있는지 확인한다. |
| 테스트 사용자 확인 | 회원가입 테스트 후 Authentication 사용자 목록에 계정이 생성되는지 확인한다. |
| 실패 계정 확인 | MongoDB 저장 실패 등으로 자동 삭제 보정이 실패한 계정이 남아 있으면 직접 삭제한다. |

Firebase Web config 값은 클라이언트에서 쓰는 공개 식별 정보다.
하지만 실제 값은 `.env`, Render Environment에만 등록하고 저장소 문서에는 예시값만 둔다.

### Authorized domains 확인 위치

Firebase Console에서 허용 도메인은 아래 경로에서 확인한다.

```text
Firebase Console
→ 프로젝트 선택
→ Authentication
→ Settings
→ Authorized domains
```

로컬 개발을 위해 `localhost`가 있어야 한다.
Firebase Hosting을 사용하지 않더라도 Firebase 프로젝트 생성 시 기본 도메인들이 함께 들어 있을 수 있다.

예시:

```text
localhost
프로젝트ID.firebaseapp.com
프로젝트ID.web.app
```

Render에 배포한 뒤에는 Render 도메인도 추가한다.
입력할 때는 `https://`를 빼고 도메인만 입력한다.

예시:

```text
your-service-name.onrender.com
```

## Render에서 처리해야 할 일

Render Web Service 단일 배포 구조를 유지한다.
Render에서는 코드 변경보다 환경변수 등록과 배포 후 확인이 핵심이다.

### 1. Environment Variables 등록

Render 서비스의 `Environment` 또는 `Settings`에서 아래 값을 등록한다.

```text
NODE_ENV=production
MONGODB_URI=MongoDB Atlas 접속 문자열
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
DB_NAME=car_market
COLLECTION_CARS=cars
COLLECTION_USERS=users
COLLECTION_CHAT_ROOMS=chat_rooms
COLLECTION_MESSAGES=messages
CLIENT_URL=https://Render 배포 주소
VITE_FIREBASE_API_KEY=Firebase Web API key
VITE_FIREBASE_AUTH_DOMAIN=Firebase auth domain
VITE_FIREBASE_PROJECT_ID=Firebase project id
VITE_FIREBASE_APP_ID=Firebase app id
```

`PORT`는 Render가 자동으로 제공하므로 직접 등록하지 않아도 된다.
`MONGODB_URI`에는 실제 비밀번호가 들어가므로 GitHub, README, 문서에 작성하지 않는다.

### 2. Build와 Start 설정 확인

Render Web Service 설정은 아래 기준을 유지한다.

| 항목 | 값 |
| --- | --- |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Root Directory | 비워둠 또는 루트 |
| Auto-Deploy | GitHub Actions Deploy Hook을 쓸 경우 Off 권장 |

`npm run build`는 `frontend` 빌드를 함께 실행한다.
이번 단계에서 `frontend/vite.config.js`에 `envDir: "../"`를 설정했으므로, Vite 빌드가 루트 환경변수의 `VITE_FIREBASE_*` 값을 읽을 수 있다.

### 3. MongoDB Atlas 접근 허용

Render에서 MongoDB Atlas에 접속하려면 Atlas 쪽 Network Access도 확인해야 한다.

| 항목 | 처리 내용 |
| --- | --- |
| Database User | `MONGODB_URI`에 사용하는 DB 사용자가 존재하는지 확인한다. |
| Password | 비밀번호가 접속 문자열과 일치하는지 확인한다. |
| Network Access | 과제용이면 `0.0.0.0/0` 허용을 사용할 수 있으나, 운영에서는 제한된 IP 허용을 검토한다. |
| Database | `car_market` DB에 `cars`, `users` 컬렉션이 생성되는지 확인한다. |

### 4. 배포 후 확인

Render 배포 후 아래 흐름을 확인한다.

```text
1. Render URL 접속
2. 차량 목록 조회
3. buyer 회원가입
4. buyer 로그인과 새로고침 유지
5. buyer 차량 등록 차단 확인
6. dealer 회원가입
7. dealer 차량 등록 확인
8. dealer 본인 차량 수정/삭제 확인
9. 다른 사용자로 같은 차량 수정/삭제 차단 확인
10. MongoDB users 컬렉션에 사용자 프로필 저장 확인
```

Render 무료 환경에서는 `uploads/`에 저장한 차량 사진이 재배포나 인스턴스 재시작 후 사라질 수 있다.
이 제한은 사진 업로드 단계와 동일하며, 운영 확장 시 외부 이미지 스토리지를 검토한다.

## 남은 리스크

- Firebase Admin SDK를 사용하지 않으므로 운영 수준의 ID 토큰 검증은 아직 없다.
- 실제 Firebase Web config가 없으면 회원가입/로그인 실동작은 확인할 수 없다.
- 실제 `MONGODB_URI`가 없으면 사용자 프로필 저장과 권한 API 실동작은 확인할 수 없다.

## 다음 단계

1. 실제 Firebase와 MongoDB 환경변수로 회원가입/로그인/권한 흐름을 확인한다.
2. 6단계에서 React Router를 도입해 `/cars/:id` 상세 URL과 상담 진입 API를 구현한다.
3. 이후 Socket.io 상담에서 차량의 `dealerId`, `dealerName`을 상담방 생성에 사용한다.
