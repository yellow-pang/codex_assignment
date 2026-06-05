# PR: 관리자 역할과 딜러 승인 흐름 추가

## PR 제목

```text
feat: 관리자 역할과 딜러 승인 흐름 추가
```

## 작업 배경

5단계 Firebase 인증 구현 후에는 회원가입 화면에서 사용자가 직접 `dealer`를 선택할 수 있었다.
이 방식은 빠르게 권한 흐름을 확인하기에는 좋지만, 실제 서비스에서는 아무나 차량 등록 권한을 얻을 수 있다는 문제가 있다.

6단계 차량 상세와 상담 진입을 진행하기 전에, 관리자 `admin` 역할과 딜러 승인 흐름을 추가해 권한 구조를 더 의미 있게 보강했다.

## 변경 내용

- 사용자 역할에 `admin`을 추가했다.
- 회원가입은 항상 `buyer`로 생성되도록 변경했다.
- 최초 admin 자동 지정을 위한 서버 환경변수 `INITIAL_ADMIN_EMAILS`를 추가했다.
- 사용자 프로필에 `dealerStatus`, `dealerRequestedAt`, `dealerApprovedAt`, `dealerApprovedBy` 흐름을 추가했다.
- `POST /api/users/dealer-request` 딜러 신청 API를 추가했다.
- `GET /api/users?requesterUid=...` admin 사용자 목록 조회 API를 추가했다.
- `PATCH /api/users/:uid/role` admin 역할/딜러 승인 변경 API를 추가했다.
- 차량 등록, 수정, 삭제 권한을 승인된 딜러(`role: dealer`, `dealerStatus: approved`)로 제한했다.
- admin이 자기 자신의 admin 권한을 해제하지 못하도록 서버에서 방어했다.
- 회원가입 화면에서 딜러 선택 UI를 제거했다.
- Header에 딜러 신청, 승인 대기, 거절 상태, 관리자 화면 버튼을 추가했다.
- 관리자 화면 초안 `AdminUserPanel`을 추가했다.
- 관리자 화면에서 사용자 목록, 딜러 승인, 거절, 딜러 회수, admin 지정/해제를 처리하도록 했다.
- README, 배포 문서, 체크리스트, 향후 계획서, Step 문서를 갱신했다.

## 변경 파일

```text
.env.example
README.md
docs/deploy-checklist.md
docs/deploy-guide.md
docs/plans/plan-05-1-admin-role-management.md
docs/progress.md
docs/pr/2026-06-05-05-1-admin-role-management-pr.md
docs/steps/2026-06-05-05-1-admin-role-management.md
docs/실시간_Car_Market_향후_개발_계획서.md
frontend/src/App.jsx
frontend/src/components/AdminUserPanel.jsx
frontend/src/components/Header.jsx
frontend/src/components/RegisterForm.jsx
frontend/src/contexts/AuthContext.jsx
server.js
```

## 검증

사용자가 직접 실행할 명령어:

```text
cmd.exe /c node --check server.js
cmd.exe /c npm.cmd --prefix frontend run build
npm.cmd run build
npm.cmd start
```

실제 기능 확인:

```text
1. INITIAL_ADMIN_EMAILS 등록
2. admin 이메일로 회원가입
3. MongoDB users 문서가 role: admin인지 확인
4. buyer 회원가입
5. buyer 딜러 신청
6. admin 화면에서 딜러 승인
7. 승인된 dealer 차량 등록 가능 확인
8. 승인 전 buyer 차량 등록 차단 확인
9. admin 자기 자신의 admin 권한 해제 차단 확인
```

## 남은 리스크

- Firebase Admin SDK를 사용하지 않으므로 서버의 Firebase ID 토큰 검증은 아직 없다.
- 실제 Firebase와 MongoDB 환경변수가 있어야 admin 자동 지정과 딜러 승인 실동작을 확인할 수 있다.
- 차량 관리와 상담 현황 API는 관리자 화면 확장 영역만 준비했고 아직 구현하지 않았다.
- Socket.io 상담과 상담방 생성은 이후 단계에서 진행한다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서와 현재 코드를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] 회원가입을 buyer 고정으로 변경했다.
- [x] `INITIAL_ADMIN_EMAILS`를 추가했다.
- [x] admin 역할을 추가했다.
- [x] 딜러 신청 API를 추가했다.
- [x] admin 사용자 목록 API를 추가했다.
- [x] admin 역할 변경 API를 추가했다.
- [x] 승인된 딜러만 차량 등록 가능하도록 서버 권한을 보강했다.
- [x] 관리자 화면 초안을 추가했다.
- [x] 최초 admin 설정 방법을 문서화했다.
- [ ] 서버 JS 문법 검사는 사용자가 직접 실행한다.
- [ ] 프론트엔드 빌드는 사용자가 직접 실행한다.
- [ ] 실제 Firebase/MongoDB 환경에서 admin과 딜러 승인 흐름을 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.
