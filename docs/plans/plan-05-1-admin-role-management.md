# 5-1단계 관리자 역할과 딜러 승인 작업 계획

## 1. 작업 배경

5단계 Firebase 인증 구현으로 회원가입, 로그인, MongoDB `users` 프로필 저장, `buyer`/`dealer` 역할 기반 차량 등록 권한이 추가되었다.

하지만 현재 구조에서는 회원가입 화면에서 사용자가 직접 `dealer`를 선택할 수 있다. 이 방식은 과제 1차 구현으로는 단순하고 빠르지만, 실제 서비스 관점에서는 아무나 딜러 권한을 얻을 수 있어 권한 관리의 의미가 약하다.

6단계 차량 상세와 상담 진입을 진행하기 전에, 관리자 `admin` 역할을 추가하고 딜러 권한을 승인제로 바꾸면 이후 차량 상담, 상담 현황, 관리자 화면을 더 자연스럽게 확장할 수 있다.

| 현재 기능 | 현재 상태 | 한계 |
| --- | --- | --- |
| 회원가입 | 사용자가 `buyer`, `dealer` 직접 선택 | 누구나 딜러 가입 가능 |
| 관리자 역할 | 없음 | 사용자/딜러 승인 관리 불가 |
| 딜러 권한 | MongoDB `users.role === "dealer"` 기준 | 승인 절차 없음 |
| 차량 등록 | 딜러만 가능 | 딜러가 신뢰된 계정인지 확인 불가 |
| 사용자 관리 API | 저장, 내 정보 조회, 딜러 목록 조회만 있음 | 역할 변경/승인 API 없음 |

이번 단계의 목표는 Firebase 인증 구조는 유지하면서, 실제 권한 정책을 MongoDB `users` 컬렉션의 `role`과 승인 상태 중심으로 정리하는 것이다.

## 2. 작업 목표

- 사용자 역할에 `admin`을 추가한다.
- 일반 회원가입은 기본적으로 `buyer`로 생성한다.
- 회원가입 화면에서 사용자가 즉시 `dealer` 권한을 얻는 흐름을 제거하거나 제한한다.
- 딜러 신청 상태를 표현할 수 있도록 사용자 프로필에 승인 관련 필드를 추가한다.
- 관리자만 사용자 역할 또는 딜러 승인 상태를 변경할 수 있도록 API를 추가한다.
- 관리자 화면에서 사용자 목록과 딜러 승인 처리를 할 수 있게 한다.
- 차량 등록, 수정, 삭제는 승인된 딜러만 가능하도록 기존 권한 체크를 보강한다.
- 최초 관리자 계정 생성 방법을 문서화한다.

## 3. 권한 정책 제안

이번 단계에서는 Firebase Admin SDK와 custom claims를 도입하지 않고, 기존 방향처럼 MongoDB `users` 컬렉션의 프로필 값으로 권한을 판단한다.

권장 역할:

| 역할 | 설명 | 주요 권한 |
| --- | --- | --- |
| `buyer` | 일반 사용자 | 차량 목록, 상세 조회, 이후 상담 요청 |
| `dealer` | 승인된 딜러 | 본인 차량 등록, 수정, 삭제 |
| `admin` | 관리자 | 사용자 목록 조회, 딜러 승인, 역할 변경, 이후 관리자 화면 접근 |

권장 승인 상태:

| 필드 | 값 | 설명 |
| --- | --- | --- |
| `dealerStatus` | `none` | 딜러 신청 없음 |
| `dealerStatus` | `pending` | 딜러 신청 후 관리자 승인 대기 |
| `dealerStatus` | `approved` | 딜러 승인 완료 |
| `dealerStatus` | `rejected` | 딜러 신청 거절 |

기본 정책:

```text
회원가입 → buyer / dealerStatus: none
딜러 신청 → buyer / dealerStatus: pending
관리자 승인 → dealer / dealerStatus: approved
관리자 거절 → buyer / dealerStatus: rejected
```

차량 등록 권한은 `role === "dealer"`와 `dealerStatus === "approved"`를 모두 만족할 때만 허용한다.

## 4. 데이터 구조 변경 계획

MongoDB `users` 컬렉션을 아래 방향으로 확장한다.

```json
{
  "uid": "firebase-user-uid",
  "email": "user@test.com",
  "displayName": "홍길동",
  "role": "buyer",
  "dealerStatus": "none",
  "dealerRequestedAt": null,
  "dealerApprovedAt": null,
  "dealerApprovedBy": null,
  "createdAt": "2026-06-05T00:00:00.000Z",
  "updatedAt": "2026-06-05T00:00:00.000Z"
}
```

추가 필드:

| 필드 | 설명 |
| --- | --- |
| `dealerStatus` | 딜러 신청/승인 상태 |
| `dealerRequestedAt` | 사용자가 딜러 신청한 시간 |
| `dealerApprovedAt` | 관리자가 승인한 시간 |
| `dealerApprovedBy` | 승인한 관리자 UID |

기존 사용자 문서에 필드가 없을 수 있으므로, 서버 조회 시 기본값을 보정한다.

## 5. 백엔드 구현 계획

### 5.1 역할 검증 확장

`server.js`의 역할 허용값을 `buyer`, `dealer`, `admin`으로 확장한다.

다만 일반 사용자가 `POST /api/users`로 직접 `admin` 또는 `dealer`를 만들 수 없도록 막는다.
회원가입 프로필 저장은 기본적으로 `buyer`만 허용한다.

### 5.2 사용자 API 추가

예상 API:

| 기능 | Method | URL | 권한 |
| --- | --- | --- | --- |
| 딜러 신청 | `POST` | `/api/users/dealer-request` | 로그인 사용자 |
| 사용자 목록 조회 | `GET` | `/api/users` | admin |
| 사용자 역할/딜러 상태 변경 | `PATCH` | `/api/users/:uid/role` | admin |

현재 서버는 Firebase ID 토큰 검증을 하지 않으므로, 요청에는 `adminUid` 또는 `requesterUid`를 포함한다.
서버는 MongoDB `users` 컬렉션에서 해당 UID의 실제 role이 `admin`인지 확인한다.

예상 요청:

```json
{
  "requesterUid": "firebase-admin-uid",
  "role": "dealer",
  "dealerStatus": "approved"
}
```

### 5.3 관리자 확인 함수 추가

서버에 `requireAdminProfile(uid)` 같은 함수를 추가한다.

처리 기준:

- UID가 없으면 `400`
- 해당 사용자가 없으면 `403`
- `role !== "admin"`이면 `403`
- admin이면 요청 처리

### 5.4 승인된 딜러 확인 보강

현재 차량 등록 권한은 MongoDB 사용자 프로필의 `role === "dealer"`를 확인한다.
이번 단계에서는 `dealerStatus === "approved"`도 함께 확인한다.

처리 기준:

```text
role === "dealer"
dealerStatus === "approved"
```

둘 중 하나라도 만족하지 않으면 `403`을 반환한다.

### 5.5 최초 관리자 계정 처리

Firebase Admin SDK 없이 Firebase 계정을 서버가 직접 생성하지는 않는다.
대신 서버 전용 환경변수에 최초 관리자 이메일을 등록하고, 해당 이메일로 회원가입한 사용자를 자동으로 `admin` 역할로 저장하는 방식으로 처리한다.

권장안:

1. Render 또는 로컬 `.env`에 `INITIAL_ADMIN_EMAILS`를 등록한다.
2. 사용자가 해당 이메일로 Firebase 회원가입을 진행한다.
3. 서버는 `/api/users` 저장 시 이메일이 `INITIAL_ADMIN_EMAILS`에 포함되어 있으면 `role: "admin"`으로 저장한다.
4. 최초 admin은 관리자 화면에서 다른 사용자의 딜러 신청을 승인한다.

예상 환경변수:

```text
INITIAL_ADMIN_EMAILS=admin@example.com
```

여러 명이 필요하면 쉼표로 구분한다.

```text
INITIAL_ADMIN_EMAILS=admin@example.com,owner@example.com
```

`INITIAL_ADMIN_EMAILS`는 서버에서만 사용하는 값이다.
`VITE_` 접두사를 붙이지 않고 클라이언트 코드에서 읽지 않는다.

대체 방법도 문서에 남긴다.
환경변수 방식을 쓰지 못하면 사용자가 MongoDB Atlas 콘솔에서 회원가입된 사용자의 `role`을 `admin`으로 직접 바꿀 수 있다.

## 6. 프론트엔드 구현 계획

### 6.1 회원가입 화면 변경

현재 회원가입 화면은 `buyer`, `dealer`를 선택할 수 있다.
이번 단계에서는 회원가입 기본 역할을 `buyer`로 고정한다.

변경 방향:

- 회원가입 화면에서 역할 선택 UI를 제거하거나 안내 문구로 대체한다.
- 가입 직후 사용자는 항상 `buyer`가 된다.
- 딜러가 되고 싶다면 로그인 후 `딜러 신청` 버튼을 사용한다.

### 6.2 딜러 신청 UI 추가

Header 또는 목록 화면 주변에 로그인한 `buyer`가 딜러 신청을 할 수 있는 버튼을 추가한다.

표시 기준:

| 사용자 상태 | 표시 |
| --- | --- |
| 비로그인 | 표시 안 함 |
| `buyer`, `dealerStatus: none` | `딜러 신청` 버튼 |
| `buyer`, `dealerStatus: pending` | `딜러 승인 대기` 안내 |
| `buyer`, `dealerStatus: rejected` | `딜러 신청 거절` 안내 또는 재신청 버튼 |
| `dealer`, `approved` | 차량 등록 버튼 |
| `admin` | 관리자 화면 진입 버튼 |

### 6.3 관리자 화면 추가

상태 기반 SPA 구조를 유지하면서 `currentView === "admin"` 화면을 추가한다.

예상 컴포넌트:

```text
frontend/src/components/AdminUserPanel.jsx
```

기능:

- 전체 사용자 목록 조회
- 이메일, 표시 이름, 현재 역할, 딜러 신청 상태 표시
- pending 사용자를 dealer로 승인
- 필요 시 role을 buyer로 되돌리기
- admin 사용자를 식별해 실수로 자기 권한을 잃는 작업은 막기

관리자 화면은 1차로 사용자/딜러 승인 기능을 실제 동작하도록 구현한다.
동시에 이후 확장을 고려해 관리자 화면 컴포넌트는 아래 초안 구조로 둔다.

| 영역 | 이번 단계 | 이후 확장 |
| --- | --- | --- |
| 요약 영역 | 전체 사용자 수, 승인 대기 수, 딜러 수 표시 | 차량 수, 상담방 수, 최근 메시지 수 추가 |
| 사용자 관리 | 사용자 목록, 딜러 승인, 역할 회수 | 검색, 페이지네이션, 사용자 상세 |
| 차량 관리 | 탭 또는 섹션 자리만 준비 | 전체 차량 관리, 숨김/삭제, 딜러별 필터 |
| 상담 현황 | 탭 또는 섹션 자리만 준비 | 상담방 목록, 마지막 메시지, 응답 상태 |

이번 단계에서 차량 관리와 상담 현황은 실제 API까지 구현하지 않고, 관리자 화면 구조가 쉽게 확장되도록 컴포넌트 경계만 잡는다.

### 6.4 인증 Context 보강

`AuthContext`가 사용자 프로필 변경 후 최신 프로필을 다시 불러올 수 있도록 `refreshUserProfile` 함수를 제공한다.

딜러 신청 또는 관리자 승인 후 화면 상태를 새로고침 없이 반영하기 위함이다.

## 7. 문서 갱신 계획

구현 승인 후 실제 코드 변경까지 진행할 때 아래 문서를 갱신한다.

| 문서 | 갱신 내용 |
| --- | --- |
| `docs/progress.md` | 5-1단계 관리자 역할과 딜러 승인 작업 기록 추가 |
| `docs/steps/2026-06-05-05-1-admin-role-management.md` | 구현 상세 설명 문서 추가 |
| `docs/pr/2026-06-05-05-1-admin-role-management-pr.md` | PR 작성용 요약 문서 추가 |
| `docs/실시간_Car_Market_향후_개발_계획서.md` | 6단계 전 admin 승인 단계 추가 및 역할 정책 보정 |
| `README.md` | 사용자 역할과 최초 관리자 설정 방법 안내 보강 |
| `docs/deploy-guide.md` | 최초 관리자 설정, `INITIAL_ADMIN_EMAILS`, Render 배포 후 확인 항목 보강 |
| `docs/deploy-checklist.md` | admin, dealer 승인 확인 항목 추가 |

사용자 확인에 따라 최초 admin 자동 지정용 서버 환경변수 `INITIAL_ADMIN_EMAILS`를 추가한다.

## 8. 검증 계획

가능한 범위에서 아래 검증을 진행한다.

| 검증 항목 | 명령 또는 방법 |
| --- | --- |
| 서버 문법 확인 | `node --check server.js` |
| 프론트엔드 빌드 | `npm.cmd --prefix frontend run build` |
| 루트 빌드 | 사용자가 직접 `npm.cmd run build` 실행 |
| 서버 실행 | 사용자가 직접 `npm.cmd start` 실행 |
| buyer 회원가입 | 신규 가입 시 `role: buyer`, `dealerStatus: none` 저장 확인 |
| 딜러 신청 | `dealerStatus: pending` 변경 확인 |
| 관리자 승인 | admin 계정으로 pending 사용자를 dealer/approved로 변경 확인 |
| 차량 등록 권한 | approved dealer만 등록 가능 확인 |
| 차량 수정/삭제 권한 | 등록한 approved dealer 본인만 가능 확인 |

사용자가 명령어 직접 실행을 원했으므로, 긴 실행이나 서버 실행은 명령어를 제공하고 사용자가 실행한다.

## 9. 이번 단계에서 하지 않을 일

- Firebase Admin SDK와 custom claims는 도입하지 않는다.
- Firebase Console에서 직접 권한을 부여하는 구조로 만들지 않는다.
- 최초 관리자 생성을 위한 공개 API나 비밀 코드 API를 만들지 않는다.
- Socket.io 상담, 상담방 생성, 상담 현황은 6단계 이후로 미룬다.
- 차량 목록 카드형 UI 개편과 daisyUI 제거는 별도 UI 단계에서 진행한다.
- 외부 관리자 인증 서비스나 결제/사업자 인증 API는 도입하지 않는다.

## 10. 사용자 확인 필요 사항

아래 방향으로 사용자 확인이 완료되었다.

1. 일반 회원가입은 항상 `buyer`로 생성하고, 회원가입 화면의 `dealer` 선택은 제거한다.
2. 딜러 권한은 `buyer` 사용자가 딜러 신청 후 admin이 승인하는 방식으로 변경한다.
3. 사용자 프로필에 `dealerStatus` 필드를 추가하고, 승인된 딜러는 `role: "dealer"`, `dealerStatus: "approved"`로 저장한다.
4. 최초 admin 계정은 서버 환경변수 `INITIAL_ADMIN_EMAILS`에 등록된 이메일이 회원가입하면 자동으로 `admin` 역할을 받는 방식으로 구현한다.
5. 환경변수 방식이 불가능한 경우를 대비해 MongoDB Atlas 콘솔에서 직접 `role: "admin"`으로 변경하는 방법도 Step 문서에 자세히 남긴다.
6. 관리자 화면은 사용자 목록/딜러 승인 기능을 실제 동작하도록 구현하고, 차량 관리/상담 현황으로 확장하기 쉬운 초안 구조를 함께 만든다.
7. admin은 전체 사용자 역할을 변경할 수 있지만, 자기 자신의 admin 권한을 실수로 제거하는 작업은 막는다.
8. 프로그램 완성도를 높이기 위해 필요한 환경변수 추가를 허용하며, 이번 단계에서는 `INITIAL_ADMIN_EMAILS`를 추가한다.

위 확정 방향에 따라 코드 구현, 검증, Step 문서, PR 문서 작성을 진행한다.
