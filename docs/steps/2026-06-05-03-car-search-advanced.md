# 2026-06-05 3단계 차량 검색 고도화 상세 설명

## 이 문서의 목표

이번 단계에서는 차량 검색 기능을 신규 요구사항 기준으로 확장했다.

이 문서는 다음 내용을 처음 보는 사람이 이해할 수 있게 정리한다.

- 기존 검색 기능의 한계
- `/api/cars/search`가 어떤 조건을 받는지
- 서버에서 MongoDB 검색 query를 어떻게 구성하는지
- 프론트엔드 검색 폼이 어떻게 바뀌었는지
- 어떤 검증을 해야 하는지

## 한 줄 요약

제조사 검색과 가격 필터로 나뉘어 있던 검색 흐름을 `GET /api/cars/search` 하나로 통합하고, 차량명, 제조사, 가격 범위, 연식 범위를 함께 검색할 수 있게 했다.

## 작업 전 상태

2단계 MongoDB Atlas 연동 후에도 검색은 아직 기존 CRUD 앱 구조를 유지하고 있었다.

| 기능        | API                                                | 상태                    |
| ----------- | -------------------------------------------------- | ----------------------- |
| 제조사 검색 | `GET /api/cars/search?company=HYUNDAI`             | 제조사 단일 조건만 지원 |
| 가격 필터   | `GET /api/cars/filter?minPrice=1000&maxPrice=3000` | 검색 API와 분리됨       |

이 구조에서는 차량명, 제조사, 가격, 연식을 한 번에 조합해서 검색할 수 없었다.

## 변경한 파일 요약

| 파일                                              | 변경 이유                                               |
| ------------------------------------------------- | ------------------------------------------------------- |
| `server.js`                                       | 복합 검색 query 생성 함수 추가, `/api/cars/filter` 제거 |
| `frontend/src/App.jsx`                            | 검색 폼 확장, 검색/초기화 흐름 통합                     |
| `frontend/src/components/CarTable.jsx`            | 검색 결과 없음 안내 문구 분리                           |
| `docs/plans/plan-03-car-search-advanced.md`       | 구현 전 계획과 사용자 승인 방향 기록                    |
| `docs/progress.md`                                | 3단계 작업 기록 추가                                    |
| `docs/실시간_Car_Market_향후_개발_계획서.md`      | `/api/cars/filter` 제거 방향 반영                       |
| `docs/steps/2026-06-05-03-car-search-advanced.md` | 이번 단계 상세 설명 추가                                |
| `docs/pr/2026-06-05-03-car-search-advanced-pr.md` | PR 작성용 요약 추가                                     |

## 서버 변경 내용

### 1. 검색 query 생성 함수 추가

`server.js`에 `createCarSearchQuery(queryParams)`를 추가했다.

이 함수는 Express의 `req.query`를 MongoDB `find()`에 넣을 query 객체로 바꾼다.

지원 조건은 다음과 같다.

| 쿼리 파라미터 | MongoDB 검색 조건        |
| ------------- | ------------------------ |
| `keyword`     | `name` 필드 부분 검색    |
| `company`     | `company` 필드 일치 검색 |
| `minPrice`    | `price >= minPrice`      |
| `maxPrice`    | `price <= maxPrice`      |
| `minYear`     | `year >= minYear`        |
| `maxYear`     | `year <= maxYear`        |

예시 요청:

```text
GET /api/cars/search?keyword=sonata&company=HYUNDAI&minPrice=1000&maxPrice=3000&minYear=2020
```

서버가 만드는 MongoDB query 예시:

```js
{
  name: { $regex: "sonata", $options: "i" },
  company: "HYUNDAI",
  price: { $gte: 1000, $lte: 3000 },
  year: { $gte: 2020 }
}
```

### 2. 차량명 부분 검색

`keyword`는 `name` 필드에 대해 대소문자 구분 없는 부분 검색을 한다.

정규식 특수문자가 검색어에 들어와도 검색 패턴이 깨지지 않도록 `escapeRegExp()`로 이스케이프한다.

예를 들어 사용자가 `K5`를 입력하면 `K5`가 포함된 차량명을 찾고, `Sonata`를 입력하면 `Sonata Hybrid` 같은 이름도 검색된다.

### 3. 숫자 조건 검증

가격과 연식 조건은 서버에서 한 번 더 검증한다.

처리 순서:

1. 쿼리 값을 문자열로 바꾼다.
2. 공백, 탭, 줄바꿈 같은 공백류를 제거한다.
3. 빈 값이면 검색 조건에서 제외한다.
4. 숫자로 변환할 수 없으면 `400` 오류를 반환한다.
5. 숫자이면 MongoDB query에 넣는다.

오류 응답 예시:

```json
{
  "message": "가격 검색 조건은 숫자로 입력해야 합니다."
}
```

프론트엔드도 숫자 입력을 유도하지만, API는 사용자가 브라우저 밖에서 직접 호출할 수도 있으므로 서버 검증을 유지한다.

### 4. `/api/cars/filter` 제거

사용자 승인에 따라 기존 가격 필터 라우트인 `/api/cars/filter`는 제거했다.

이제 가격 검색도 아래처럼 `/api/cars/search`를 사용한다.

```text
GET /api/cars/search?minPrice=1000&maxPrice=3000
```

기존 `/cars` 레거시 라우트는 이번 단계 범위가 아니므로 유지했다. 다만 `/cars/filter`도 같은 router를 쓰고 있었기 때문에 더 이상 동작하지 않는다.

## 프론트엔드 변경 내용

### 1. 검색 상태 확장

`frontend/src/App.jsx`의 `filters` 상태를 다음처럼 확장했다.

```js
{
  keyword: "",
  company: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: ""
}
```

### 2. 검색 폼 확장

목록 화면 검색 영역에 아래 입력값을 추가했다.

| 항목      | 입력 방식 |
| --------- | --------- |
| 차량명    | 텍스트    |
| 제조사    | 텍스트    |
| 최소 가격 | 숫자      |
| 최대 가격 | 숫자      |
| 최소 연식 | 숫자      |
| 최대 연식 | 숫자      |

이번 단계에서는 전체 UI 개편이 아니라 기능 고도화가 목표이므로 daisyUI 기반 화면 톤은 유지했다.

### 3. 검색 버튼 통합

기존에는 제조사 검색 버튼과 가격 필터 버튼이 따로 있었다.

이번 단계에서는 검색 조건을 모두 모아 `URLSearchParams`로 만든 뒤 `/api/cars/search`를 호출한다.

조건이 비어 있으면 `/api/cars` 전체 목록을 조회한다.

### 4. 초기화 버튼 추가

초기화 버튼은 검색 조건을 모두 비우고 전체 목록을 다시 조회한다.

검색 후 결과가 0개인 상태에서 사용자가 쉽게 원래 목록으로 돌아갈 수 있게 하기 위한 UX 보완이다.

### 5. 검색 결과 없음 안내

`CarTable.jsx`는 빈 목록일 때 항상 "등록된 자동차가 없습니다."만 보여주고 있었다.

검색 결과가 없는 경우에는 의미가 다르기 때문에 `emptyMessage`, `emptyDescription` props를 추가했다.

검색 결과가 없으면 아래 문구를 보여준다.

```text
검색 결과가 없습니다.
검색 조건을 바꾸거나 초기화해 전체 목록을 다시 확인해보세요.
```

## 이번 단계에서 하지 않은 것

- 차량 데이터 구조에 `type`, `fuel`, `mileage`, `location`, `description`, `imageUrl`을 추가하지 않았다.
- 사진 업로드용 `multer`는 추가하지 않았다.
- Firebase 인증과 딜러 권한 체크는 추가하지 않았다.
- daisyUI 제거와 카드형 목록 UI 개편은 진행하지 않았다.
- `/cars` 레거시 라우트 전체 제거는 진행하지 않았다.

## 검증 방법

문법과 빌드를 확인한다.

```bash
node --check server.js
npm.cmd run build
```

실제 `MONGODB_URI`가 등록된 환경에서는 서버 실행 후 아래 API를 확인한다.

```bash
curl "http://localhost:3000/api/cars/search?keyword=sonata"
curl "http://localhost:3000/api/cars/search?company=HYUNDAI&minPrice=1000&maxPrice=3000"
curl "http://localhost:3000/api/cars/search?minYear=2020&maxYear=2024"
curl "http://localhost:3000/api/cars/search?minPrice=abc"
```

마지막 요청은 `400` 오류와 숫자 입력 안내 메시지가 나와야 한다.

## 다음 단계

1. 실제 MongoDB Atlas 환경변수가 있는 로컬 또는 Render 환경에서 복합 검색 API를 직접 호출한다.
2. 4단계에서 차량 등록 폼과 API에 사진 업로드, 차종, 연료, 주행거리, 지역, 설명 필드를 추가한다.
3. UI 개편 단계에서 검색 필터를 카드형 차량 목록과 더 잘 어울리는 순수 Tailwind UI로 바꾼다.
