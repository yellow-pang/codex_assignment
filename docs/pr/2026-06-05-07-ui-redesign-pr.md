# PR: UI 전면 개선 — daisyUI 제거, 순수 Tailwind Modern Marketplace 적용

## PR 제목

```text
feat: UI 전면 개선 — daisyUI 제거, 순수 Tailwind Modern Marketplace 적용
```

## 작업 배경

6단계까지 서비스 기능이 완성된 이후 UI 전면 개선이 필요했다.
현재 UI 전체에 daisyUI 클래스가 혼재되어 있었고, 차량 목록은 테이블 형태로 마켓 서비스 느낌과 거리가 있었다.
`docs/실시간_Car_Market_UI_개선_분석_보고서.md`와 `docs/images/확장_계획_디자인.png`를 기준으로 Modern Car Marketplace 스타일로 개선했다.

## 변경 내용

### 공통 스타일

- `frontend/src/style.css`에 `@layer components`로 `c-btn-*`, `c-input`, `c-select`, `c-textarea`, `c-card`, `c-badge-*`, `c-alert-*`, `c-label` 공통 클래스 패턴을 정의했다.

### 헤더

- `Header.jsx`를 CAR MARKET 로고 + sticky 헤더 + 모바일 햄버거 메뉴 구조로 재작성했다.
- 로그인 사용자에게 `내 상담` 링크를 추가했다.

### 차량 목록 화면

- `App.jsx` 목록 화면을 Hero 섹션 + 검색 패널 + 카드 그리드 구조로 개편했다.
- 신규 `CarCardGrid.jsx` 컴포넌트를 생성해 이미지 중심 카드 그리드를 구현했다.
- `CarTable.jsx`는 딜러/관리자 화면에서 재사용할 수 있도록 순수 Tailwind로 교체하고 유지했다.
- `App.jsx`에 `/chats` 라우트를 추가했다.

### 차량 상세 화면

- `CarDetail.jsx`를 이미지 5:2 비율 2열 레이아웃 + 스펙 그리드 + 딜러 CTA 패널로 재작성했다.
- 가격을 `text-3xl font-extrabold text-blue-600`으로 강조했다.
- 브레드크럼 네비게이션을 추가했다.

### 로그인 / 회원가입

- `LoginForm.jsx`를 중앙 정렬 인증 카드 형태로 재작성하고 회원가입 링크를 추가했다.
- `RegisterForm.jsx`에 buyer/dealer 역할 선택 카드 UI(`RoleCard` 컴포넌트)를 추가했다.
- dealer 선택 시에도 `dealerStatus: pending`으로 저장되어 기존 관리자 승인 흐름을 유지한다.

### 차량 등록/수정 폼

- `CarForm.jsx`를 기본 정보 / 차량 스펙 / 판매 정보 / 사진 / 설명 섹션 분리 폼으로 재작성했다.

### 모달 / 알림

- `DeleteConfirmModal.jsx`를 순수 Tailwind fixed overlay + dialog 패널로 교체했다.
- 오버레이 클릭으로 모달이 닫히는 UX를 추가했다.
- `AlertMessage.jsx`를 `c-alert-*` 클래스로 교체했다.

### 관리자 화면

- `AdminUserPanel.jsx`를 색상별 `SummaryCard` + 순수 Tailwind 탭 + 테이블로 재작성했다.
- daisyUI `stats`, `tabs tabs-boxed`, `table table-zebra`, `loading loading-spinner`를 모두 제거했다.

### 신규 컴포넌트

- `ChatRoomList.jsx`: 상담방 목록 UI, `GET /api/chats/rooms?uid=xxx` 연결
- `ChatRoom.jsx`: 채팅 화면 UI, 이전 메시지 REST 조회. Socket.io 실시간 연결은 8단계 예정

### 서버 신규 API

- `GET /api/chats/rooms?uid=xxx` — 내 상담방 목록 조회
- `GET /api/chats/rooms/:roomId/messages` — 이전 메시지 조회

### daisyUI 제거

- `frontend/tailwind.config.js`에서 daisyUI 플러그인 설정 제거
- `npm uninstall daisyui`로 패키지 제거

## 변경 파일

```text
frontend/src/style.css
frontend/src/App.jsx
frontend/src/components/AlertMessage.jsx
frontend/src/components/AdminUserPanel.jsx
frontend/src/components/CarCardGrid.jsx          (신규)
frontend/src/components/CarDetail.jsx
frontend/src/components/CarForm.jsx
frontend/src/components/CarTable.jsx
frontend/src/components/ChatRoom.jsx             (신규)
frontend/src/components/ChatRoomList.jsx         (신규)
frontend/src/components/DeleteConfirmModal.jsx
frontend/src/components/Header.jsx
frontend/src/components/LoginForm.jsx
frontend/src/components/RegisterForm.jsx
frontend/tailwind.config.js
server.js
docs/plans/plan-07-ui-redesign.md
docs/steps/2026-06-05-07-ui-redesign.md
docs/pr/2026-06-05-07-ui-redesign-pr.md
```

## 보존된 항목

| 항목                  | 이유                                         |
| --------------------- | -------------------------------------------- |
| Firebase 인증 로직    | `AuthContext.jsx` 내부 변경 없음             |
| Express API 경로      | `/api/cars`, `/api/users`, `/api/chats` 유지 |
| Socket.io 이벤트 이름 | 8단계까지 예약                               |
| MongoDB 데이터 구조   | 컬렉션 구조 변경 없음                        |
| React Router 경로     | 기존 6개 경로 유지, `/chats` 추가            |

## 검증

```text
npm run build     → ✓ 성공 (64 modules, 4.10s)
node --check server.js  → ✓ 문법 이상 없음
```

## 다음 단계

8단계에서 Socket.io 실시간 연결을 완성해 ChatRoom의 메시지 전송·수신 기능과 딜러 온라인 상태 표시를 활성화한다.
