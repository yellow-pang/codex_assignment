# 19단계 프리미엄 마켓플레이스 테마 기반 적용

## 1. 작업 목적

`plan-18`에서 확정한 방향을 실제 코드에 반영하기 위한 1차 구현 단계다.
이번 단계는 기능 로직을 변경하지 않고, 사용자 화면의 컬러/톤/분위기를 코발트 중심 기본 Tailwind 느낌에서 모던 브랜드 톤으로 전환하는 데 집중했다.

## 2. 작업 요약

| 구분 | 내용 |
| --- | --- |
| 테마 토큰 적용 | `frontend/src/style.css`에 브랜드 컬러 CSS 변수(`brand-ink`, `brand-deep`, `brand-ocean`, `brand-mint`, `brand-amber`)를 추가했다. |
| 공통 컴포넌트 보정 | `c-btn`, `c-input`, `c-card`, `c-badge`, `c-alert`의 색상/보더/포커스 규칙을 토큰 기반으로 정리했다. |
| 홈 Hero 리프레시 | 첫 페이지 Hero를 프리미엄 톤(딥 네이비-오션 그라디언트)으로 전환했다. |
| 검색/목록 강조색 보정 | 추천 매물 카운트, 로딩 스피너, 가격 강조색을 신규 팔레트로 통일했다. |
| 헤더 톤 보정 | 헤더 로고/내비 active/모바일 hover 색을 신규 팔레트로 맞췄다. |
| 차량 카드 보정 | 카드 hover 그림자, 제조사/상담 배지, 가격 색을 신규 팔레트로 조정했다. |

## 3. 수정 파일

- `frontend/src/style.css`
- `frontend/src/App.jsx`
- `frontend/src/components/Header.jsx`
- `frontend/src/components/CarCardGrid.jsx`

## 4. 구현 상세

### 4.1 전역 스타일 토큰

- `:root`에 컬러 토큰을 추가했다.
- `body` 배경을 저채도 민트 광원 기반의 라이트 그라디언트로 변경했다.
- 버튼/입력 포커스 링을 `brand-mint` 계열로 통일했다.

### 4.2 홈 화면(프리미엄)

- Hero 배경을 `#0e1420 -> #14263d -> #1c4e6d` 그라디언트로 변경했다.
- Hero 강조 텍스트를 민트 계열로 보정했다.
- Hero 우측 카드 그림자/오버레이를 어두운 톤으로 정리해 프리미엄 인상을 강화했다.

### 4.3 구매 구간(실용형)

- 추천 매물 카운트, 로딩 아이콘 등 상태 강조를 `brand-mint`로 통일했다.
- 카드 가격 강조를 `brand-amber`로 변경해 수치 시인성을 높였다.

### 4.4 네비게이션

- Header 로고 포인트 색을 민트 계열로 통일했다.
- 활성 내비/모바일 hover를 `mint tint + ocean text` 조합으로 통일했다.

## 5. 검증 결과

| 검증 | 결과 |
| --- | --- |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build` | 성공 |

참고:

- Vite의 기존 경고(`.env` 내 `NODE_ENV=production`)는 그대로 출력되지만 빌드는 성공했다.
- frontend 의존성의 moderate 취약점 안내(2건)는 기존 상태이며 이번 작업에서 패키지 변경은 없었다.

## 6. 남은 작업

1. 관리자/딜러 대시보드(`AdminUserPanel`, `DealerDashboard`)를 동일 토큰 기준으로 2차 통일.
2. 상세/채팅/인증 화면(`CarDetail`, `ChatRoom`, `LoginForm`, `RegisterForm`)까지 색상 일관성 확장.
3. daisyUI 잔여 class 최종 제거 점검 및 디자인 QA(375px, 768px, 1280px).
