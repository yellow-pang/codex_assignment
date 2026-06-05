# Render 배포 및 GitHub Actions CI/CD 가이드

## 1. 프로젝트 배포 구조 요약

현재 프로젝트는 루트에 Express 서버가 있고, `frontend` 폴더에 Vite React 프로젝트가 있는 구조이다.

| 구분 | 위치 | 역할 |
| --- | --- | --- |
| Express API | `server.js` | 자동차 CRUD REST API 제공 |
| MongoDB 연결 | `db.js` | MongoDB Atlas 연결과 컬렉션 준비 |
| React 앱 | `frontend/` | 자동차 CRUD 화면 제공 |
| React 빌드 결과 | `frontend/dist/` | Express가 정적 파일로 제공 |
| CI/CD 설정 | `.github/workflows/deploy.yml` | 빌드 성공 후 Render Deploy Hook 호출 |

구조 판단 결과는 `루트 Express + frontend React 구조`이다.
과제용 배포 방식으로는 Render Web Service 하나에서 Express와 React를 함께 제공하는 방식을 추천한다.

## 2. Render 배포 방식 설명

Render에는 `Web Service` 하나를 생성한다.
빌드 단계에서는 React 앱을 빌드하고, 실행 단계에서는 Express 서버를 실행한다.
Express 서버는 `frontend/dist` 폴더를 정적 파일로 제공하므로 사용자는 Render URL에서 React 화면을 볼 수 있다.

React와 Express를 분리해서 React Static Site와 Express Web Service 두 개로 배포하는 방법도 가능하다.
하지만 과제용 프로젝트에서는 설정이 늘어나므로 단일 Web Service 방식이 더 단순하다.

## 3. GitHub Actions CI/CD 흐름 설명

`main` 브랜치에 push되거나 수동 실행하면 GitHub Actions가 다음 순서로 동작한다.

1. 소스 코드를 checkout한다.
2. Node.js 20을 설정한다.
3. 루트 의존성을 설치한다.
4. `frontend` 의존성을 설치한다.
5. 테스트 스크립트가 있으면 실행하고, 없으면 건너뛴다.
6. 루트 `npm run build`를 실행한다.
7. 빌드가 성공하면 Render Deploy Hook을 호출한다.

Deploy Hook URL은 코드에 직접 작성하지 않고 GitHub Secrets의 `RENDER_DEPLOY_HOOK_URL`에 등록한다.

## 4. 배포 전 로컬 확인 명령어

루트 폴더에서 다음 명령어를 실행한다.

```bash
npm install
npm run build
npm start
```

서버 실행 후 확인할 주소:

```text
http://localhost:3000
http://localhost:3000/api/cars
```

`/api/cars`에서 자동차 목록 JSON이 보이면 API 연결이 정상이다.

## 5. GitHub Push 전 확인사항

- `.env` 파일을 커밋하지 않는다.
- `.env.example`에는 실제 비밀값을 넣지 않는다.
- `npm run build`가 성공하는지 확인한다.
- `server.js`에서 `process.env.PORT`를 사용하고 있는지 확인한다.
- React 코드에서 `localhost` API 주소를 직접 호출하지 않는지 확인한다.
- GitHub Actions Secret 등록 전에는 Deploy Hook이 동작하지 않는다.

## 6. Render Web Service 생성 절차

1. Render에 로그인한다.
2. `New +` 버튼을 누른다.
3. `Web Service`를 선택한다.
4. GitHub 저장소를 연결한다.
5. 현재 프로젝트 저장소를 선택한다.
6. 아래 Render 설정값을 입력한다.
7. Deploy Hook URL을 생성해서 GitHub Secrets에 등록한다.
8. Auto-Deploy는 GitHub Actions와 중복될 수 있으므로 `Off`를 권장한다.

## 7. Render 설정값

| 항목 | 값 |
| --- | --- |
| Service Type | Web Service |
| Runtime | Node |
| Node Version | `20.19` 이상 |
| Branch | `main` |
| Root Directory | 비워둠 또는 루트 |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Publish Directory | 사용하지 않음 |
| Auto-Deploy | Off 권장 |

### Environment Variables

| 이름 | 값 | 설명 |
| --- | --- | --- |
| `NODE_ENV` | `production` | 배포 환경 표시 |
| `PORT` | Render 자동 제공 | Express 서버 포트 |
| `MONGODB_URI` | MongoDB Atlas 접속 문자열 | 서버에서만 사용하는 DB 접속 비밀값 |
| `MONGODB_DNS_SERVERS` | `1.1.1.1,8.8.8.8` | 로컬 또는 배포 환경에서 Atlas SRV DNS 조회가 막힐 때 선택적으로 사용 |
| `DB_NAME` | `car_market` | 사용할 MongoDB 데이터베이스 이름 |
| `COLLECTION_CARS` | `cars` | 차량 데이터 컬렉션 |
| `COLLECTION_USERS` | `users` | 사용자 추가 정보 컬렉션 |
| `COLLECTION_CHAT_ROOMS` | `chat_rooms` | 상담방 컬렉션 |
| `COLLECTION_MESSAGES` | `messages` | 상담 메시지 컬렉션 |
| `CLIENT_URL` | 로컬 또는 배포된 React 주소 | 이후 CORS와 Socket.io 설정에 사용할 클라이언트 주소 |

`PORT`는 Render가 자동으로 제공하므로 직접 입력하지 않아도 된다.
`MONGODB_URI`는 비밀값이므로 GitHub 저장소, 문서, 클라이언트 코드에 실제 값을 작성하지 않는다.

## 8. Render Deploy Hook 생성 방법

1. Render 서비스 상세 화면으로 이동한다.
2. `Settings` 메뉴를 연다.
3. `Deploy Hook` 항목을 찾는다.
4. Deploy Hook URL을 생성한다.
5. URL을 복사한다.
6. 이 URL은 비밀값이므로 코드나 문서에 실제 값을 작성하지 않는다.

## 9. GitHub Secrets 등록 방법

1. GitHub 저장소로 이동한다.
2. `Settings` 메뉴를 연다.
3. `Secrets and variables`를 선택한다.
4. `Actions`를 선택한다.
5. `New repository secret`을 클릭한다.
6. Name에 `RENDER_DEPLOY_HOOK_URL`을 입력한다.
7. Secret 값에 Render Deploy Hook URL을 붙여넣는다.
8. 저장한다.

## 10. GitHub Actions Workflow 설명

워크플로우 파일 위치:

```text
.github/workflows/deploy.yml
```

주요 설정:

| 항목 | 내용 |
| --- | --- |
| Workflow 이름 | `CI/CD Deploy to Render` |
| 실행 조건 | `main` 브랜치 push, 수동 실행 |
| Node 버전 | 20 |
| 설치 명령 | `npm ci`, `npm ci --prefix frontend` |
| 빌드 명령 | `npm run build` |
| 배포 명령 | `curl -fsSL -X POST "$RENDER_DEPLOY_HOOK_URL"` |

테스트 스크립트가 현재 없으므로 workflow는 테스트 단계를 자동으로 건너뛴다.

## 11. 배포 후 확인 방법

Render 배포가 끝나면 Render에서 제공하는 URL로 접속한다.

확인할 항목:

- React 자동차 관리 화면이 표시되는지 확인한다.
- `https://배포주소/api/cars`에서 자동차 목록 JSON이 응답되는지 확인한다.
- 자동차 등록, 수정, 삭제 버튼이 동작하는지 확인한다.
- 브라우저 새로고침 후 화면이 유지되는지 확인한다.
- Render Logs에 포트 또는 빌드 오류가 없는지 확인한다.

## 12. 자주 발생하는 오류와 해결 방법

| 오류 | 원인 | 해결 방법 |
| --- | --- | --- |
| `process.env.PORT` 누락 | Render가 제공한 포트를 사용하지 않음 | `const port = process.env.PORT || 3000` 사용 |
| `npm start` 없음 | Render Start Command가 실행할 스크립트 없음 | 루트 `package.json`에 `start` 추가 |
| React 빌드 경로 오류 | Express 정적 경로와 Vite 출력 경로가 다름 | `frontend/dist` 경로 확인 |
| localhost API 호출 문제 | 배포 환경에서 localhost는 사용자 PC가 아님 | React에서는 `/api/...` 상대 경로 사용 |
| 새로고침 시 404 | React fallback 설정 없음 | API 라우트 뒤에 `app.get("*")` fallback 배치 |
| 환경변수 누락 | Render 또는 GitHub Secrets에 값이 없음 | Render Environment와 GitHub Secrets 확인 |
| `MONGODB_URI 환경변수가 설정되지 않았습니다.` | 서버 실행 환경에 MongoDB 접속 문자열이 없음 | 로컬 `.env` 또는 Render Environment에 `MONGODB_URI` 등록 |
| `querySrv ECONNREFUSED _mongodb._tcp...` | DNS 서버가 Atlas SRV 레코드 조회를 거부함 | `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8` 설정 또는 PC DNS 변경 |
| `MongoDB 연결 실패` | 접속 문자열, Atlas IP 허용, 사용자 권한 문제 | Atlas Network Access, Database User, 접속 문자열 확인 |
| Deploy Hook 실패 | Secret 이름이 다르거나 URL이 비어 있음 | `RENDER_DEPLOY_HOOK_URL` 이름 확인 |
| `Cannot find module 'tailwindcss'` | Render 빌드에서 프론트엔드 devDependencies가 설치되지 않음 | 루트 `build` 스크립트에서 `npm install --include=dev --prefix frontend` 사용 |

## 13. 과제 제출용 설명 문구

이 프로젝트는 Express 기반 자동차 CRUD REST API와 Vite React 프론트엔드를 통합한 웹 애플리케이션입니다.
Tailwind CSS와 daisyUI를 활용해 목록, 등록, 수정, 상세, 삭제 확인 화면을 구성했습니다.
Render Web Service 하나로 Express 서버와 React 빌드 결과물을 함께 배포할 수 있도록 설정했으며, GitHub Actions에서 빌드 성공 후 Render Deploy Hook을 호출하는 CI/CD 흐름을 구성했습니다.
