# 작업 진행 기록

## Tailwind CSS와 daisyUI 기반 화면 개선

| 항목 | 내용 |
| --- | --- |
| 작업 단계명 | React CRUD 화면 UI 개선 |
| 작업 일자 | 2026-06-02 |
| 작업 내용 | Tailwind CSS와 daisyUI를 설정하고, 자동차 CRUD 화면을 목록, 등록, 수정, 상세, 삭제 모달 중심으로 개선 |
| 설치한 패키지 | `tailwindcss`, `postcss`, `autoprefixer`, `daisyui` |
| 수정한 주요 파일 | `frontend/package.json`, `frontend/package-lock.json`, `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/style.css`, `frontend/src/App.jsx` |
| 추가한 주요 파일 | `frontend/src/components/Header.jsx`, `frontend/src/components/AlertMessage.jsx`, `frontend/src/components/CarTable.jsx`, `frontend/src/components/CarForm.jsx`, `frontend/src/components/CarDetail.jsx`, `frontend/src/components/DeleteConfirmModal.jsx` |
| 확인한 명령어 | `npm install -D tailwindcss@3.4.17 postcss autoprefixer daisyui@4.12.24`, `npm run build` |

### 작업 내용

- Tailwind CSS 전역 지시어를 `frontend/src/style.css`에 적용했다.
- daisyUI 플러그인을 `frontend/tailwind.config.js`에 추가했다.
- 기존 단순 목록 화면을 navbar, stats, card, table, input, button, modal, alert 기반 UI로 개선했다.
- React Router 없이 현재 프로젝트 구조 안에서 목록, 등록, 수정, 상세 화면을 상태 기반으로 전환하도록 구성했다.
- 자동차 등록, 수정, 삭제 요청은 기존 Express API 경로를 유지해 `/api/cars` 프록시 경로로 호출하도록 정리했다.

### 다음 단계

1. Render 배포를 위한 Express 정적 파일 제공 구조 검토
2. GitHub Actions 빌드 워크플로우 작성
3. Render 배포 설정 및 배포 확인
4. 과제 제출용 README 실행 방법 보강

## Render 배포 전 구조 점검

| 항목 | 내용 |
| --- | --- |
| 작업 단계명 | Render 배포 전 프로젝트 구조 점검 |
| 작업 일자 | 2026-06-02 |
| 작업 내용 | Render 단일 Web Service 배포 기준으로 Express와 React 통합 구조를 점검하고 최소 설정 보완 |
| 설치한 패키지 | 없음 |
| 수정한 주요 파일 | `server.js`, `package.json`, `.env.example`, `docs/deploy-checklist.md`, `docs/progress.md` |
| 확인한 명령어 | `rg --files`, `type package.json`, `type frontend/package.json`, `type server.js`, `npm run build`, `PORT=3100 node server.js` |

### 작업 내용

- Express 서버 포트를 `process.env.PORT || 3000` 구조로 변경했다.
- React의 `/api` 요청이 배포 환경에서도 기존 Express API로 연결되도록 보완했다.
- `frontend/dist` 빌드 결과물을 Express가 정적 파일로 제공하도록 설정했다.
- Render Build Command에서 사용할 수 있도록 루트 `build` 스크립트를 추가했다.
- `.env.example`과 Render 배포 전 체크리스트 문서를 작성했다.
- 루트 빌드와 임시 포트 서버 실행을 확인했다.

### 다음 단계

1. Render Web Service 생성
2. Render Build Command와 Start Command 입력
3. 배포 후 React 화면과 `/api/cars` 응답 확인
4. GitHub Actions CI/CD 워크플로우 작성
