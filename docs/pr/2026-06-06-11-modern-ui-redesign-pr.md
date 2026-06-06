# PR: Modern UI 재설계 — 핵심 사용자 화면 고도화

## PR 제목

```text
feat: 핵심 화면 Modern Car Marketplace UI 개선
```

## 작업 배경

10단계 README 제출용 정리 이후 고도화 첫 단계로, 과제 제출 시 가장 많이 보이는 사용자 핵심 화면의 완성도를 높인다.

기존 7단계 UI 개선은 daisyUI 제거와 카드형 목록 전환은 달성했지만, 목표 디자인 이미지의 밝은 고급 마켓 UI와는 차이가 있었다.
이번 작업은 기능 로직을 유지하면서 첫 화면, 차량 카드, 상세, 인증, 차량 등록/수정 폼을 Modern Car Marketplace 느낌으로 재정리한다.

## 변경 내용

### 디자인 방향

- Clean Blue Trust 콘셉트를 기준으로 사용자 화면을 `white`, `slate-50`, `blue-600`, sky light gradient 중심으로 정리했다.
- 딜러 업무형 화면에는 slate/navy 톤을 부분 적용했다.
- 가격은 `blue-600`, 상담 가능 상태는 emerald, 삭제/경고는 red 계열을 사용했다.
- 새 아이콘 패키지는 추가하지 않고 inline SVG와 Tailwind CSS만 사용했다.

### 첫 화면 / 검색

- `App.jsx`의 첫 화면 Hero를 밝은 gradient 기반으로 재구성했다.
- Hero에 placeholder 차량 이미지를 배치했다.
- 검색 패널을 라벨이 있는 입력 그룹과 CTA 버튼 구조로 개선했다.

### 차량 목록

- `CarCardGrid.jsx`를 이미지 중심 카드 UI로 개선했다.
- 가격, 스펙, 배지, 상담 CTA를 명확히 분리했다.
- 목록 없음 상태 전용 `EmptyState.jsx`를 추가했다.

### 차량 상세

- `CarDetail.jsx`에 큰 이미지, 썸네일 그리드, 가격 강조, 스펙 그리드, 딜러 CTA 카드를 적용했다.

### 인증 화면

- `LoginForm.jsx`와 `RegisterForm.jsx`를 2열 브랜드 패널 구조로 개선했다.
- 회원가입 역할 선택 카드의 이모지 아이콘을 inline SVG로 대체했다.

### 차량 등록 / 수정

- `CarForm.jsx`에 slate/navy 딜러 사이드바를 추가했다.
- 사진 업로드 영역에 업로드 유도 placeholder 이미지를 연결했다.
- 입력 섹션을 업무형 폼처럼 구분했다.

### 문서

- `docs/plans/plan-11-modern-ui-redesign.md`에 사용자 확정 답변과 1차/2차 구현 범위를 반영했다.
- Step 문서와 PR 문서를 추가했다.

## 변경 파일

```text
docs/plans/plan-11-modern-ui-redesign.md
docs/steps/2026-06-06-11-modern-ui-redesign.md
docs/pr/2026-06-06-11-modern-ui-redesign-pr.md
frontend/src/App.jsx
frontend/src/style.css
frontend/src/components/EmptyState.jsx
frontend/src/components/Header.jsx
frontend/src/components/CarCardGrid.jsx
frontend/src/components/CarDetail.jsx
frontend/src/components/LoginForm.jsx
frontend/src/components/RegisterForm.jsx
frontend/src/components/CarForm.jsx
```

## 보존된 항목

| 항목 | 내용 |
| --- | --- |
| Express API | 변경 없음 |
| Firebase Auth | 변경 없음 |
| Socket.io 이벤트 | 변경 없음 |
| MongoDB 컬렉션 | 변경 없음 |
| Render 환경변수 | 변경 없음 |
| 신규 패키지 | 없음 |

## Placeholder 파일명

| 용도 | 파일명 |
| --- | --- |
| 차량 이미지 미등록 | `uploads/default-car.png` |
| 차량 등록/수정 폼 업로드 유도 | `uploads/car-upload-placeholder.png` |

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

2차 개선에서 상담방 목록, 실시간 상담 화면, 딜러 관리 화면, 관리자 대시보드, 모바일 하단 내비게이션, 아이콘 패키지 도입 여부를 별도로 검토한다.
