# PR: 차량 상세 URL과 상담방 생성 진입 추가

## PR 제목

```text
feat: 차량 상세 URL과 상담방 생성 진입 추가
```

## 작업 배경

기존 차량 상세 화면은 React 상태의 `selectedCar`에 의존했다.
목록에서 상세 버튼을 눌렀을 때는 동작했지만, 상세 화면을 새로고침하거나 `/cars/:id` URL로 직접 접근하면 차량 데이터를 다시 불러올 수 없었다.

또한 Socket.io 실시간 상담 전에 차량, 요청자, 딜러 기준으로 상담방을 만들 수 있는 REST API가 필요했다.

## 변경 내용

- `frontend/src/main.jsx`에 `BrowserRouter`를 적용했다.
- `frontend/src/App.jsx`에서 `/`, `/cars/:id`, `/chats/:roomId`, `/login`, `/register`, `/admin` 라우트를 연결했다.
- 목록의 상세 버튼이 `/cars/:id`로 이동하도록 변경했다.
- `/cars/:id` 진입 시 `GET /api/cars/:id`로 차량 상세 정보를 다시 조회하도록 했다.
- 상세 화면 새로고침과 직접 URL 접근을 지원했다.
- 상세 화면에 담당 딜러 정보와 `딜러와 상담하기` 버튼을 추가했다.
- `POST /api/chats/rooms` 상담방 생성 API를 추가했다.
- 상담방은 `carId`, `buyerId`, 차량 문서의 `dealerId` 조합으로 생성하거나 재사용한다.
- 로그인한 모든 사용자가 상담방을 만들 수 있게 열어 두었다.
- 자기 자신과 상담방을 만드는 요청은 서버에서 차단했다.
- 상담방 생성 후 `/chats/:roomId` 준비 화면으로 이동하도록 했다.
- Step, PR, progress, README, 배포 문서, 향후 계획서를 갱신했다.

## 변경 파일

```text
README.md
docs/deploy-checklist.md
docs/deploy-guide.md
docs/plans/plan-06-car-detail-chat-entry.md
docs/progress.md
docs/pr/2026-06-05-06-car-detail-chat-entry-pr.md
docs/steps/2026-06-05-06-car-detail-chat-entry.md
docs/실시간_Car_Market_향후_개발_계획서.md
frontend/src/App.jsx
frontend/src/components/CarDetail.jsx
frontend/src/main.jsx
server.js
```

## 사용자 실행 필요

권한 문제를 피하기 위해 `react-router-dom` 설치는 사용자가 직접 실행한다.

```text
npm.cmd --prefix frontend install react-router-dom
```

이 명령은 `frontend/package.json`과 `frontend/package-lock.json`을 갱신한다.

## 검증

실행 완료:

```text
cmd.exe /c node --check server.js
```

결과:

```text
성공
```

사용자가 직접 실행할 명령어:

```text
npm.cmd --prefix frontend install react-router-dom
npm.cmd --prefix frontend run build
npm.cmd run build
npm.cmd start
```

실제 기능 확인:

```text
1. 로그인 후 차량 목록에서 상세 버튼 클릭
2. /cars/:id 이동 확인
3. 상세 화면 새로고침 후 차량 정보 유지 확인
4. 딜러와 상담하기 클릭
5. /chats/:roomId 준비 화면 이동 확인
6. MongoDB chat_rooms 문서 저장 확인
7. 자기 자신과 상담방 생성 차단 확인
```

## 남은 리스크

- `react-router-dom` 설치 전에는 프론트엔드 빌드가 실패한다.
- Firebase Admin SDK를 사용하지 않으므로 서버의 Firebase ID 토큰 검증은 아직 없다.
- 실제 Firebase와 MongoDB 환경변수가 있어야 상세 조회와 상담방 생성 실동작을 확인할 수 있다.
- `/chats/:roomId`는 준비 화면이며, 실시간 메시지는 7단계 Socket.io에서 구현한다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서와 현재 코드를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] React Router 적용 코드를 추가했다.
- [x] `/cars/:id` 상세 URL을 추가했다.
- [x] 상세 URL에서 API로 차량을 다시 조회하도록 했다.
- [x] 상담방 생성 API를 추가했다.
- [x] 자기 자신과 상담방을 만드는 요청을 차단했다.
- [x] `/chats/:roomId` 준비 화면을 추가했다.
- [x] 서버 JS 문법 검사를 실행했다.
- [ ] 사용자가 `react-router-dom`을 설치한다.
- [ ] 프론트엔드 빌드는 사용자가 직접 실행한다.
- [ ] 루트 빌드는 사용자가 직접 실행한다.
- [ ] 실제 Firebase/MongoDB 환경에서 상담방 생성 흐름을 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.
