# 19단계 프리미엄 마켓플레이스 테마 기반 적용

## 1. 작업 목적

`plan-18`에서 확정한 방향을 실제 코드에 반영하기 위한 1차 구현 단계다.
이번 단계는 기능 로직을 변경하지 않고, 사용자 화면을 기존 구성 보정이 아니라 전면 리디자인 형태로 재구성하는 데 집중했다.

## 2. 작업 요약

| 구분                | 내용                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 테마 토큰 적용      | `frontend/src/style.css`에 브랜드 컬러 CSS 변수(`brand-ink`, `brand-deep`, `brand-ocean`, `brand-mint`, `brand-amber`)를 추가했다. |
| 공통 컴포넌트 보정  | `c-btn`, `c-input`, `c-card`, `c-badge`, `c-alert`의 색상/보더/포커스 규칙을 토큰 기반으로 정리했다.                               |
| 홈 Hero 전면 재구성 | 랜딩 형태 Hero, 대형 비주얼 카드, 퀵 배지 영역으로 첫 화면 구조 자체를 재설계했다.                                                 |
| 검색/목록 구조 재편 | 상단 검색바 형태를 좌측 고정 필터 + 우측 결과 인벤토리 형태의 2단 마켓플레이스 레이아웃으로 변경했다.                              |
| 헤더 전면 리디자인  | 다크 프리미엄 네비게이션 톤으로 변경하고 데스크톱/모바일 메뉴를 동일한 브랜드 감성으로 통일했다.                                   |
| 차량 카드 재설계    | 이미지 비중, 가격 오버레이, 스펙 정보 밀도, CTA 배치를 마켓플레이스형 카드 패턴으로 재구성했다.                                    |
| 타이포 통일         | 전역 폰트를 `Pretendard Variable`/`SUIT` 우선 스택으로 변경해 기본 Tailwind/Bootstrap 느낌을 줄였다.                               |

## 3. 수정 파일

- `frontend/src/style.css`
- `frontend/src/App.jsx`
- `frontend/src/components/Header.jsx`
- `frontend/src/components/CarCardGrid.jsx`
- `frontend/src/components/CarDetail.jsx`
- `frontend/src/components/ChatRoom.jsx`
- `frontend/src/components/ChatRoomList.jsx`
- `frontend/src/components/LoginForm.jsx`
- `frontend/src/components/RegisterForm.jsx`
- `frontend/src/components/AdminUserPanel.jsx`

## 4. 구현 상세

### 4.1 전역 스타일 토큰

- `:root`에 컬러 토큰을 추가했다.
- `body` 배경을 저채도 민트 광원 기반의 라이트 그라디언트로 변경했다.
- 버튼/입력 포커스 링을 `brand-mint` 계열로 통일했다.

### 4.2 홈 화면(프리미엄)

- Hero를 단순 소개 섹션이 아니라 랜딩형 핵심 진입 화면으로 재구성했다.
- 대형 이미지 카드와 보조 정보 칩을 결합해 자동차 사이트 레퍼런스 느낌을 강화했다.
- 핵심 CTA(`지금 매물 탐색`)와 통계 블록을 첫 뷰포트 내에 배치해 전환 시작점을 명확히 했다.

### 4.3 구매 구간(실용형)

- 필터 패널을 좌측 사이드 형태로 고정하고 결과 인벤토리를 우측으로 분리해 실사용 탐색성을 높였다.
- 결과 헤더에 마켓플레이스형 라벨/칩을 배치해 정보 구조를 명확히 했다.
- 로딩/카운트/가격 강조색을 토큰 기반으로 통일했다.

### 4.4 네비게이션

- Header를 다크 글래스 톤으로 재설계해 프리미엄 자동차 서비스 느낌을 강화했다.
- 모바일 메뉴 배경/버튼 톤도 동일한 다크 브랜드 계열로 정리했다.

## 5. 검증 결과

| 검증                                  | 결과 |
| ------------------------------------- | ---- |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build`                   | 성공 |

참고:

- Vite의 기존 경고(`.env` 내 `NODE_ENV=production`)는 그대로 출력되지만 빌드는 성공했다.
- frontend 의존성의 moderate 취약점 안내(2건)는 기존 상태이며 이번 작업에서 패키지 변경은 없었다.

## 6. 남은 작업

1. `DealerDashboard` 포함 대시보드 잔여 컴포넌트의 스타일 토큰 일관성 최종 점검.
2. daisyUI 잔여 class 최종 제거 점검.
3. 디자인 QA(375px, 768px, 1280px)와 실제 기기 스크롤 겹침 재확인.

## 7. 추가 반영 (사용자 피드백)

사용자 피드백을 반영해 다음 항목을 추가 수정했다.

1. 초기화 버튼 가시성 문제 수정

- Hero 영역의 `조건 초기화` 버튼이 배경/글자 대비로 잘 보이지 않던 문제를 수정했다.
- 버튼을 전용 스타일로 분리해 텍스트 가독성을 고정했다.

2. 모바일 스크롤 겹침 문제 수정

- 모바일에서 필터 패널이 sticky로 유지되어 카드와 겹치던 문제를 수정했다.
- `lg` 이상에서만 sticky가 적용되도록 변경했다.

3. 화면 확장 리디자인 적용

- `CarDetail`, `ChatRoom`, `ChatRoomList`, `LoginForm`, `RegisterForm`, `AdminUserPanel`까지 신뢰형 브랜드 톤으로 확장 적용했다.
- 민트 중심 포인트를 줄이고 딥 네이비 + 스틸 블루 + 뉴트럴 그레이 중심으로 통일했다.
