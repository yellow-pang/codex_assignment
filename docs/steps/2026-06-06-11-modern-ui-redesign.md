# 2026-06-06 11단계 Modern UI 재설계 상세 설명

## 이 문서의 목표

이번 단계에서는 10단계 제출용 README 정리 이후 첫 고도화 작업으로, 사용자에게 가장 많이 보이는 핵심 화면을 Modern Car Marketplace 느낌으로 다시 정리했다.

기존 7단계 UI 개선은 daisyUI 제거와 기능 화면 전환에는 성공했지만, `docs/images/확장_계획_디자인.png`의 밝은 고급 마켓 UI, 차량 이미지 중심 Hero, 인증 브랜드 패널, 딜러 업무형 폼 느낌은 충분히 반영되지 않았다.

## 한 줄 요약

사용자 화면은 Clean Blue Trust 콘셉트로 재정리하고, 첫 화면/검색/차량 카드/상세/인증/차량 등록 폼을 순수 Tailwind CSS 기반의 밝고 현대적인 마켓 UI로 개선했다.

## 확정한 디자인 기준

| 항목 | 확정 기준 |
| --- | --- |
| 메인 컬러 | Clean Blue Trust |
| 사용자 화면 | `white`, `slate-50`, `blue-600`, sky light gradient |
| 관리자/딜러 톤 | slate/navy 톤을 사이드바와 관리 영역에 부분 적용 |
| 가격 강조 | `blue-600` |
| 상담 가능 상태 | emerald |
| 경고/삭제 | red |
| 새 아이콘 패키지 | 추가하지 않음 |
| 모바일 하단 탭 | 1차 구현 제외 |
| 기능 로직 | 변경하지 않음 |

## 이미지 placeholder 기준

| 용도 | 파일명 |
| --- | --- |
| 차량 이미지 미등록 기본 이미지 | `uploads/default-car.png` |
| 차량 등록/수정 폼 업로드 유도 이미지 | `uploads/car-upload-placeholder.png` |

차량 이미지가 없는 경우에는 카드와 상세 화면에서 `uploads/default-car.png`를 사용한다.
차량 목록 자체가 비어 있는 경우에는 새 `EmptyState` 컴포넌트로 “조건에 맞는 차량이 없습니다” 계열 안내를 표시한다.

## 변경한 파일 요약

| 파일 | 변경 내용 |
| --- | --- |
| `docs/plans/plan-11-modern-ui-redesign.md` | 사용자 확정 답변과 1차/2차 범위 반영 |
| `frontend/src/style.css` | 공통 버튼, 입력, 카드, 배지, alert 톤을 Clean Blue Trust 기준으로 개선 |
| `frontend/src/App.jsx` | Hero, 검색 패널, 추천 매물 섹션을 밝은 마켓형 레이아웃으로 개선 |
| `frontend/src/components/EmptyState.jsx` | 신규. 목록 없음 상태 전용 안내 컴포넌트 |
| `frontend/src/components/Header.jsx` | 브랜드 로고, sticky header, 모바일 메뉴 스타일 개선 |
| `frontend/src/components/CarCardGrid.jsx` | 차량 카드 이미지, 가격, 스펙, 상담 CTA 중심으로 개선 |
| `frontend/src/components/CarDetail.jsx` | 큰 이미지, 썸네일, 가격, 스펙, 딜러 CTA 카드 개선 |
| `frontend/src/components/LoginForm.jsx` | 2열 브랜드 패널형 로그인 화면으로 개선 |
| `frontend/src/components/RegisterForm.jsx` | 2열 회원가입 화면, 역할 선택 카드, inline SVG 아이콘 적용 |
| `frontend/src/components/CarForm.jsx` | 딜러용 slate 사이드바와 업로드 유도 영역을 포함한 폼으로 개선 |

## 주요 변경 내용

### 공통 스타일

- `c-btn-*` 계열의 radius, shadow, hover 효과를 현대적인 CTA 느낌으로 조정했다.
- `c-input`, `c-select`, `c-textarea`를 `rounded-lg`, `blue-100` focus ring 중심으로 정리했다.
- `c-card`, `c-surface`, `c-section-title`, `c-section-desc` 공통 패턴을 추가했다.
- 상담 가능 상태는 emerald 계열 배지로 표현한다.

### 첫 화면

- 기존 파란 그라데이션 텍스트 Hero를 밝은 white/sky/blue gradient Hero로 교체했다.
- Hero 우측에 `uploads/default-car.png` placeholder 이미지를 배치했다.
- 검색 패널은 Hero 아래에 겹쳐 보이도록 `c-surface -mt-12` 형태로 구성했다.
- 검색 필드는 라벨이 있는 그룹으로 정리했다.

### 차량 카드

- 카드 hover 시 살짝 떠오르는 효과와 이미지 확대 효과를 추가했다.
- 가격은 `text-blue-600`과 굵은 타이포로 강조했다.
- 연식, 주행거리, 지역은 작은 스펙 박스로 분리했다.
- 상세 보기와 상담하기 CTA를 하단에 분리했다.
- 차량 목록이 비어 있을 때는 `EmptyState`를 사용한다.

### 차량 상세

- 큰 이미지 영역과 썸네일 그리드를 추가했다.
- 우측에는 차량명, 가격, 설명, 핵심 스펙, 딜러 CTA 카드를 배치했다.
- 담당 딜러 카드에 emerald 상담 가능 상태를 표시했다.

### 로그인 / 회원가입

- 중앙 단일 카드에서 2열 인증 화면으로 변경했다.
- 우측 브랜드 패널에 placeholder 차량 이미지를 배치했다.
- 회원가입 역할 선택 UI는 이모지 대신 inline SVG 아이콘을 사용한다.

### 차량 등록 / 수정 폼

- 딜러 업무형 화면에 맞춰 slate/navy 사이드바를 추가했다.
- 기본 정보, 차량 스펙, 판매 정보, 사진 업로드, 상세 설명 순서가 보이도록 구성했다.
- 사진 업로드 영역에 `uploads/car-upload-placeholder.png`를 사용하도록 연결했다.

## 보존한 항목

| 항목 | 내용 |
| --- | --- |
| API 경로 | `/api/cars`, `/api/users`, `/api/chats` 유지 |
| Firebase Auth | 로그인, 회원가입, 인증 상태 관리 로직 변경 없음 |
| Socket.io | 이벤트 이름과 메시지 송수신 로직 변경 없음 |
| MongoDB | 컬렉션 구조 변경 없음 |
| Render | 환경변수와 단일 Web Service 배포 구조 변경 없음 |
| 새 패키지 | 추가하지 않음 |

## 검증 결과

| 검증 항목 | 결과 |
| --- | --- |
| `npm.cmd --prefix frontend run build` | 성공 |
| `npm.cmd run build` | 성공 |
| daisyUI className 검색 | `btn`, `card`, `input`, `select`, `badge`, `navbar`, `stats`, `alert`, `modal` 계열 className 재도입 없음 |

참고:

- 첫 프론트 빌드는 샌드박스에서 `esbuild spawn EPERM`으로 실패했으나, 승인 후 동일 명령을 다시 실행해 성공했다.
- 루트 빌드 중 기존과 동일하게 frontend 의존성 moderate 취약점 2건이 보고되었다.
- Vite가 `.env`의 `NODE_ENV=production` 값을 경고하지만 빌드는 성공했다. 이 경고는 이번 UI 변경 전부터 남아 있던 항목이다.

## 남은 작업

1. 사용자가 `uploads/default-car.png`를 “차량 등록 대기 중” placeholder 이미지로 교체한다.
2. 사용자가 `uploads/car-upload-placeholder.png`를 “이미지 업로드 유도” placeholder 이미지로 추가한다.
3. 2차 개선에서 상담방 목록, 채팅 화면, 딜러 관리, 관리자 대시보드, 모바일 하단 내비게이션을 별도 고도화한다.
