# PR: MongoDB Atlas 연동으로 차량 데이터 저장소 전환

## PR 제목

```text
feat: MongoDB Atlas 연동 추가
```

## 작업 배경

`docs/실시간_Car_Market_향후_개발_계획서.md`의 2단계 MongoDB Atlas 연동 항목에 따라, 기존 메모리 배열 기반 차량 CRUD를 MongoDB Atlas 기반 저장 구조로 전환했다.

기존 서버는 `/api/cars` API 구조는 갖췄지만, 차량 데이터가 `server.js` 내부 배열에 저장되어 서버 재시작 시 데이터가 사라졌다. 신규 요구사항에서는 차량 정보, 사용자 추가 정보, 상담방, 메시지를 MongoDB Atlas에 저장해야 하므로, 먼저 MongoDB 연결 기반을 만들고 차량 CRUD부터 `cars` 컬렉션을 사용하도록 변경했다.

## 변경 내용

- 루트 의존성에 `mongodb`, `dotenv`를 추가했다.
- `db.js`를 추가해 `MongoClient` 기반 MongoDB 연결 코드를 분리했다.
- 서버 시작 시 `MONGODB_URI`로 Atlas에 연결하고 기본 컬렉션을 준비하도록 구성했다.
- 기본 컬렉션으로 `cars`, `users`, `chat_rooms`, `messages`를 사용하도록 환경변수 구조를 추가했다.
- 차량 목록, 상세, 등록, 수정, 삭제 API를 MongoDB `cars` 컬렉션 기반으로 전환했다.
- 기존 `/api/cars/search`, `/api/cars/filter`, `/cars` 호환 라우트는 유지했다.
- 차량 등록 시 프론트엔드가 숫자 `_id`를 직접 생성하던 로직을 제거했다.
- `.env.example`, 배포 가이드, 배포 체크리스트, 진행 기록 문서를 MongoDB Atlas 기준으로 갱신했다.
- MongoDB 드라이버 7.x 요구사항에 맞춰 Node.js 엔진 기준을 `>=20.19.0`으로 보정했다.
- 2단계 작업 상세 설명 문서를 `docs/steps/2026-06-05-02-mongodb-atlas.md`에 추가했다.

## 변경 파일

```text
.env.example
db.js
docs/deploy-checklist.md
docs/deploy-guide.md
docs/progress.md
docs/steps/2026-06-05-02-mongodb-atlas.md
docs/pr/2026-06-05-mongodb-atlas-pr.md
frontend/src/App.jsx
package-lock.json
package.json
server.js
```

## 검증

```text
node --check server.js
node --check db.js
npm.cmd run build
npm.cmd start
```

검증 결과:

- `node --check server.js`: 성공
- `node --check db.js`: 성공
- `npm.cmd run build`: 성공
- `npm.cmd start`: 현재 로컬 환경에 `MONGODB_URI`가 없어 `MongoDB 연결 실패: MONGODB_URI 환경변수가 설정되지 않았습니다.` 메시지로 종료됨을 확인

## 남은 리스크

- 실제 MongoDB Atlas 접속 성공과 `/api/cars` CRUD 호출 검증은 실제 `MONGODB_URI` 등록 후 진행해야 한다.
- Atlas Network Access, Database User, 접속 문자열 설정이 올바르지 않으면 서버가 시작되지 않는다.
- 기존 `/cars` 호환 라우트는 아직 남아 있다. 프론트엔드와 문서가 완전히 `/api/cars` 기준으로 정리된 뒤 제거 여부를 결정한다.
- `/api/cars/search`는 아직 제조사 검색 중심이다. 다음 단계에서 차량명, 제조사, 가격, 연식 복합 검색 API로 고도화해야 한다.
- 빌드 중 `frontend` 의존성 moderate 취약점 2건이 보고된다. 이번 PR 범위는 MongoDB 연동이므로 강제 업데이트는 포함하지 않았다.
- daisyUI 제거는 UI 개편 단계에서 별도로 진행한다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서를 확인했다.
- [x] MongoDB 연결 코드를 별도 파일로 분리했다.
- [x] 차량 CRUD API를 MongoDB `cars` 컬렉션 기반으로 전환했다.
- [x] `.env.example`에 MongoDB Atlas 환경변수 예시를 추가했다.
- [x] 배포 문서에 Render 환경변수와 MongoDB 오류 대응 내용을 추가했다.
- [x] 빌드와 서버 JS 문법 검사를 실행했다.
- [x] 단계별 작업 상세 문서를 작성했다.
- [ ] 실제 `MONGODB_URI` 등록 후 MongoDB 연결 성공을 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.

## 제안 커밋 메시지

```text
feat: MongoDB Atlas 연동 추가
```

```text
- MongoClient 기반 MongoDB 연결 파일을 추가한다.
- 차량 CRUD API를 MongoDB cars 컬렉션 기반으로 전환한다.
- MongoDB Atlas 환경변수 예시와 배포 문서를 갱신한다.
- 프론트엔드의 숫자 ID 생성 로직을 제거한다.
- 2단계 작업 상세 문서와 PR 작성용 문서를 추가한다.
```

