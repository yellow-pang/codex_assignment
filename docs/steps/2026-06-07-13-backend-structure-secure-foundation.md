# 2026-06-07 13단계 백엔드 구조 분리와 보안 기반 리팩토링 상세 설명

## 이 문서의 목표

이번 단계에서는 고도화 기능 추가를 잠시 멈추고, 시큐어 코딩을 적용하기 전에 백엔드 파일 위치와 배포 기준 경로를 정리했다.

기존에는 루트 `server.js`와 `db.js`가 Express API, MongoDB 연결, 업로드, Socket.io, React 정적 파일 제공을 담당했다.
이번 작업은 Render Web Service 단일 배포 구조를 유지하면서 서버 코드를 `backend/` 아래로 옮기고, 경로와 업로드 설정을 분리하는 데 집중했다.

## 한 줄 요약

루트 통합 `package.json`과 Render 단일 배포는 유지하고, 서버 진입 파일을 `backend/server.js`로 이동해 보안 리팩토링을 위한 백엔드 경계를 만들었다.

## 변경한 파일 요약

| 파일                                                        | 변경 내용                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `backend/server.js`                                         | 기존 루트 `server.js` 이동, 루트 기준 `frontend/dist`, `uploads`, `.env` 경로 보정 |
| `backend/db.js`                                             | 기존 루트 `db.js` 이동                                                             |
| `backend/config/paths.js`                                   | 루트, React 빌드 결과, 업로드 경로 계산 분리                                       |
| `backend/config/upload.js`                                  | `multer` 설정, 파일 크기/확장자/MIME 제한, 업로드 에러 처리 분리                   |
| `package.json`                                              | `main`, `start`를 `backend/server.js` 기준으로 변경                                |
| `README.md`                                                 | 서버 진입 파일과 단일 Render 배포 유지 내용을 갱신                                 |
| `docs/deploy-guide.md`                                      | `backend` Express + `frontend` React + 루트 통합 package 구조로 보정               |
| `docs/deploy-checklist.md`                                  | 새 서버 경로와 검증 명령 기준으로 갱신                                             |
| `docs/실시간_Car_Market_향후_개발_계획서.md`                | 백엔드 확인 대상 경로를 새 구조로 보정                                             |
| `docs/plans/plan-13-backend-structure-secure-foundation.md` | 백엔드 구조 분리와 후속 보안 작업 계획 추가                                        |

## 주요 변경 내용

### 백엔드 폴더 분리

- 기존 루트 `server.js`를 `backend/server.js`로 이동했다.
- 기존 루트 `db.js`를 `backend/db.js`로 이동했다.
- 루트 `package.json`은 유지해 Render Build Command와 Start Command의 외부 형태가 바뀌지 않도록 했다.
- `npm start`는 내부적으로 `node backend/server.js`를 실행한다.

### 경로 설정 분리

- `backend/config/paths.js`를 추가했다.
- `backend/server.js`가 백엔드 폴더 안에 있어도 루트 `frontend/dist`를 정적 파일로 제공할 수 있게 했다.
- 업로드 파일은 기존처럼 루트 `uploads/`를 유지한다.
- `.env`는 루트 `.env`를 읽도록 경로를 보정했다.

### 업로드 설정 분리

- `backend/config/upload.js`를 추가했다.
- 기존 `multer` storage, 파일 크기 제한, 확장자 제한, MIME 제한을 유지했다.
- 이미지 URL 생성과 업로드 에러 처리도 업로드 설정 모듈로 이동했다.
- `/uploads` 정적 경로와 MongoDB에 저장되는 `/uploads/파일명` 형식은 변경하지 않았다.

### 배포 구조 유지

- Render Web Service 단일 배포 구조는 변경하지 않았다.
- Render Build Command는 기존 `npm install && npm run build` 기준을 유지한다.
- Render Start Command는 기존 `npm start` 기준을 유지한다.
- GitHub Actions workflow는 루트 통합 스크립트 기준으로 계속 동작하므로 수정하지 않았다.

## 보존한 항목

| 항목             | 내용                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| API 경로         | `/api/cars`, `/api/users`, `/api/chats`, 기존 `/cars` 유지                                           |
| Socket.io 이벤트 | `join-room`, `send-message`, `receive-message`, `leave-room`, `dealer-online`, `dealer-offline` 유지 |
| MongoDB 컬렉션   | `cars`, `users`, `chat_rooms`, `messages` 구조 변경 없음                                             |
| 업로드 URL       | `/uploads/파일명` 유지                                                                               |
| Render 배포      | 단일 Web Service 유지                                                                                |
| package 분리     | `backend/package.json`은 만들지 않고 루트 package 유지                                               |
| 보안 기능        | Firebase Admin 인증 검증 도입은 다음 단계로 분리                                                     |

## 검증 결과

| 검증 항목                               | 결과 |
| --------------------------------------- | ---- |
| `node --check backend/server.js`        | 성공 |
| `node --check backend/db.js`            | 성공 |
| `node --check backend/config/paths.js`  | 성공 |
| `node --check backend/config/upload.js` | 성공 |
| `npm.cmd --prefix frontend run build`   | 성공 |
| `npm.cmd run build`                     | 성공 |

참고:

- 루트 빌드 중 frontend 의존성 moderate 취약점 2건이 보고되었다.
- Vite가 `.env`의 `NODE_ENV=production` 값을 경고하지만 빌드는 성공했다.
- 이번 단계에서는 실제 서버 기동과 API 호출 검증은 실행하지 않았다. 실제 `MONGODB_URI`와 포트 상태가 필요한 검증은 이후 환경이 준비된 상태에서 확인한다.

## 남은 확인

1. 실제 `MONGODB_URI`가 설정된 환경에서 `npm.cmd start`로 서버가 정상 시작하는지 확인한다.
2. Render 배포 후 `/`, `/api/cars`, `/uploads/default-car.png` 접근을 확인한다.
3. 다음 시큐어 코딩 단계에서 Firebase ID Token 서버 검증과 권한 미들웨어를 도입한다.
4. 필요하면 이후 단계에서 라우터와 서비스 파일을 더 세분화한다.
