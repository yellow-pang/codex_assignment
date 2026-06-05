# 5단계 Firebase 인증 작업 계획

## 1. 작업 배경

`docs/실시간_Car_Market_향후_개발_계획서.md`의 5단계 항목에 따라 Firebase Authentication 기반 회원 가입, 로그인, 로그아웃, 인증 상태 유지, 사용자 역할 관리를 구현한다.

현재 프로젝트는 MongoDB Atlas `cars` 컬렉션 기반 차량 CRUD, 복합 검색, 차량 사진 업로드까지 구현되어 있다. 하지만 아직 로그인한 사용자 식별과 사용자 역할 구분이 없어, 요구사항의 "딜러만 차량 등록/수정 가능" 조건을 적용하지 못한다.

| 현재 기능 | 현재 상태 | 한계 |
| --- | --- | --- |
| Firebase Authentication | `firebase` 패키지와 설정 파일 없음 | 회원가입/로그인 불가 |
| 인증 상태 관리 | React 전역 인증 상태 없음 | 새로고침 후 사용자 정보 유지 불가 |
| 사용자 추가 정보 | MongoDB `users` 컬렉션은 준비됨 | 저장/조회 API 없음 |
| 차량 등록 권한 | 누구나 등록/수정 화면 접근 가능 | 딜러 권한 제한 미적용 |
| 차량 데이터 딜러 정보 | `dealerId`, `dealerName` 자동 저장 없음 | 상담 단계에서 딜러 식별 어려움 |

신규 요구사항은 Firebase Authentication이 인증을 담당하고, 추가 사용자 정보는 MongoDB `users` 컬렉션에 저장하는 것이다.

## 2. 작업 목표

- 프론트엔드 의존성에 `firebase`를 추가한다.
- Firebase 설정 파일을 만들고 Vite 환경변수로 Firebase Web config를 읽는다.
- 로그인, 회원가입, 로그아웃 UI를 추가한다.
- Firebase 인증 상태를 React 전역에서 사용할 수 있게 구성한다.
- 회원가입 시 사용자 유형 `buyer` 또는 `dealer`를 선택한다.
- 회원가입 성공 후 MongoDB `users` 컬렉션에 사용자 추가 프로필을 저장한다.
- 로그인한 사용자의 MongoDB 프로필을 조회해 화면과 권한 체크에 사용한다.
- 딜러만 차량 등록과 수정 화면에 접근할 수 있도록 프론트엔드와 서버에서 방어한다.
- 차량 등록 시 `dealerId`, `dealerName`을 함께 저장한다.

## 3. 백엔드 구현 계획

### 3.1 사용자 API 추가

`server.js`에 `/api/users` 라우터를 추가한다.

예상 API:

| 기능 | Method | URL | 설명 |
| --- | --- | --- | --- |
| 사용자 정보 저장 | `POST` | `/api/users` | 회원가입 후 Firebase UID와 추가 프로필 저장 |
| 내 정보 조회 | `GET` | `/api/users/me?uid=...` | 로그인한 사용자의 MongoDB 프로필 조회 |
| 딜러 목록 조회 | `GET` | `/api/users/dealers` | 이후 상담 기능에서 사용할 딜러 목록 조회 |

이번 단계에서는 Firebase Admin SDK로 ID 토큰 검증까지 도입하지 않고, 클라이언트가 전달한 Firebase `uid`를 기준으로 MongoDB 사용자 프로필을 조회한다. 서버 Secret과 Firebase Admin 설정은 별도 승인 대상이므로 1차 구현 범위에 포함하지 않는다.

### 3.2 사용자 저장 데이터 구조

MongoDB `users` 컬렉션에는 요구사항 예시를 기준으로 아래 값을 저장한다.

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

처리 기준:

| 필드 | 처리 방향 |
| --- | --- |
| `uid` | Firebase Authentication UID, 고유값으로 사용 |
| `email` | Firebase 이메일 값 저장 |
| `displayName` | 회원가입 폼의 사용자 이름 저장 |
| `role` | `buyer`, `dealer`만 허용 |
| `createdAt` | 최초 생성 시간 |
| `updatedAt` | 생성 또는 갱신 시간 |

`POST /api/users`는 `uid` 기준으로 중복 사용자가 있으면 새로 만들지 않고 필요한 값을 갱신하는 upsert 방식으로 처리한다.

### 3.3 기본 입력 검증

서버는 사용자 입력을 최소한으로 검증한다.

| 항목 | 검증 기준 |
| --- | --- |
| `uid` | 빈 값 불가 |
| `email` | 빈 값 불가 |
| `displayName` | 빈 값 불가 |
| `role` | `buyer`, `dealer` 중 하나 |

오류 응답에는 내부 스택 트레이스나 환경변수 값을 노출하지 않는다.

### 3.4 차량 등록/수정 권한 방어

현재는 인증 토큰 검증 서버 미들웨어가 없으므로, 이번 단계에서는 다음 방식으로 방어한다.

1. 프론트엔드에서 로그인한 사용자 프로필의 `role`이 `dealer`일 때만 등록/수정 UI를 보여준다.
2. `POST /api/cars`, `PUT /api/cars/:id` 요청에 `dealerId`, `dealerName`, `dealerRole` 값을 함께 전송한다.
3. 서버는 `dealerId`로 `users` 컬렉션을 조회하고, 실제 저장된 role이 `dealer`인지 확인한다.
4. 딜러가 아니면 `403` 응답을 반환한다.

이 방식은 클라이언트 값만 믿지 않고 MongoDB 사용자 프로필을 한 번 더 확인한다. 다만 Firebase ID 토큰 검증이 없으므로 운영 수준의 완전한 인증 방어는 아니며, 이후 Firebase Admin SDK 도입 시 강화할 수 있도록 문서에 남긴다.

### 3.5 차량 데이터 딜러 정보 저장

차량 등록 시 아래 값을 함께 저장한다.

| 필드 | 설명 |
| --- | --- |
| `dealerId` | Firebase UID |
| `dealerName` | MongoDB 사용자 프로필의 `displayName` |

차량 수정과 삭제는 1차 구현에서 차량을 등록한 딜러 본인만 허용한다. 관리자 계정과 전체 관리 권한은 이후 별도 단계에서 추가한다.

## 4. 프론트엔드 구현 계획

### 4.1 Firebase 의존성 추가

`frontend` 의존성에 `firebase`를 추가한다.

예상 명령:

```bash
npm.cmd --prefix frontend install firebase
```

네트워크 설치가 필요하므로 실제 구현 시 샌드박스에서 실패하면 사용자 승인 요청 후 진행한다.

### 4.2 Firebase 설정 파일 추가

예상 파일:

```text
frontend/src/firebase.js
```

Vite 환경변수로 Firebase Web config를 읽어 앱을 초기화한다.

예상 환경변수:

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

Firebase Web config는 일반적으로 클라이언트에 포함될 수 있는 공개 식별 정보이지만, 실제 값은 `.env`에 두고 `.env.example`에는 예시 이름만 작성한다.

### 4.3 인증 상태 관리 구조 추가

예상 파일:

```text
frontend/src/contexts/AuthContext.jsx
```

구성 방향:

- `onAuthStateChanged`로 Firebase 로그인 상태를 감지한다.
- Firebase user가 있으면 `/api/users/me?uid=...`를 호출해 MongoDB 사용자 프로필을 함께 가져온다.
- `currentUser`, `userProfile`, `isAuthLoading`, `isDealer`, `login`, `register`, `logout` 값을 전역에서 제공한다.
- 새로고침 후에도 Firebase가 인증 상태를 복원하면 MongoDB 프로필도 다시 조회한다.

### 4.4 로그인/회원가입 화면 추가

예상 파일:

```text
frontend/src/components/LoginForm.jsx
frontend/src/components/RegisterForm.jsx
```

로그인 입력값:

| 항목 | 설명 |
| --- | --- |
| 이메일 | Firebase 로그인 ID |
| 비밀번호 | Firebase 비밀번호 |

회원가입 입력값:

| 항목 | 설명 |
| --- | --- |
| 이메일 | Firebase 로그인 ID |
| 비밀번호 | Firebase 비밀번호 |
| 사용자 이름 | MongoDB `displayName` |
| 사용자 유형 | `buyer`, `dealer` |

UI는 현재 코드의 daisyUI 기반 흐름을 크게 바꾸지 않고 추가한다. 순수 Tailwind UI 개편과 daisyUI 제거는 별도 UI 단계에서 진행한다.

회원가입 처리 중 Firebase 계정 생성은 성공했지만 MongoDB 사용자 프로필 저장이 실패하면, 클라이언트에서 방금 생성된 현재 Firebase 사용자에 대해 `deleteUser`를 호출해 계정 삭제 보정을 시도한다. 이 보정은 Firebase Admin SDK 없이 가능한 현재 사용자 삭제 범위에서 처리하며, 삭제 보정까지 실패하면 사용자에게 Firebase 콘솔에서 계정 상태를 확인해야 한다는 안내를 보여준다.

### 4.5 화면 흐름 변경

`App.jsx`에서 현재 상태 기반 화면 전환 구조를 유지하며 인증 화면을 추가한다.

예상 화면 흐름:

| 화면 | 접근 기준 |
| --- | --- |
| 차량 목록 | 비로그인 사용자도 조회 가능 |
| 차량 상세 | 로그인 사용자만 접근 가능하도록 안내 |
| 차량 등록 | 딜러만 접근 가능 |
| 차량 수정 | 딜러만 접근 가능 |
| 차량 삭제 | 기존 기능 유지, 딜러 권한 기준으로 제한 |
| 로그인/회원가입 | 비로그인 사용자 접근 |

요구사항에는 로그인한 사용자만 차량 상세 조회를 사용할 수 있다고 되어 있으나, UI 확정 방향에는 로그인 상태와 관계없이 첫 화면은 차량 검색/목록 중심으로 되어 있다. 따라서 목록은 공개하고, 상세/등록/수정/삭제는 인증 상태와 역할 기준으로 제한하는 방향을 우선 제안한다.

### 4.6 차량 등록 요청 확장

`createCarFormData`에서 로그인한 딜러 정보를 함께 전송한다.

예상 추가 필드:

```text
dealerId
dealerName
dealerRole
```

서버는 `dealerId`로 `users` 컬렉션을 조회해 실제 role을 확인한 뒤 차량을 저장한다.

## 5. 환경변수 및 문서 갱신 계획

Firebase 설정값 추가는 환경변수 이름 변경/추가에 해당하므로 사용자 확인 후 진행한다.

갱신 예정 문서:

| 문서 | 갱신 내용 |
| --- | --- |
| `.env.example` | Firebase Vite 환경변수 예시 추가 |
| `docs/progress.md` | 5단계 Firebase 인증 작업 기록 추가 |
| `docs/steps/2026-06-05-05-firebase-auth.md` | 구현 상세 설명 문서 추가 |
| `docs/pr/2026-06-05-05-firebase-auth-pr.md` | PR 작성용 요약 문서 추가 |
| `docs/deploy-guide.md` | Render 환경변수와 Firebase 설정 안내 보강 |
| `docs/deploy-checklist.md` | 로그인/회원가입 확인 항목 추가 |

README는 최종 제출 정리 단계에서 전체 기능 기준으로 갱신하되, Firebase 실행에 필요한 환경변수 안내는 이번 단계에서 함께 점검한다.

## 6. 검증 계획

가능한 범위에서 아래 검증을 진행한다.

| 검증 항목 | 명령 또는 방법 |
| --- | --- |
| 서버 문법 확인 | `node --check server.js` |
| 루트 빌드 | `npm.cmd run build` |
| 프론트엔드 빌드 | `npm.cmd --prefix frontend run build` |
| 서버 실행 | `npm.cmd start` |
| 사용자 API 확인 | 실제 `MONGODB_URI`가 있을 때 `/api/users` 저장/조회 확인 |
| 화면 확인 | Firebase 환경변수 등록 후 회원가입, 로그인, 새로고침 유지, 로그아웃 확인 |
| 권한 확인 | buyer는 등록/수정 불가, dealer는 등록 가능 확인 |

현재 로컬 환경에 실제 Firebase 설정값이나 `MONGODB_URI`가 없으면 빌드와 문법 확인까지 진행하고, 실제 회원가입/로그인 검증은 사용자가 환경변수를 등록한 뒤 진행한다.

## 7. 이번 단계에서 하지 않을 일

- Firebase 프로젝트 생성, 앱 등록, 인증 제공자 설정 변경은 사용자가 Firebase 콘솔에서 직접 진행한다.
- Firebase Admin SDK와 서버의 ID 토큰 검증은 이번 1차 구현에 포함하지 않는다.
- Render 배포 구조를 Web Service 단일 배포에서 분리 배포로 바꾸지 않는다.
- Socket.io 상담방 생성, 메시지 저장, 실시간 이벤트는 6단계 이후에서 진행한다.
- React Router 도입과 `/cars/:id` 상세 URL은 6단계에서 진행한다.
- 관리자 `admin` 역할 추가는 이번 단계에 포함하지 않는다.
- daisyUI class 제거와 전체 UI 개편은 별도 UI 단계에서 진행한다.
- 외부 AI Agent API 연동은 진행하지 않는다.

## 8. 사용자 확인 결과

아래 방향으로 사용자 확인이 완료되었다.

1. Firebase 환경변수 이름은 `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` 네 가지를 기본으로 추가한다.
2. 이번 단계에서는 Firebase Admin SDK를 추가하지 않고, 서버는 MongoDB `users` 컬렉션의 `uid`와 `role` 조회로 딜러 권한을 방어한다.
3. 차량 목록은 비로그인 사용자도 볼 수 있게 유지하고, 차량 상세/등록/수정/삭제는 로그인과 역할 기준으로 제한한다.
4. 회원가입 사용자 역할은 요구사항대로 `buyer`, `dealer`만 제공하고 `admin`은 추가하지 않는다.
5. 관리자 계정은 이후 별도 단계에서 추가하므로, 이번 단계의 차량 수정/삭제 권한은 차량을 등록한 딜러 본인에게만 허용한다.
6. 회원가입 후 MongoDB 사용자 프로필 저장 API가 실패하면 클라이언트에서 방금 생성된 Firebase 계정 자동 삭제 보정을 시도한다.

위 확정 방향에 따라 코드 구현, 검증, Step 문서, PR 문서 작성을 진행한다.
