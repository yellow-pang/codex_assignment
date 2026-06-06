# PR: 상담·관리자·모바일 UI 고도화

## PR 제목

```text
feat: 상담 및 관리자 모바일 UI 고도화
```

## 작업 배경

11단계 Modern UI 재설계 이후 상담방 목록, 채팅 화면, 딜러 관리, 관리자 대시보드, 모바일 하단 내비게이션이 2차 개선 범위로 남아 있었다.

이번 작업은 1차 디자인 색상 체계인 Clean Blue Trust를 유지하고, 딜러/관리자 업무 화면에만 Premium Navy Electric의 slate/navy 톤을 부분 적용해 전체 서비스 통일감을 지키는 방향으로 진행했다.

## 변경 내용

### 디자인 방향

- A: Clean Blue Trust를 유지했다.
- 사용자 화면은 `white`, `slate-50`, `blue-600`, sky/cyan light gradient 중심으로 유지했다.
- 딜러/관리자 화면은 `slate-950` 사이드바, `blue-600` active menu, white content card 조합으로 구성했다.
- 상담 화면은 밝은 배경을 유지하고 내 메시지 `blue-600`, 상대 메시지 `slate-100`, 온라인 상태 emerald로 구분했다.
- C: Modern Teal Mobility, D: Graphite Lime Accent는 사용하지 않았다.

### 상담방 목록

- 상담 목록 상단 Hero와 요약 카드를 추가했다.
- 차량명, 구매자명, 딜러명, 마지막 메시지 기준 상담방 검색을 추가했다.
- 상담방 카드를 차량 썸네일, 상대방, 마지막 메시지, 최근 시간, 상태 배지 중심으로 개선했다.
- 빈 상태에서 차량 목록으로 이동하는 CTA를 제공했다.

### 채팅 화면

- 데스크톱에서는 차량 상담 정보 패널과 채팅 영역을 분리했다.
- 모바일에서는 차량 정보와 상대방 정보를 상단에 압축 표시했다.
- Socket.io 연결 상태 안내를 별도 안내바로 표시했다.
- 말풍선 색상과 간격, 입력창 구성을 개선했다.

### 딜러 관리

- `/dealer` 라우트와 `DealerDashboard.jsx`를 추가했다.
- 현재 차량 목록에서 로그인 딜러의 UID와 `dealerId`가 일치하는 차량만 필터링해 내 차량 관리 UI를 제공한다.
- 데스크톱은 테이블형, 모바일은 카드형으로 구성했다.
- 상세, 수정, 삭제 흐름은 기존 핸들러를 유지했다.

### 관리자 대시보드

- `AdminUserPanel.jsx`를 사이드바 기반 업무형 화면으로 재구성했다.
- 사용자 관리 기능은 기존 승인/거절/권한 변경 동작을 유지했다.
- 차량 관리와 상담 현황은 새 API가 필요한 범위라 준비 중 패널로 표시했다.

### 모바일 하단 내비게이션

- `MobileBottomNav.jsx`를 추가했다.
- 모바일에서만 차량 검색, 내 상담, 내 차량, 관리자 탭을 권한에 따라 표시한다.
- 데스크톱 Header는 유지했다.

## 변경 파일

```text
docs/plans/plan-12-consultation-admin-mobile-ui.md
docs/steps/2026-06-06-12-consultation-admin-mobile-ui.md
docs/pr/2026-06-06-12-consultation-admin-mobile-ui-pr.md
frontend/src/App.jsx
frontend/src/components/Header.jsx
frontend/src/components/ChatRoomList.jsx
frontend/src/components/ChatRoom.jsx
frontend/src/components/AdminUserPanel.jsx
frontend/src/components/DealerDashboard.jsx
frontend/src/components/MobileBottomNav.jsx
docs/progress.md
```

## 보존된 항목

| 항목 | 내용 |
| --- | --- |
| Express API | 변경 없음 |
| Firebase Auth | 변경 없음 |
| Socket.io 이벤트 | 변경 없음 |
| MongoDB 컬렉션 | 변경 없음 |
| Render 배포 구조 | 변경 없음 |
| 신규 패키지 | 없음 |

## 검증

```text
npm.cmd --prefix frontend run build  → 성공
npm.cmd run build                    → 성공
```

추가 확인:

- daisyUI className 재도입 없음
- frontend moderate 취약점 2건은 기존과 동일
- `.env`의 `NODE_ENV=production` 관련 Vite 경고는 기존과 동일

## 다음 단계

실제 Firebase와 MongoDB 환경에서 구매자, 딜러, admin 계정으로 상담 목록, 채팅, 내 차량 관리, 사용자 승인 버튼을 브라우저에서 확인한다.
