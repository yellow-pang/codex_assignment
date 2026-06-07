# PR: 프리미엄 마켓플레이스 테마 1차 적용

## PR 제목

```text
feat: 프리미엄 마켓플레이스 컬러 토큰과 홈 UI 1차 적용
```

## 작업 배경

UI 방향은 `plan-18`에서 확정되었지만, 실제 화면은 아직 기본 Tailwind 코발트 계열이 많이 남아 있어 첫인상과 화면 통일성이 부족했다.

이번 PR은 기능 변경 없이, 기존 구성의 부분 보정이 아닌 전면 리디자인 기준으로 홈/검색/목록/헤더/카드 구조를 재편한 1차 적용이다.

## 변경 내용

### 1) 전역 스타일 토큰 적용

- `frontend/src/style.css`에 브랜드 토큰을 추가했다.
- 코발트 중심 스타일을 `brand-ink/deep/ocean/mint/amber` 중심으로 보정했다.
- 버튼, 입력, 카드, 배지, 상태 배너의 공통 스타일을 토큰 기반으로 통일했다.

### 2) 홈 Hero 전면 재구성

- 홈 Hero를 랜딩형 구조로 재구성하고 대형 비주얼 카드/퀵 배지를 추가했다.
- CTA와 통계 블록을 첫 뷰포트 중심에 배치해 탐색 시작 흐름을 단순화했다.
- 프리미엄 자동차 사이트 톤에 맞는 다크 그라디언트/광원 배경으로 교체했다.

### 3) 검색/결과 레이아웃 전면 재편

- 검색 UI를 상단 패널 중심에서 좌측 고정 필터 + 우측 결과 인벤토리 형태로 변경했다.
- 결과 영역에 칩/라벨 기반 정보 구조를 추가해 실용형 마켓 탐색 UX를 강화했다.

### 4) 헤더/차량 카드 전면 리디자인

- Header를 다크 프리미엄 네비게이션으로 재설계했다.
- CarCardGrid는 가격 오버레이, 이미지 비율, 스펙 밀도, CTA 구성을 마켓플레이스 패턴으로 재구성했다.
- 전역 폰트 스택을 `Pretendard Variable`/`SUIT` 우선으로 변경해 기본 Tailwind 느낌을 줄였다.

### 5) 사용자 피드백 기반 추가 수정

- Hero의 `조건 초기화` 버튼이 잘 보이지 않던 가시성 문제를 수정했다.
- 모바일에서 필터 패널이 스크롤 중 고정되어 카드와 겹치던 현상을 수정했다.
- 상세/상담/로그인/관리자 화면까지 동일한 신뢰형 색상 체계로 확장 적용했다.

## 변경 파일

```text
frontend/src/style.css
frontend/src/App.jsx
frontend/src/components/Header.jsx
frontend/src/components/CarCardGrid.jsx
frontend/src/components/CarDetail.jsx
frontend/src/components/ChatRoom.jsx
frontend/src/components/ChatRoomList.jsx
frontend/src/components/LoginForm.jsx
frontend/src/components/RegisterForm.jsx
frontend/src/components/AdminUserPanel.jsx
docs/steps/2026-06-07-19-premium-marketplace-theme-foundation.md
docs/pr/2026-06-07-19-premium-marketplace-theme-foundation-pr.md
docs/progress.md
```

## 비기능 영향

| 항목             | 내용      |
| ---------------- | --------- |
| API              | 변경 없음 |
| 백엔드 로직      | 변경 없음 |
| 권한/인증        | 변경 없음 |
| Socket.io 이벤트 | 변경 없음 |
| 패키지 추가/삭제 | 없음      |

## 검증

```text
npm.cmd --prefix frontend run build  → 성공
npm.cmd run build                    → 성공
```

참고:

- Vite 기존 경고(`NODE_ENV=production` in .env)는 출력되지만 빌드는 성공했다.
- frontend 의존성 moderate 취약점 안내(2건)는 기존 상태다.

## 다음 단계

1. `DealerDashboard` 포함 대시보드 잔여 컴포넌트의 스타일 토큰 일관성 최종 점검
2. daisyUI 잔여 class 및 레거시 유틸 사용 여부 최종 점검
3. 375px, 768px, 1280px 기준 반응형 QA와 시각 일관성 최종 점검
