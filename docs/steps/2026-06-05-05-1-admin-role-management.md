# 2026-06-05 5-1단계 관리자 역할과 딜러 승인 상세 설명

## 이 문서의 목표

이번 단계에서는 5단계 Firebase 인증 위에 관리자 `admin` 역할과 딜러 승인 흐름을 추가했다.

이 문서는 다음 내용을 처음 보는 사람이 이해할 수 있게 정리한다.

- 왜 회원가입 시 딜러 직접 선택을 제거했는지
- 최초 admin 계정을 어떻게 지정하는지
- 딜러 신청과 승인 상태가 MongoDB에 어떻게 저장되는지
- 서버가 승인된 딜러만 차량을 등록하도록 어떻게 방어하는지
- 관리자 화면 초안이 어떤 확장 구조를 갖는지

## 한 줄 요약

회원가입은 `buyer`로 고정하고, `buyer`가 딜러 신청을 보내면 `admin`이 승인해 `role: "dealer"`, `dealerStatus: "approved"` 상태가 된 사용자만 차량을 등록할 수 있게 했다.

## 작업 전 상태

5단계에서는 Firebase 회원가입과 로그인, MongoDB 사용자 프로필 저장, `buyer`/`dealer` 역할 기반 권한 체크가 구현되어 있었다.
하지만 사용자가 회원가입 화면에서 직접 `dealer`를 선택할 수 있어, 실제 서비스 권한 관리로는 약했다.

| 기능 | 기존 상태 | 한계 |
| --- | --- | --- |
| 회원가입 | `buyer`, `dealer` 선택 가능 | 누구나 딜러 권한 획득 가능 |
| admin 역할 | 없음 | 사용자/딜러 승인 관리 불가 |
| 딜러 상태 | 없음 | 신청/승인/거절 흐름 표현 불가 |
| 차량 등록 | `role: dealer`만 확인 | 승인된 딜러인지 구분 불가 |
| 관리자 화면 | 없음 | 사용자 역할 변경 불가 |

## 변경한 파일 요약

| 파일 | 변경 이유 |
| --- | --- |
| `server.js` | admin 역할, 딜러 신청/승인 API, 승인된 딜러 권한 방어 추가 |
| `frontend/src/contexts/AuthContext.jsx` | `isAdmin`, 승인된 `isDealer`, 프로필 새로고침, 딜러 신청 함수 추가 |
| `frontend/src/App.jsx` | 관리자 화면, 딜러 신청, admin 접근 흐름 연결 |
| `frontend/src/components/Header.jsx` | 딜러 신청, 승인 대기/거절 상태, 관리자 버튼 추가 |
| `frontend/src/components/RegisterForm.jsx` | 회원가입 역할 선택 제거, buyer 고정 안내 |
| `frontend/src/components/AdminUserPanel.jsx` | 사용자 목록과 딜러 승인 관리자 화면 추가 |
| `.env.example` | `INITIAL_ADMIN_EMAILS` 예시 추가 |
| `README.md` | admin, 딜러 승인, 최초 관리자 설정 안내 추가 |
| `docs/deploy-guide.md` | Render `INITIAL_ADMIN_EMAILS` 등록과 최초 admin 안내 추가 |
| `docs/deploy-checklist.md` | admin과 딜러 승인 확인 항목 추가 |
| `docs/실시간_Car_Market_향후_개발_계획서.md` | 5-1단계 admin 승인 단계 추가 |

## 서버 변경 내용

### 1. 역할과 딜러 상태

사용자 역할은 아래 세 가지를 사용한다.

| 역할 | 설명 |
| --- | --- |
| `buyer` | 일반 사용자 |
| `dealer` | 승인된 딜러 |
| `admin` | 관리자 |

딜러 상태는 아래 값을 사용한다.

| 상태 | 설명 |
| --- | --- |
| `none` | 딜러 신청 없음 |
| `pending` | 딜러 승인 대기 |
| `approved` | 딜러 승인 완료 |
| `rejected` | 딜러 신청 거절 |

차량 등록 권한은 아래 조건을 모두 만족해야 한다.

```text
role === "dealer"
dealerStatus === "approved"
```

### 2. 사용자 데이터 구조

MongoDB `users` 컬렉션은 아래 필드를 사용한다.

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

기존 사용자 문서에 `dealerStatus`가 없을 수 있으므로 서버는 사용자 응답 시 기본값을 보정한다.

### 3. 최초 admin 자동 지정

서버 전용 환경변수 `INITIAL_ADMIN_EMAILS`를 추가했다.

```text
INITIAL_ADMIN_EMAILS=admin@example.com
```

여러 명을 지정하려면 쉼표로 구분한다.

```text
INITIAL_ADMIN_EMAILS=admin@example.com,owner@example.com
```

해당 이메일로 회원가입하면 `/api/users` 저장 시 서버가 자동으로 `role: "admin"`을 부여한다.
이 값은 서버에서만 사용하므로 `VITE_` 접두사를 붙이지 않는다.

### 4. MongoDB Atlas에서 직접 admin 지정하는 방법

환경변수 방식이 어렵거나 이미 가입한 계정을 admin으로 바꿔야 하면 MongoDB Atlas 콘솔에서 직접 수정한다.

처리 순서:

```text
1. MongoDB Atlas 접속
2. Database 메뉴 이동
3. Browse Collections 클릭
4. car_market 데이터베이스 선택
5. users 컬렉션 선택
6. admin으로 만들 사용자의 email 또는 uid 문서 찾기
7. Edit Document 클릭
8. role 값을 "admin"으로 변경
9. dealerStatus 값은 "none"으로 설정
10. 저장
```

예시:

```json
{
  "role": "admin",
  "dealerStatus": "none"
}
```

### 5. 추가 API

| 기능 | Method | URL | 권한 |
| --- | --- | --- | --- |
| 딜러 신청 | `POST` | `/api/users/dealer-request` | 로그인 사용자 |
| 사용자 목록 조회 | `GET` | `/api/users?requesterUid=...` | admin |
| 사용자 역할 변경 | `PATCH` | `/api/users/:uid/role` | admin |

서버는 Firebase Admin SDK를 아직 사용하지 않으므로, 요청에 담긴 UID를 MongoDB `users` 컬렉션에서 다시 조회해 실제 admin인지 확인한다.

### 6. 자기 권한 보호

admin은 다른 사용자 역할을 변경할 수 있다.
하지만 자기 자신의 `admin` 권한을 실수로 제거하는 요청은 서버가 차단한다.

## 프론트엔드 변경 내용

### 1. 회원가입 화면 변경

회원가입 화면에서 사용자 역할 선택 UI를 제거했다.
가입 직후 사용자는 항상 `buyer`로 저장된다.

딜러가 필요한 사용자는 로그인 후 `딜러 신청` 버튼을 누른다.

### 2. Header 상태 표시

Header는 사용자 상태에 따라 아래 항목을 표시한다.

| 상태 | 표시 |
| --- | --- |
| 비로그인 | 로그인, 회원가입 |
| `buyer`, `dealerStatus: none` | 딜러 신청 |
| `buyer`, `dealerStatus: pending` | 딜러 승인 대기 |
| `buyer`, `dealerStatus: rejected` | 딜러 신청 거절 |
| 승인된 dealer | 등록 버튼 |
| admin | 관리자 버튼 |

### 3. 관리자 화면

`AdminUserPanel.jsx`를 추가했다.

이번 단계에서 실제 동작하는 기능:

- 사용자 목록 조회
- 전체 사용자 수, 승인 대기 수, 딜러 수, admin 수 요약
- pending 사용자를 dealer로 승인
- pending 사용자를 거절
- buyer를 dealer로 직접 지정
- dealer 권한 회수
- 다른 사용자를 admin으로 지정
- 다른 admin을 buyer로 되돌리기
- 자기 자신의 admin 권한 해제 방지

확장용으로 준비한 영역:

- 차량 관리 탭 자리
- 상담 현황 탭 자리

이번 단계에서는 차량 관리와 상담 현황 API는 구현하지 않았다.

## Render와 로컬 설정

`.env`와 Render Environment에 아래 값을 추가한다.

```text
INITIAL_ADMIN_EMAILS=admin@example.com
```

이 이메일로 회원가입하면 admin이 된다.
Render 배포 환경에서는 실제 admin 이메일을 Render Environment에 등록한다.

## 검증 방법

사용자가 직접 실행할 명령어:

```bash
cmd.exe /c node --check server.js
cmd.exe /c npm.cmd --prefix frontend run build
npm.cmd run build
npm.cmd start
```

실제 환경변수 등록 후 확인할 흐름:

```text
1. INITIAL_ADMIN_EMAILS에 admin 이메일 등록
2. 해당 이메일로 회원가입
3. MongoDB users 문서가 role: admin인지 확인
4. 일반 이메일로 buyer 회원가입
5. buyer가 딜러 신청
6. admin 화면에서 신청 사용자를 승인
7. 승인된 사용자가 차량 등록 가능 확인
8. 승인 전 buyer는 차량 등록 불가 확인
9. admin 자기 자신의 admin 해제 시도 차단 확인
10. 등록한 dealer 본인만 차량 수정/삭제 가능 확인
```

## 이번 단계에서 하지 않은 것

- Firebase Admin SDK와 custom claims는 도입하지 않았다.
- Firebase Console에서 직접 권한을 부여하는 구조로 만들지 않았다.
- 최초 관리자 생성을 위한 공개 API나 비밀 코드 API는 만들지 않았다.
- 차량 관리와 상담 현황 API는 아직 구현하지 않았다.
- Socket.io 상담 기능은 7단계에서 진행한다.
- daisyUI 제거와 전체 UI 개편은 진행하지 않았다.

## 남은 리스크

- Firebase ID 토큰을 서버에서 검증하지 않으므로 운영 수준의 인증 방어는 아직 아니다.
- `INITIAL_ADMIN_EMAILS`를 잘못 등록하면 최초 admin 자동 지정이 되지 않는다.
- 이미 가입한 사용자를 admin으로 만들려면 MongoDB Atlas에서 직접 수정해야 한다.

## 다음 단계

1. 실제 `.env` 또는 Render Environment에 `INITIAL_ADMIN_EMAILS`를 등록한다.
2. admin 가입과 딜러 승인 흐름을 확인한다.
3. 6단계에서 차량 상세 URL과 상담 진입 API를 구현한다.
