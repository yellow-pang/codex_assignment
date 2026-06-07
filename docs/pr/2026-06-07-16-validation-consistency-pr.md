# PR: 입력 검증, 정합성, 동시성, 중복 요청 방지

## PR 제목

```text
feat: 입력 검증과 중복 요청 방어 강화
```

## 작업 배경

15단계에서 Firebase ID Token 기반 서버 인증과 권한 검증을 추가했지만, 인증된 사용자가 보내는 입력값 자체의 범위 검증과 빠른 반복 요청 방어는 더 보강할 필요가 있었다.

이번 작업은 차량, 사용자, 상담 메시지 입력값을 서버에서 최종 검증하고, 프론트 버튼 loading/disabled와 서버 메모리 TTL guard로 중복 제출을 줄이도록 정리했다.

## 변경 내용

### 차량 입력 검증 강화

- 차량 등록/수정 시 서버에서 필수값, 길이, 숫자 범위, 허용 목록을 검증한다.
- `dealerId`, `dealerName`, `dealerRole`은 기존처럼 서버 권한 판단에 사용하지 않는다.
- 검증 실패는 `{ message }` 형식과 `400` 상태 코드로 응답한다.

### 사용자 프로필과 역할 변경 검증 강화

- 사용자 이름 길이를 2~40자로 제한했다.
- 역할은 `buyer`, `dealer`, `admin`만 허용한다.
- 딜러 상태는 `none`, `pending`, `approved`, `rejected`만 허용한다.
- `dealer`는 `approved`, `admin`은 `none` 조합만 허용하도록 역할/상태 정합성을 강화했다.

### 채팅 메시지 검증 강화

- 공백 메시지는 저장하지 않는다.
- 1000자 초과 메시지는 잘라 저장하지 않고 오류로 차단한다.
- 메시지 조회 정렬을 `createdAt`, `_id` 오름차순으로 보강했다.

### 중복 요청 방어 추가

- `backend/utils/requestGuard.js`를 추가했다.
- 서버 메모리 TTL 기준으로 같은 요청이 짧은 시간 안에 반복될 때 `429` 오류로 차단한다.
- 차량 등록/수정/삭제, 상담방 생성, 상담 메시지 전송, 딜러 신청, 관리자 역할 변경에 적용했다.

### MongoDB index 생성 로직 추가

- 서버 시작 시 기본 컬렉션 생성 후 index 생성을 시도한다.
- `users.uid`, `chat_rooms.roomId`는 unique index로 중복을 방지한다.
- 상담방 목록과 메시지 조회용 일반 index를 추가했다.
- 기존 중복 데이터 때문에 index 생성이 실패해도 서버는 종료하지 않고 경고 로그를 남긴다.

### 업로드 보안 점검

- 기존 5MB, jpg/jpeg/png/webp 허용 정책을 유지했다.
- 업로드 파일은 `image` 필드 1장만 허용하도록 제한했다.
- 파일 수 제한 오류 메시지를 명확히 했다.

### 프론트 중복 제출 방지

- `pendingAction` 상태로 검색, 차량 등록/수정/삭제, 상담방 생성, 딜러 신청 중복 클릭을 막았다.
- 차량 폼 저장 중 버튼 문구를 `등록 중...`, `수정 중...`으로 표시한다.
- 삭제 모달은 삭제 중 오버레이 닫기와 삭제 버튼 재클릭을 막는다.
- 관리자 역할 변경은 사용자 UID 기준으로 처리 중 상태를 둔다.
- 채팅 메시지는 전송 중 버튼을 비활성화하고 1000자 초과를 1차 차단한다.

## 변경 파일

```text
backend/config/upload.js
backend/db.js
backend/services/cars.service.js
backend/services/chats.service.js
backend/services/users.service.js
backend/utils/normalizers.js
backend/utils/requestGuard.js
frontend/src/App.jsx
frontend/src/components/AdminUserPanel.jsx
frontend/src/components/CarCardGrid.jsx
frontend/src/components/CarDetail.jsx
frontend/src/components/CarForm.jsx
frontend/src/components/ChatRoom.jsx
frontend/src/components/DeleteConfirmModal.jsx
frontend/src/components/Header.jsx
docs/plans/plan-16-validation-consistency.md
docs/steps/2026-06-07-16-validation-consistency.md
docs/pr/2026-06-07-16-validation-consistency-pr.md
docs/progress.md
```

## 보존된 항목

| 항목                  | 내용                                                       |
| --------------------- | ---------------------------------------------------------- |
| Render 배포 구조      | 단일 Web Service 유지                                      |
| API 경로              | 기존 `/api/cars`, `/api/users`, `/api/chats`, `/cars` 유지 |
| Socket.io 이벤트 이름 | 기존 이벤트 이름 유지                                      |
| MongoDB 컬렉션 구조   | 큰 구조 변경 없음                                          |
| 외부 이미지 스토리지  | 도입하지 않음                                              |
| 업로드 제한값         | 기존 5MB와 jpg/jpeg/png/webp 유지                          |
| 대규모 UI 변경        | 없음                                                       |
| 에러 응답 키          | 기존 `{ message }` 유지                                    |

## 검증

```text
node --check backend/db.js                    → 성공
node --check backend/config/upload.js         → 성공
node --check backend/utils/normalizers.js     → 성공
node --check backend/utils/requestGuard.js    → 성공
node --check backend/services/cars.service.js → 성공
node --check backend/services/users.service.js → 성공
node --check backend/services/chats.service.js → 성공
node --check backend/sockets/chat.socket.js   → 성공
node --check backend/routes/cars.routes.js    → 성공
node --check backend/routes/users.routes.js   → 성공
node --check backend/routes/chats.routes.js   → 성공
node --check backend/server.js                → 성공
npm.cmd --prefix frontend run build           → 성공
npm.cmd run build                             → 성공
```

참고:

- Vite의 `NODE_ENV=production` 경고는 기존과 동일하며 빌드는 성공했다.
- 루트 통합 빌드 중 프론트엔드 의존성 moderate 취약점 2건이 보고되었으며, 강제 업데이트는 실행하지 않았다.
- 실제 Firebase/MongoDB 연동 API 검증은 로컬 `.env`와 MongoDB Atlas 준비 상태에 따라 추가 확인이 필요하다.

## 남은 리스크

- 기존 MongoDB 데이터에 중복 `users.uid` 또는 `chat_rooms.roomId`가 있으면 unique index 생성이 실패할 수 있다.
- 서버 메모리 TTL guard는 단일 Render Web Service 기준 1차 방어이며, 다중 인스턴스에서는 공유되지 않는다.
- 같은 문장을 아주 짧은 시간 안에 의도적으로 반복 전송하는 경우 중복 메시지로 차단될 수 있다.
- 실제 이미지 파일 내용 검사는 이번 단계에서 새 패키지를 추가하지 않아 수행하지 않는다.

## 체크리스트

- [x] 차량 등록/수정 서버 입력 검증을 강화했다.
- [x] 사용자 프로필과 역할 변경 검증을 강화했다.
- [x] 상담 메시지 공백/길이/중복 검증을 강화했다.
- [x] 프론트 버튼 loading/disabled 처리를 추가했다.
- [x] 백엔드 중복 요청 guard를 추가했다.
- [x] 상담방 upsert 정책을 유지하고 `roomId` unique index 후보를 실제 생성 로직으로 반영했다.
- [x] 메시지 동시 전송 정렬 기준을 `createdAt`, `_id`로 정리했다.
- [x] 업로드 보안 제한을 재점검했다.
- [x] 프론트 1차 검증과 백엔드 최종 검증 기준을 Step 문서에 정리했다.
- [ ] 실제 Firebase/MongoDB 환경에서 보호 API와 Socket.io 중복 요청 방어를 확인한다.
