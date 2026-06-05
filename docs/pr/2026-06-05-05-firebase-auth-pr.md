# PR: Firebase 인증과 딜러 권한 관리 추가

## PR 제목

```text
feat: Firebase 인증과 딜러 권한 관리 추가
```

## 작업 배경

`docs/실시간_Car_Market_향후_개발_계획서.md`의 5단계 Firebase 인증 항목에 따라, Firebase Authentication 기반 회원가입/로그인과 MongoDB 사용자 프로필 저장을 구현했다.

기존에는 로그인 사용자와 역할 정보가 없어 누구나 차량 등록, 수정, 삭제 화면에 접근할 수 있었다.
신규 요구사항에서는 Firebase UID를 사용자 식별 기준으로 사용하고, 사용자 역할 `buyer`, `dealer`에 따라 차량 등록과 관리 권한을 제한해야 한다.

## 변경 내용

- 프론트엔드 의존성에 `firebase`를 추가했다.
- Firebase Web config를 Vite 환경변수로 읽는 `frontend/src/firebase.js`를 추가했다.
- Vite가 루트 `.env`의 Firebase 값을 읽도록 `frontend/vite.config.js`에 `envDir`를 설정했다.
- Firebase 인증 상태를 전역에서 관리하는 `AuthContext`를 추가했다.
- 로그인, 회원가입, 로그아웃 화면과 흐름을 추가했다.
- 회원가입 시 사용자 유형 `buyer`, `dealer`를 선택하도록 했다.
- 회원가입 성공 후 MongoDB `users` 컬렉션에 사용자 프로필을 저장하도록 했다.
- MongoDB 프로필 저장 실패 시 방금 생성한 Firebase 계정 삭제 보정을 시도하도록 했다.
- Express에 `/api/users`, `/api/users/me`, `/api/users/dealers` API를 추가했다.
- 차량 등록 시 서버가 MongoDB 사용자 프로필을 조회해 딜러 권한을 확인하도록 했다.
- 차량 등록 시 `dealerId`, `dealerName`을 차량 문서에 저장하도록 했다.
- 차량 수정과 삭제는 차량을 등록한 딜러 본인만 가능하도록 제한했다.
- 차량 목록은 비로그인 사용자도 볼 수 있고, 차량 상세는 로그인 후 볼 수 있도록 제한했다.
- Header에 로그인, 회원가입, 로그아웃, 딜러 등록 버튼 흐름을 추가했다.
- `.env.example`, README, 배포 문서에 Firebase 환경변수와 인증 설정 안내를 추가했다.
- 5단계 계획 문서, 상세 Step 문서, 진행 기록, PR 문서를 추가했다.

## 변경 파일

```text
.env.example
README.md
docs/deploy-checklist.md
docs/deploy-guide.md
docs/plans/plan-05-firebase-auth.md
docs/progress.md
docs/pr/2026-06-05-05-firebase-auth-pr.md
docs/steps/2026-06-05-05-firebase-auth.md
docs/실시간_Car_Market_향후_개발_계획서.md
frontend/package-lock.json
frontend/package.json
frontend/vite.config.js
frontend/src/App.jsx
frontend/src/components/CarDetail.jsx
frontend/src/components/CarTable.jsx
frontend/src/components/Header.jsx
frontend/src/components/LoginForm.jsx
frontend/src/components/RegisterForm.jsx
frontend/src/contexts/AuthContext.jsx
frontend/src/firebase.js
frontend/src/main.jsx
server.js
```

## 검증

```text
node --check server.js
npm.cmd --prefix frontend run build
npm.cmd run build
```

검증 결과:

- `cmd.exe /c node --check server.js`: 성공
- `cmd.exe /c npm.cmd --prefix frontend run build`: 성공
- `npm.cmd run build`: 사용자가 직접 실행 예정
- `npm.cmd start`: 사용자가 직접 실행 예정
- 실제 Firebase 회원가입/로그인 검증은 Firebase Web config와 MongoDB 환경변수 등록 후 사용자가 직접 확인 예정

## 남은 리스크

- 실제 Firebase Web config가 없는 환경에서는 회원가입/로그인 실동작 검증이 제한된다.
- 실제 `MONGODB_URI`가 없는 환경에서는 `/api/users` 저장/조회와 딜러 권한 API 실동작 검증이 제한된다.
- Firebase Admin SDK를 사용하지 않으므로 서버의 Firebase ID 토큰 검증은 아직 없다.
- 관리자 `admin` 역할은 이후 별도 단계에서 추가한다.
- React Router 기반 `/cars/:id` 상세 URL과 상담 진입은 6단계에서 진행한다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서와 현재 코드를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] `firebase`를 설치했다.
- [x] Firebase 설정 파일을 추가했다.
- [x] 인증 상태 관리 Context를 추가했다.
- [x] 로그인 화면을 추가했다.
- [x] 회원가입 화면과 사용자 역할 선택을 추가했다.
- [x] MongoDB `users` 프로필 저장 API를 추가했다.
- [x] 딜러 권한 확인을 서버에 추가했다.
- [x] 차량 수정/삭제를 등록한 딜러 본인으로 제한했다.
- [x] Firebase 환경변수를 문서화했다.
- [x] 서버 JS 문법 검사를 실행한다.
- [x] 프론트엔드 빌드를 실행한다.
- [ ] 루트 빌드를 실행한다.
- [ ] 실제 Firebase 환경에서 회원가입/로그인을 확인한다.
- [ ] 실제 MongoDB 환경에서 사용자 프로필 저장과 권한 제한을 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.
