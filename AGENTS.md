# AGENTS.md

실시간 Car Market 프로젝트에서 AI 개발 에이전트가 따라야 할 저장소 기준 안내서입니다. 길게 설명하기보다, 작업 중 판단 기준이 되는 규칙만 둡니다.

## 프로젝트 기준

- 현재 프로젝트는 React + Vite 프론트엔드와 Node.js + Express 백엔드로 구성합니다.
- 배포는 현재 구조를 유지해 Render Web Service 단일 배포를 우선합니다.
- GitHub Actions는 빌드 성공 후 Render Deploy Hook을 호출하는 CI/CD 흐름을 사용합니다.
- 신규 요구사항 기준 데이터 저장소는 MongoDB Atlas입니다.
- 인증은 Firebase Authentication을 사용하고, 추가 사용자 정보는 MongoDB `users` 컬렉션에 저장합니다.
- 실시간 상담은 Socket.io를 사용하고, 상담방과 메시지는 MongoDB에 저장합니다.
- 차량 사진 업로드는 1차 구현에서 `multer`와 Express `/uploads` 정적 경로를 사용합니다.
- Render 무료 환경에서는 업로드 파일이 영구 보관되지 않을 수 있으므로 README와 배포 문서에 명시합니다.
- UI는 순수 Tailwind CSS 기반 커스텀 UI를 지향하며, daisyUI class와 패키지는 UI 대체 후 제거합니다.

## 작업 전 확인 문서

새 기능, 수정, 리뷰를 시작하기 전에 필요한 범위에서 아래 문서를 확인합니다.

1. `docs/실시간_Car_Market_서비스_요구사항_정의서.md`
2. `docs/실시간_Car_Market_향후_개발_계획서.md`
3. `docs/실시간_Car_Market_UI_개선_분석_보고서.md`
4. `docs/requirements.md`
5. `docs/progress.md`
6. `docs/deploy-guide.md`
7. `docs/deploy-checklist.md`
8. `.github/workflows/deploy.yml`

문서와 실제 코드 또는 `package.json`이 다르면, 코드와 실제 스크립트를 확인한 뒤 차이를 사용자에게 짧게 알립니다.

## 작업 규모 기준

- 작은 수정은 별도 계획 문서 없이 진행할 수 있습니다.
  - 예: 오타, 문구, 단순 CSS, 명백한 lint 오류, 단일 파일의 작은 버그
- 중간 이상 작업은 코드 수정 전 기존 개발 계획 문서를 갱신하거나 작업 계획을 짧게 작성합니다.
  - 예: API 흐름, 컴포넌트 구조, 주요 UX, 서버 로직 변경
- 큰 작업은 반드시 사용자 확인 후 진행합니다.
  - 예: DB 구조, 환경변수, 외부 API, 배포 구조, 인증 흐름, Socket.io 이벤트, 관리자 기능 범위 변경

기본 흐름은 요구사항 요약, `git status` 확인, 관련 문서 확인, 구현, 검증, 변경 요약 순서입니다. `git commit`, `git push`는 사용자가 직접 진행합니다.

## 코드 작업 워크플로우

1. 요구사항과 최종 목표를 요약합니다.
2. 현재 브랜치와 미커밋 변경 상태를 확인합니다.
3. 관련 요구사항 문서와 개발 계획 문서를 확인합니다.
4. 중간 이상 작업이면 문서를 먼저 갱신하거나 계획을 사용자에게 공유합니다.
5. 사용자 확인이 필요한 항목이 없으면 구현을 진행합니다.
6. 가능한 범위에서 빌드, 문법 검사, 핵심 API 호출을 검증합니다.
7. 변경된 파일, 검증 결과, 남은 리스크를 정리합니다.
8. 마지막에 한글 Conventional Commit 메시지를 제목과 내용까지 제안합니다.

사용자 승인 없이 하지 않습니다.

- 실제 `git commit`, `git push`
- DB 데이터 삭제 또는 초기화
- MongoDB 컬렉션 구조의 큰 변경
- Firebase 프로젝트 설정 변경
- Render Secret 또는 GitHub Secret 변경
- 배포 구조를 Web Service 단일 배포에서 분리 배포로 변경
- 대규모 UI 방향 변경

## 구현 규칙

- React 코드는 함수형 컴포넌트와 Hooks를 사용합니다.
- 함수, 변수 이름은 이름만 보아도 알 수 있도록 쉽고 명확하게 작성합니다.
- API 호출 경로는 프론트엔드에서 `/api/*` 상대 경로를 우선 사용합니다.
- Express API는 신규 요구사항 기준으로 `/api/cars`, `/api/users`, `/api/chats` 구조를 우선합니다.
- MongoDB 연결은 요구사항에 맞춰 `MongoClient`를 우선 사용합니다.
- Firebase Authentication의 UID를 사용자 식별 기준으로 사용합니다.
- 사용자 역할 값은 `buyer`, `dealer`를 그대로 사용합니다. 관리자 기능이 필요하면 `admin` 역할 추가를 문서화합니다.
- 차량 등록과 수정은 딜러 권한을 기준으로 제한합니다.
- Socket.io 이벤트 이름은 요구사항의 `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline`을 유지합니다.
- AI Agent 확장을 위해 상담 메시지 처리 로직은 별도 함수로 분리합니다.

## UI 구현 규칙

- 첫 화면은 차량 목록과 검색 중심으로 구성합니다.
- 일반 사용자 차량 목록은 이미지 중심 카드형 UI로 구성합니다.
- 딜러/관리자 관리 화면은 테이블형 UI를 우선합니다.
- 관리자 화면은 사이드바 우선이며, UX가 좋아지는 경우 상단 탭도 함께 사용할 수 있습니다.
- 다크 모드는 1차 구현에 포함하지 않습니다.
- 이미지가 없는 차량은 기본 placeholder 이미지를 사용합니다.
- placeholder 이미지가 필요하면 사용자가 제공한 프롬프트를 바탕으로 이미지 전용 생성 도구로 생성한 뒤 적용합니다.
- daisyUI 느낌을 제거합니다.
- `btn`, `card`, `input`, `select`, `badge`, `navbar`, `stats`, `alert`, `modal` 같은 daisyUI class는 순수 Tailwind CSS class로 대체합니다.
- daisyUI class 대체가 끝나면 `frontend/tailwind.config.js`, `frontend/package.json`, `frontend/package-lock.json`에서 daisyUI 설정과 패키지를 제거합니다.
- UI 변경 시 모바일 375px부터 데스크톱 1280px 이상까지 레이아웃을 고려합니다.

## 패키지와 구조 변경 규칙

- 새 npm 패키지는 사용자 요청 또는 구현상 필요가 명확한 경우에만 추가합니다.
- Firebase, MongoDB, Socket.io, multer처럼 요구사항에 포함된 패키지는 구현 단계에서 추가할 수 있습니다.
- 상태 관리 라이브러리, 라우팅 구조, 폴더 구조, API 응답 형식은 사용자 요청 없이 대규모로 변경하지 않습니다.
- 기존 코드 스타일을 우선 따르며, 기능 변경과 전체 포맷팅을 한 작업에 섞지 않습니다.
- 불필요한 리팩터링을 하지 않습니다.
- 사용하지 않는 파일 삭제는 명백한 경우가 아니면 사용자 확인 후 진행합니다.

## 수정 전 사용자 확인이 필요한 항목

- `.env`, `.env.example`, 환경변수 이름 변경
- GitHub Actions workflow의 배포 방식 변경
- Render Web Service 단일 배포 구조 변경
- GitHub Secret 또는 Render Secret 변경
- Firebase 프로젝트 생성, 앱 등록, 인증 제공자 설정 변경
- MongoDB Atlas 데이터 삭제, 초기화, 컬렉션 구조 대규모 변경
- Socket.io 이벤트 이름 변경
- API 경로 변경
- 외부 이미지 스토리지 도입
- OpenAI 등 실제 AI Agent API 연동
- 관리자 권한 정책 변경
- 대규모 UI 방향 변경

## 보안 기준

- 클라이언트 코드에 DB 접속 문자열, 서버 비밀값, 외부 API Secret을 넣지 않습니다.
- Firebase Web config는 공개 가능한 식별 정보이지만, 보안 규칙과 서버 Secret은 별도로 관리합니다.
- MongoDB 쿼리는 입력값을 검증한 뒤 구성합니다.
- 서버 입력값은 필요한 범위에서 검증합니다.
- 업로드 파일은 파일 크기와 확장자를 검증합니다.
- 에러 응답에 내부 스택 트레이스, DB 접속 문자열, 환경변수 값을 노출하지 않습니다.
- `.env` 파일은 커밋하지 않습니다.

## 문서 작성 규칙

- 기능 변경 후 관련 문서를 필요한 범위에서 갱신합니다.
- 한글 문서는 UTF-8 인코딩을 유지합니다.
- 기존 문서 내용을 삭제하기보다, 필요한 경우 보정 기록이나 확정 방향을 추가합니다.
- 신규 개발 계획은 현재 문서 체계에 맞춰 `docs/` 아래 한글 제목의 Markdown 파일로 작성합니다.
- 배포, 환경변수, 실행 방법이 바뀌면 `README.md`, `docs/deploy-guide.md`, `docs/deploy-checklist.md`를 함께 점검합니다.

## 검증 기준

가능한 범위에서 아래 검증을 실행하고 결과를 보고합니다.

- 루트 빌드: `npm.cmd run build`
- 서버 실행: `npm.cmd start`
- 프론트엔드 개발 서버: `npm.cmd --prefix frontend run dev`
- 프론트엔드 빌드: `npm.cmd --prefix frontend run build`
- 서버 문법 확인: 수정한 서버 JS 파일에 대해 `node --check <file>`
- API 확인: 필요한 엔드포인트를 `curl` 또는 브라우저로 확인

검증 실패 시 실패 로그의 핵심 원인, 수정 여부, 남은 문제를 구분해서 보고합니다. 검증을 실행하지 못한 경우에는 이유와 남은 리스크를 명확히 적습니다.

## 커뮤니케이션 규칙

- 답변은 기본적으로 한국어로 작성합니다.
- 초보 개발자가 이어서 작업할 수 있도록 용어를 풀어서 설명합니다.
- 요구사항이 복잡하면 분석, 질문, 계획, 구현, 검증 순서로 단계를 나눕니다.
- 데이터 삭제, DB 구조 변경, 배포 구조 변경, 외부 API 추가는 반드시 질문합니다.
- UI 문구, 작은 CSS 조정, 명백한 버그 수정은 합리적으로 판단해 진행하고 결과에 이유를 남깁니다.
- 마지막에 한글 Conventional Commit 메시지를 제목과 내용까지 함께 제안합니다.
- `git commit`, `git push`는 사용자가 직접 진행합니다.

## 커밋 메시지 예시

제목:

```text
feat: 실시간 차량 상담 기능 추가
```

내용:

```text
- Socket.io 기반 상담방 입장과 메시지 송수신을 구현한다.
- 상담 메시지를 MongoDB messages 컬렉션에 저장한다.
- 상담방 목록 화면과 이전 메시지 조회 API를 추가한다.
- Render 배포 문서와 Socket.io 이벤트 목록을 갱신한다.
```
