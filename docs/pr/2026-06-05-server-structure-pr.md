# PR: 차량 API 서버 구조를 `/api/cars` 기준으로 정리

## PR 제목

```text
refactor: 차량 API 서버 구조를 /api/cars 기준으로 정리
```

## 작업 배경

`docs/실시간_Car_Market_향후_개발_계획서.md`의 1단계 서버 구조 정리 항목에 따라, MongoDB Atlas 연동 전 Express API 경로를 신규 요구사항 기준인 `/api/cars` 중심으로 정리했다.

기존 서버는 `/api` 접두사를 제거한 뒤 `/cars` 라우트로 우회하는 방식이었다. 이후 MongoDB, 사용자 API, 상담 API를 붙이려면 서버가 `/api/*` 구조를 직접 갖는 편이 더 명확하므로 자동차 API부터 구조를 정리했다.

## 변경 내용

- `server.js`에서 `/api` 접두사를 제거하던 우회 미들웨어를 삭제했다.
- 자동차 CRUD API를 `carsRouter`로 분리했다.
- `carsRouter`를 `/api/cars`에 직접 등록했다.
- 기존 `/cars` API는 다음 단계 전까지 호환용으로 유지했다.
- Vite 개발 프록시가 `/api` 경로를 그대로 백엔드에 전달하도록 수정했다.
- 1단계 작업 기록을 `docs/progress.md`와 `docs/steps/2026-06-05-01-server-structure.md`에 정리했다.

## 변경 파일

```text
server.js
frontend/vite.config.js
frontend/src/App.jsx
docs/progress.md
docs/steps/2026-06-05-01-server-structure.md
docs/pr/2026-06-05-server-structure-pr.md
```

## 검증

```text
node --check server.js
npm.cmd run build
```

검증 결과:

- `node --check server.js`: 성공
- `npm.cmd run build`: 성공
- 임시 서버 실행 후 API 호출 검증은 사용자 실행 승인 거절로 미진행

## 남은 리스크

- `/cars` 호환 라우트는 아직 남아 있다. 프론트엔드와 문서가 완전히 `/api/cars` 기준으로 정리된 뒤 제거 여부를 결정한다.
- 빌드 중 `frontend` 의존성 moderate 취약점 2건이 보고된다. 이번 PR 범위는 서버 구조 정리이므로 의존성 업데이트는 포함하지 않았다.
- daisyUI 제거는 UI 개편 단계에서 별도로 진행한다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서를 확인했다.
- [x] 서버 API를 `/api/cars` 기준으로 정리했다.
- [x] 기존 `/cars` 호출은 호환용으로 유지했다.
- [x] 빌드 검증을 실행했다.
- [x] 단계별 작업 기록 문서를 작성했다.
- [ ] PR 생성 전 사용자가 브랜치를 생성하고 커밋한다.

## 제안 커밋 메시지

```text
refactor: 차량 API 서버 구조를 /api/cars 기준으로 정리
```

```text
- Express 자동차 CRUD 라우트를 carsRouter로 분리한다.
- 신규 요구사항 기준에 맞춰 /api/cars 라우트를 직접 등록한다.
- 기존 /cars 라우트는 다음 단계 전까지 호환용으로 유지한다.
- Vite 개발 프록시가 /api 요청을 그대로 전달하도록 수정한다.
- 단계별 작업 기록과 PR 작성용 문서를 추가한다.
```

