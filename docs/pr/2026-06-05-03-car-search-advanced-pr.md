# PR: 차량 검색 API 고도화

## PR 제목

```text
feat: 차량 복합 검색 기능 추가
```

## 작업 배경

`docs/실시간_Car_Market_향후_개발_계획서.md`의 3단계 차량 검색 고도화 항목에 따라, 기존 제조사 검색과 가격 필터로 나뉘어 있던 검색 흐름을 신규 요구사항 기준으로 통합했다.

신규 요구사항에서는 사용자가 차량명, 제조사, 가격 범위, 연식 범위를 함께 사용해 차량을 검색할 수 있어야 한다. 이에 따라 `GET /api/cars/search` 하나에서 복합 검색을 처리하도록 서버와 프론트엔드를 변경했다.

## 변경 내용

- `GET /api/cars/search`에서 `keyword`, `company`, `minPrice`, `maxPrice`, `minYear`, `maxYear` 복합 검색을 지원하도록 변경했다.
- 차량명 검색은 MongoDB 정규식 기반 대소문자 구분 없는 부분 검색으로 처리했다.
- 정규식 특수문자가 검색어에 들어와도 검색 패턴이 깨지지 않도록 이스케이프 처리를 추가했다.
- 가격과 연식 검색 조건은 공백, 탭, 줄바꿈을 제거한 뒤 숫자인지 검증하도록 구성했다.
- 숫자가 아닌 가격 또는 연식 조건이 API로 들어오면 `400` 오류와 안내 메시지를 반환하도록 했다.
- 기존 `/api/cars/filter` 가격 필터 라우트를 제거했다.
- 프론트엔드 검색 폼에 차량명, 제조사, 최소/최대 가격, 최소/최대 연식 입력을 추가했다.
- 기존 제조사 검색과 가격 필터 버튼을 하나의 검색 버튼으로 통합했다.
- 검색 조건을 비우고 전체 목록으로 돌아갈 수 있는 초기화 버튼을 추가했다.
- 검색 결과가 없을 때 "검색 결과가 없습니다." 안내를 보여주도록 `CarTable` 빈 상태 문구를 분리했다.
- 3단계 계획 문서, 상세 Step 문서, 진행 기록, 향후 개발 계획서를 갱신했다.

## 변경 파일

```text
docs/plans/plan-03-car-search-advanced.md
docs/progress.md
docs/pr/2026-06-05-03-car-search-advanced-pr.md
docs/steps/2026-06-05-03-car-search-advanced.md
docs/실시간_Car_Market_향후_개발_계획서.md
frontend/src/App.jsx
frontend/src/components/CarTable.jsx
server.js
```

## 검증

```text
node --check server.js
npm.cmd run build
npm.cmd start
```

검증 결과:

- `node --check server.js`: 성공
- `npm.cmd run build`: 성공
- `cmd.exe /c rg filterByPrice server.js frontend\src`: 결과 없음
- `cmd.exe /c rg searchByCompany server.js frontend\src`: 결과 없음
- `cmd.exe /c rg /api/cars/filter server.js frontend\src`: 결과 없음
- `cmd.exe /c rg /cars/filter server.js frontend\src`: 결과 없음
- `cmd.exe /c npm.cmd start`: 제한 시간 안에 종료되지 않아 실제 API 호출 검증은 완료하지 못함

## 남은 리스크

- 실제 MongoDB Atlas 검색 API 호출 검증은 실제 `MONGODB_URI`가 등록된 환경에서 진행해야 한다.
- `/api/cars/filter`를 제거했으므로 외부에서 해당 API를 직접 호출하던 사용자는 `/api/cars/search?minPrice=...&maxPrice=...`로 변경해야 한다.
- 제조사 입력은 이번 단계에서 자유 텍스트로 유지했다. 이후 UI 개편 단계에서 select로 바꾸면 오타 입력을 줄일 수 있다.
- 차량 데이터 구조에 사진, 연료, 주행거리, 지역, 설명 필드는 아직 추가하지 않았다. 이는 4단계 사진 업로드와 차량 등록 확장 단계에서 진행한다.
- daisyUI 제거는 이번 단계 범위가 아니므로 기존 스타일은 유지했다.

## 체크리스트

- [x] 작업 전 브랜치와 변경 상태를 확인했다.
- [x] 관련 요구사항 문서와 현재 코드를 확인했다.
- [x] 구현 전 계획 문서를 작성하고 사용자 확인을 받았다.
- [x] `/api/cars/search` 복합 검색 조건을 구현했다.
- [x] `/api/cars/filter` 라우트를 제거했다.
- [x] 프론트엔드 검색 폼을 요구사항 기준으로 확장했다.
- [x] 검색 결과 없음 안내를 별도로 표시하도록 했다.
- [x] 단계별 작업 상세 문서를 작성했다.
- [x] 빌드와 서버 JS 문법 검사를 실행했다.
- [ ] 실제 `MONGODB_URI` 등록 후 검색 API 호출을 확인한다.
- [ ] PR 생성 전 사용자가 커밋한다.

## 제안 커밋 메시지

```text
feat: 차량 복합 검색 기능 추가
```

```text
- 차량 검색 API를 /api/cars/search 하나로 통합한다.
- 차량명, 제조사, 가격, 연식 복합 검색 조건을 지원한다.
- 가격과 연식 검색 조건의 숫자 검증을 추가한다.
- 프론트엔드 검색 폼과 검색 결과 없음 안내를 개선한다.
- 3단계 작업 계획, 상세 설명, PR 문서를 추가한다.
```
