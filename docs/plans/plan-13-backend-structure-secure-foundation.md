# 13단계 백엔드 구조 분리와 보안 기반 리팩토링 계획

## 1. 문서 목적

고도화 기능 추가는 잠시 미루고, 현재 루트에 모여 있는 Express 백엔드 구조를 정리한 뒤 시큐어 코딩을 적용하기 위한 작업 방향을 정리한다.

현재 프로젝트는 Render Web Service 단일 배포를 유지하기 위해 루트 `server.js`에서 API, 정적 파일 제공, 업로드, Socket.io, 권한 확인, 상담 메시지 처리까지 담당하고 있다.
이 구조는 초기 과제 범위에서는 단순했지만 MongoDB, Firebase Authentication, 차량 사진 업로드, Socket.io 상담, 관리자 기능이 붙으면서 파일이 커졌고, 보안 보강을 안전하게 적용하기 어려운 상태가 되었다.

이번 계획의 핵심은 배포 구조를 갑자기 분리하지 않고, 단일 Render Web Service 배포를 유지한 채 백엔드 코드의 폴더 경계와 모듈 책임을 먼저 정리하는 것이다.

## 2. 현재 작업 상태

| 항목           | 내용                                           |
| -------------- | ---------------------------------------------- |
| 현재 브랜치    | `refactor/backend-structure-secure-foundation` |
| 추천 브랜치    | `refactor/backend-structure-secure-foundation` |
| 미커밋 변경    | 계획 작성 전 기준 없음                         |
| 작업 성격      | 구조 리팩토링 준비, 시큐어 코딩 기반 정리      |
| 코드 수정 여부 | 이 문서 작성 단계에서는 코드 수정 없음         |
| 배포 방향      | 1차는 Render Web Service 단일 배포 유지        |

## 3. 확인한 문서와 파일

| 구분        | 확인 대상                                          | 확인 내용                                                                       |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| 저장소 규칙 | `AGENTS.md`                                        | 중간 이상 작업은 계획 문서 작성 후 사용자 확인 필요                             |
| 진행 기록   | `docs/progress.md`                                 | MongoDB, Firebase, 업로드, Socket.io, 관리자, UI 고도화까지 구현된 상태 확인    |
| 배포 문서   | `docs/deploy-guide.md`                             | 루트 Express + `frontend` React + Render 단일 Web Service 구조 확인             |
| 배포 점검   | `docs/deploy-checklist.md`                         | Build Command, Start Command, API 경로, 업로드 경로 기준 확인                   |
| CI/CD       | `.github/workflows/deploy.yml`                     | 루트 의존성, `frontend` 의존성 설치 후 루트 빌드와 Render Deploy Hook 호출 확인 |
| 루트 설정   | `package.json`                                     | `start: node backend/server.js`, `build: frontend` 빌드 실행 구조 확인          |
| 프론트 설정 | `frontend/package.json`, `frontend/vite.config.js` | Vite 빌드, `/api` 프록시, 루트 `.env` 읽기 설정 확인                            |
| 백엔드 코드 | `server.js`, `db.js`                               | API, Socket.io, 업로드, 정적 파일 제공, DB 연결이 루트 파일에 집중됨            |

## 4. 현재 구조 요약

| 영역            | 현재 위치               | 역할                                                  |
| --------------- | ----------------------- | ----------------------------------------------------- |
| Express 서버    | `backend/server.js`     | API 라우터, Socket.io, 정적 파일 제공, 서버 시작 처리 |
| MongoDB 연결    | `backend/db.js`         | MongoDB Atlas 연결과 컬렉션 이름 관리                 |
| 백엔드 설정     | `backend/config/`       | 경로 계산과 업로드 설정 관리                          |
| React 앱        | `frontend/`             | Vite React 프론트엔드                                 |
| React 빌드 결과 | `frontend/dist/`        | Express가 배포 환경에서 정적 파일로 제공              |
| 업로드 파일     | `uploads/`              | `multer` 저장 파일과 기본 placeholder 이미지          |
| 루트 package    | `package.json`          | 백엔드 의존성과 배포용 통합 빌드/시작 스크립트        |
| 프론트 package  | `frontend/package.json` | 프론트엔드 의존성과 Vite 스크립트                     |

## 5. 구조상 문제 판단

현재 `server.js`가 두꺼워진 이유는 백엔드 폴더가 없기 때문만은 아니다.
더 직접적인 원인은 기능이 추가될 때마다 다음 책임들이 같은 파일에 계속 누적됐기 때문이다.

| 누적된 책임    | 현재 문제점                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| API 라우터     | 차량, 사용자, 상담 API가 같은 파일에 있어 변경 범위가 커짐                   |
| 인증/권한 확인 | 딜러, 관리자, 차량 소유자 검증 함수가 라우터와 섞여 있음                     |
| 업로드 처리    | `multer` 설정, `/uploads` 정적 경로, 이미지 URL 생성이 서버 시작 코드와 섞임 |
| Socket.io      | 실시간 이벤트, 딜러 온라인 상태, 메시지 저장이 REST API와 한 파일에 있음     |
| AI Agent 준비  | 상담 context helper와 placeholder가 Socket.io 처리 흐름과 섞여 있음          |
| 에러 응답      | 라우터마다 비슷한 `try/catch`와 응답 문구가 반복됨                           |
| 정적 파일 제공 | React fallback과 API 등록 순서가 서버 구조 변경 시 실수하기 쉬움             |

## 6. 배포 설정 영향 판단

### 6.1 단일 Render 배포를 유지하며 `backend/`를 만드는 경우

이 방식은 배포 설정 변경이 크지 않다.
루트에서 Render Web Service를 계속 실행하고, 백엔드 진입 파일 경로와 내부 상대 경로만 보정하면 된다.

| 항목                | 예상 변경                                                                               |
| ------------------- | --------------------------------------------------------------------------------------- |
| 루트 `package.json` | `start`를 `node backend/server.js` 또는 `node backend/src/server.js`로 변경             |
| 서버 정적 경로      | `frontend/dist` 경로를 백엔드 폴더 기준에서 루트 기준으로 보정                          |
| 업로드 경로         | `uploads/`를 루트에 유지할지 `backend/uploads/`로 옮길지 결정 필요                      |
| DB 연결 경로        | `require("./db")`를 이동 위치에 맞게 조정                                               |
| 검증 명령           | `node --check server.js`를 새 서버 파일 경로로 변경                                     |
| 문서                | README, 배포 가이드, 체크리스트의 루트 Express 설명을 갱신                              |
| CI/CD               | 루트 빌드 흐름은 유지 가능. 필요 시 캐시 경로와 check 명령만 보정                       |
| Render 설정         | Root Directory, Build Command는 유지 가능. Start Command는 스크립트 유지 시 변경 불필요 |

### 6.2 `frontend/`, `backend/` 각각 package를 분리하는 경우

이 방식은 구조는 더 명확하지만 배포 설정 변경이 커진다.
리팩토링, 패키지 구조 변경, 배포 문서 변경이 한 작업에 섞이므로 1차 작업으로는 권장하지 않는다.

| 항목           | 예상 변경                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| package 구조   | `backend/package.json`, `backend/package-lock.json` 추가 또는 재생성 필요 |
| 루트 package   | workspace 또는 통합 스크립트 전용으로 역할 재정의 필요                    |
| GitHub Actions | cache dependency path와 설치 명령을 `backend`, `frontend` 기준으로 변경   |
| Render Build   | `npm ci --prefix backend`, `npm ci --prefix frontend` 등으로 변경 가능    |
| Render Start   | `npm start --prefix backend` 또는 루트 통합 스크립트로 변경 필요          |
| 환경변수       | 루트 `.env`, Vite `envDir`, Render Environment 설명 재검토 필요           |
| CORS/Socket.io | 분리 배포까지 진행하면 `CLIENT_URL`, `VITE_API_BASE_URL` 설정이 중요해짐  |
| 문서           | README, 배포 가이드, 체크리스트, 진행 기록 전반 갱신 필요                 |

## 7. 권장 방향

이번 단계에서는 6.1 방식을 우선한다.

1. Render Web Service 단일 배포를 유지한다.
2. 백엔드 코드를 `backend/` 아래로 이동하되 루트 통합 `package.json`은 유지한다.
3. `server.js` 내부 책임을 라우터, 서비스, 미들웨어, Socket.io 핸들러, 업로드 설정으로 나눈다.
4. 기능 동작과 API 경로, Socket.io 이벤트 이름, MongoDB 컬렉션 구조는 변경하지 않는다.
5. 구조가 안정된 뒤 Firebase Admin 기반 서버 인증 검증과 권한 미들웨어를 도입한다.

이렇게 하면 배포 설정 변경을 최소화하면서도 시큐어 코딩을 적용할 수 있는 기반을 만들 수 있다.

## 8. 1차 예상 폴더 구조

아래 구조는 1차 리팩토링의 제안안이다.
실제 구현 시 기존 코드 의존성을 확인하면서 과하게 쪼개지 않도록 조정한다.

```text
backend/
  server.js
  db.js
  config/
    paths.js
    upload.js
  middleware/
    errorHandlers.js
  routes/
    cars.routes.js
    users.routes.js
    chats.routes.js
  services/
    cars.service.js
    users.service.js
    chats.service.js
    dealerPresence.service.js
    agent.service.js
  sockets/
    chat.socket.js
  utils/
    ids.js
    validation.js
frontend/
uploads/
package.json
```

## 9. 1차 리팩토링 범위

| 범위           | 작업 방향                                                                       |
| -------------- | ------------------------------------------------------------------------------- |
| 서버 진입 파일 | Express 앱 생성, middleware 등록, 라우터 등록, React fallback, 서버 시작만 담당 |
| DB 연결        | 기존 `db.js`를 `backend/db.js`로 이동하고 컬렉션 helper 유지                    |
| 경로 설정      | `frontend/dist`, `uploads` 경로를 `config/paths.js`에서 관리                    |
| 업로드 설정    | `multer` storage, 파일 크기, 확장자, MIME 제한을 `config/upload.js`로 분리      |
| 라우터         | `/api/cars`, `/api/users`, `/api/chats`, 기존 `/cars` 호환 라우트 분리          |
| 서비스         | DB 조회/수정, 권한 확인, 상담 메시지 처리 로직을 라우터 밖으로 이동             |
| Socket.io      | `join-room`, `send-message`, `leave-room`, `disconnect` 이벤트 등록 분리        |
| 에러 처리      | 업로드 에러와 일반 API 에러 응답 helper를 공통화                                |

## 10. 이번 단계에서 변경하지 않는 항목

| 항목                   | 이유                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| Render 분리 배포       | 배포 구조 변경이 커지므로 1차에서는 단일 Web Service 유지          |
| API 경로               | 프론트엔드와 문서가 `/api/*` 상대 경로 기준으로 맞춰져 있음        |
| Socket.io 이벤트 이름  | 요구사항의 이벤트 이름을 유지해야 함                               |
| MongoDB 컬렉션 구조    | 구조 리팩토링 작업이므로 데이터 구조 변경 불필요                   |
| Firebase 프로젝트 설정 | 사용자 확인이 필요한 외부 설정 변경이므로 이번 범위에서 제외       |
| 환경변수 이름 변경     | Render Environment 재설정이 필요할 수 있으므로 사용자 확인 전 제외 |
| 외부 이미지 스토리지   | 업로드 저장소 변경은 별도 운영/보안 판단이 필요한 큰 작업          |
| 새 npm 패키지          | 구조 분리 자체에는 새 패키지가 필요하지 않음                       |

## 11. 시큐어 코딩 후속 방향

구조 분리 후 다음 순서로 보안 보강을 진행한다.

| 우선순위 | 보안 작업                  | 방향                                                                            |
| -------- | -------------------------- | ------------------------------------------------------------------------------- |
| 1        | 서버 측 Firebase 인증 검증 | Firebase ID Token을 서버에서 검증하고 `uid`를 요청 body/query에서 신뢰하지 않음 |
| 2        | 권한 미들웨어 도입         | `requireAuth`, `requireDealer`, `requireAdmin`, `requireCarOwner` 형태로 정리   |
| 3        | Socket.io 인증 보강        | 연결 또는 room 입장 시 인증 토큰 검증 후 참여자 여부 확인                       |
| 4        | 입력값 검증 강화           | 차량, 사용자, 상담 메시지, 검색 조건의 타입/길이/범위 검증을 공통화             |
| 5        | 업로드 보안 보강           | 기존 확장자/MIME/크기 제한 유지, 파일명과 정적 제공 범위 재점검                 |
| 6        | 에러 응답 정리             | 내부 스택, 환경변수, DB 접속 정보가 응답에 노출되지 않도록 공통 처리            |
| 7        | CORS와 요청 크기 제한      | 단일 배포 기준과 분리 배포 가능성을 나눠 설정                                   |

현재 가장 큰 보안 리스크는 클라이언트가 보낸 `uid`, `dealerId`, `requesterUid`를 서버가 직접 신뢰하는 흐름이다.
따라서 구조 분리 후 첫 번째 시큐어 코딩 작업은 Firebase Admin SDK 또는 검증 가능한 서버 인증 흐름을 도입하는 것이 적절하다.

## 12. 예상 수정 파일

1차 구현 시 예상되는 주요 변경 파일은 다음과 같다.

| 파일 또는 경로                 | 예상 변경                                                        |
| ------------------------------ | ---------------------------------------------------------------- |
| `server.js`                    | `backend/server.js` 또는 `backend/src/server.js`로 이동/축소     |
| `db.js`                        | `backend/db.js` 또는 `backend/src/db.js`로 이동                  |
| `backend/config/*`             | 경로, 업로드 설정 분리                                           |
| `backend/routes/*`             | 차량, 사용자, 상담 API 라우터 분리                               |
| `backend/services/*`           | DB 처리, 권한 확인, 상담 메시지, 딜러 온라인 상태 처리 분리      |
| `backend/sockets/*`            | Socket.io 상담 이벤트 등록 분리                                  |
| `backend/middleware/*`         | 에러 처리와 향후 인증/권한 미들웨어 자리 마련                    |
| `backend/utils/*`              | ID, 숫자, 문자열 정규화와 검증 helper 분리                       |
| `package.json`                 | `start`, 필요 시 `build` 스크립트의 서버 진입 경로 보정          |
| `.github/workflows/deploy.yml` | 필요 시 검증 경로 또는 cache path 보정. 단 배포 방식 변경은 지양 |
| `README.md`                    | 백엔드 폴더 구조와 실행 방법 갱신                                |
| `docs/deploy-guide.md`         | Render 단일 배포 유지하되 서버 파일 위치 변경 반영               |
| `docs/deploy-checklist.md`     | 새 구조 기준 빌드/시작/검증 항목 갱신                            |
| `docs/progress.md`             | 구현 완료 후 진행 기록 추가                                      |
| `docs/steps/*`                 | 구현 완료 상세 문서 추가                                         |
| `docs/pr/*`                    | PR 요약 문서 추가                                                |

## 13. 작업 순서

1. 사용자가 추천 브랜치로 전환한다.
2. 계획 문서를 기준으로 1차 범위가 단일 Render 배포 유지인지 다시 확인한다.
3. `backend/` 폴더를 만들고 `server.js`, `db.js`를 이동한다.
4. 루트 `package.json`의 `start` 경로와 필요한 검증 명령을 보정한다.
5. `frontend/dist`, `uploads` 경로가 새 위치에서도 같은 동작을 하도록 보정한다.
6. 서버 시작, 정적 파일 제공, API 라우터 등록, React fallback 순서를 유지한다.
7. 차량/사용자/상담 라우터를 파일 단위로 분리한다.
8. 업로드 설정과 업로드 에러 처리를 분리한다.
9. Socket.io 상담 이벤트와 딜러 온라인 상태 처리를 분리한다.
10. AI Agent placeholder와 상담 context helper를 서비스 파일로 분리한다.
11. 중간마다 `node --check`로 이동한 서버 파일 문법을 확인한다.
12. `npm.cmd --prefix frontend run build`, `npm.cmd run build`를 실행한다.
13. 구현 완료 후 README, 배포 문서, 체크리스트, progress, step, PR 문서를 갱신한다.

## 14. 리스크와 대응

| 리스크                                                       | 대응                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| React 정적 파일 경로가 깨질 수 있음                          | `frontend/dist` 경로를 `paths.js`에서 명확히 계산하고 루트 빌드로 검증               |
| `/uploads` 경로가 달라져 이미지가 404가 될 수 있음           | 1차에서는 루트 `uploads/`를 유지하고 Express static 경로만 새 위치 기준으로 보정     |
| API 등록 순서가 바뀌어 React fallback이 API를 가로챌 수 있음 | `/api/*`, `/uploads`, 정적 파일, fallback 순서를 유지                                |
| Socket.io 이벤트가 분리 중 누락될 수 있음                    | 요구사항 이벤트 이름 목록 기준으로 검색 검증                                         |
| 배포 스크립트 변경으로 Render 시작이 실패할 수 있음          | 루트 `npm start` 명령은 유지하고 내부 진입 파일 경로만 변경                          |
| 리팩토링 중 보안 기능 변경까지 섞일 수 있음                  | 1차는 구조와 책임 분리에 집중하고 Firebase Admin 도입은 다음 시큐어 코딩 단계로 분리 |
| 기존 문서와 실제 구조가 달라질 수 있음                       | README, deploy-guide, deploy-checklist를 구현 완료 시 함께 갱신                      |

## 15. 검증 기준

| 검증             | 기준                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| 서버 문법 확인   | 이동한 서버 JS 파일과 주요 분리 파일에 대해 `node --check` 성공                                      |
| 프론트엔드 빌드  | `npm.cmd --prefix frontend run build` 성공                                                           |
| 루트 빌드        | `npm.cmd run build` 성공                                                                             |
| API 경로         | `/api/cars`, `/api/users`, `/api/chats`, 기존 `/cars` 호환 라우트 유지                               |
| 정적 파일        | Express가 `frontend/dist`와 `/uploads`를 기존처럼 제공                                               |
| Socket.io 이벤트 | `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline` 유지 |
| 문서             | README, 배포 가이드, 배포 체크리스트가 새 구조 기준과 일치                                           |

## 16. 이번 계획의 결론

13단계는 보안 기능을 바로 추가하는 단계가 아니라, 시큐어 코딩을 안전하게 적용하기 위한 백엔드 구조 기반을 만드는 단계다.

현재 배포가 이미 Render Web Service 단일 구조로 맞춰져 있으므로, 1차에서는 분리 배포나 완전한 `frontend/backend` 독립 package 구조로 바로 가지 않는다.
대신 백엔드 코드를 `backend/` 아래로 정리하고, 루트 통합 빌드와 시작 명령은 유지해 배포 영향도를 낮춘다.

구조 분리 이후에는 Firebase ID Token 검증, 권한 미들웨어, Socket.io 인증 보강, 입력값 검증 강화 순서로 시큐어 코딩을 진행하는 것이 가장 안정적이다.
