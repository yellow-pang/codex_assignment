# 2026-06-05 2단계 MongoDB Atlas 연동 상세 설명

## 이 문서의 목표

이번 단계에서는 기존에 서버 메모리 배열에만 저장되던 자동차 데이터를 MongoDB Atlas에 저장하도록 변경했다.

이 문서는 단순 변경 기록이 아니라, 처음 프로젝트를 이어받은 사람이 아래 내용을 이해할 수 있게 정리하는 것을 목표로 한다.

- 이번 단계에서 어떤 코드가 바뀌었는지
- MongoDB Atlas가 서버와 어떻게 연결되는지
- `.env`에는 어떤 값을 넣어야 하는지
- 로컬과 Render에서 무엇을 확인해야 하는지
- 다음 단계에서 무엇을 이어서 하면 되는지

## 한 줄 요약

Express 서버가 시작될 때 `.env`의 `MONGODB_URI`를 읽어 MongoDB Atlas에 연결하고, 차량 CRUD API가 더 이상 메모리 배열이 아니라 MongoDB `cars` 컬렉션을 사용하도록 바뀌었다.

## 작업 전 상태

이전 단계까지 서버는 `/api/cars` API 구조는 갖췄지만, 데이터는 여전히 `server.js` 안의 메모리 배열에 저장하고 있었다.

예전 구조는 대략 이런 방식이었다.

```js
let cars = [
  { _id: 1, name: "Sonata", price: 2500, company: "HYUNDAI", year: 2023 },
  { _id: 2, name: "K5", price: 2700, company: "KIA", year: 2024 },
];
```

이 방식은 서버를 재시작하면 새로 등록한 데이터가 사라진다. Render에 배포해도 서버 인스턴스가 재시작되면 데이터가 유지되지 않는다. 그래서 실제 서비스 요구사항에 맞게 MongoDB Atlas를 데이터 저장소로 연결했다.

## 이번 단계에서 추가한 패키지

루트 프로젝트에 아래 패키지를 추가했다.

```text
mongodb
dotenv
```

역할은 다음과 같다.

| 패키지 | 역할 |
| --- | --- |
| `mongodb` | Node.js 서버에서 MongoDB Atlas에 접속하고 컬렉션을 조작하는 공식 드라이버 |
| `dotenv` | 로컬 `.env` 파일의 환경변수를 `process.env`로 읽어오는 도구 |

MongoDB 드라이버 7.x는 Node.js `20.19.0` 이상을 요구한다. 그래서 `package.json`의 `engines.node`도 `>=20.19.0`으로 보정했다.

## 변경한 파일 요약

| 파일 | 변경 이유 |
| --- | --- |
| `db.js` | MongoDB 연결 코드를 별도 파일로 분리 |
| `server.js` | 차량 CRUD API를 MongoDB `cars` 컬렉션 기반으로 변경 |
| `frontend/src/App.jsx` | 프론트엔드에서 숫자 `_id`를 직접 만들던 로직 제거 |
| `.env.example` | MongoDB Atlas 연결에 필요한 환경변수 예시 추가 |
| `package.json`, `package-lock.json` | `mongodb`, `dotenv` 의존성 추가 및 Node 버전 보정 |
| `docs/deploy-guide.md` | Render 환경변수와 MongoDB 연결 오류 대응 내용 추가 |
| `docs/deploy-checklist.md` | 배포 전후 확인 항목을 MongoDB 기준으로 보완 |
| `docs/progress.md` | 2단계 작업 기록과 검증 결과 추가 |

## MongoDB 연결 구조

MongoDB 연결은 새로 만든 `db.js`가 담당한다.

서버 시작 흐름은 다음 순서다.

1. `server.js`가 실행된다.
2. `dotenv`가 `.env` 값을 읽어 `process.env`에 넣는다.
3. `startServer()`가 `connectDatabase()`를 호출한다.
4. `db.js`가 `process.env.MONGODB_URI`로 MongoDB Atlas에 접속한다.
5. `car_market` 데이터베이스를 선택한다.
6. `cars`, `users`, `chat_rooms`, `messages` 컬렉션이 없으면 생성한다.
7. 연결이 성공하면 Express 서버가 포트를 열고 API 요청을 받는다.

중요한 점은 MongoDB 연결에 실패하면 Express 서버도 시작하지 않는다는 것이다. 데이터베이스가 필요한 API인데 서버만 켜져 있으면 더 헷갈리기 때문에, 실패 원인을 콘솔에 출력하고 종료하도록 했다.

## `db.js`의 역할

`db.js`는 MongoDB 관련 공통 기능을 모아둔 파일이다.

주요 함수는 다음과 같다.

| 함수 | 설명 |
| --- | --- |
| `connectDatabase()` | `MONGODB_URI`로 MongoDB Atlas에 연결하고 기본 컬렉션을 준비 |
| `getDatabase()` | 이미 연결된 데이터베이스 객체를 반환 |
| `getCollection(name)` | `cars`, `users`, `chatRooms`, `messages` 같은 이름으로 컬렉션을 가져옴 |
| `closeDatabase()` | 필요할 때 MongoDB 연결을 닫음 |

컬렉션 이름은 코드에 고정하지 않고 환경변수로 바꿀 수 있게 했다.

```text
COLLECTION_CARS=cars
COLLECTION_USERS=users
COLLECTION_CHAT_ROOMS=chat_rooms
COLLECTION_MESSAGES=messages
```

이렇게 해두면 나중에 테스트용 컬렉션 이름을 따로 쓰거나, 배포 환경과 로컬 환경을 구분하기 쉬워진다.

## `server.js`에서 바뀐 점

### 1. `.env` 읽기

서버 파일 맨 위에서 `dotenv`를 설정한다.

```js
require("dotenv").config({ quiet: true });
```

`quiet: true`는 `dotenv` 자체 안내 로그를 줄이기 위한 설정이다. 서버 로그에는 우리가 필요한 MongoDB 연결 성공/실패 메시지만 남기는 편이 보기 쉽다.

### 2. MongoDB ObjectId 지원

MongoDB는 기본 ID로 `ObjectId`를 사용한다.

그래서 상세 조회, 수정, 삭제 요청에서 URL의 `:id` 값을 MongoDB ObjectId로 변환해 조회하도록 했다.

단, 기존 숫자 ID 데이터가 남아 있을 가능성도 고려해 ObjectId로 유효하지 않은 값은 숫자로 조회하는 호환 처리를 넣었다.

```js
function createCarFilterById(id) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }

  return { _id: Number(id) };
}
```

### 3. 차량 등록 시 서버가 ID 생성

기존에는 프론트엔드가 현재 목록의 최대 숫자 ID를 계산해서 `_id`를 만들었다.

MongoDB에서는 서버가 `insertOne()`을 호출하면 자동으로 ObjectId를 만들어 준다. 그래서 프론트엔드의 숫자 ID 생성 로직을 제거했다.

변경 후 등록 흐름은 다음과 같다.

1. React가 차량 입력값만 서버에 보낸다.
2. Express가 입력값을 정리한다.
3. Express가 `createdAt`, `updatedAt`을 추가한다.
4. MongoDB가 `_id`를 자동 생성한다.
5. 서버가 생성된 차량 데이터를 응답한다.

### 4. 차량 API가 MongoDB 컬렉션 사용

기존 메모리 배열 대신 아래 API들이 모두 `cars` 컬렉션을 사용한다.

| API | MongoDB 동작 |
| --- | --- |
| `GET /api/cars` | `find({}).toArray()` |
| `GET /api/cars/search?company=HYUNDAI` | `find({ company: "HYUNDAI" })` |
| `GET /api/cars/filter?minPrice=1000&maxPrice=3000` | `find({ price: { $gte, $lte } })` |
| `GET /api/cars/:id` | `findOne({ _id })` |
| `POST /api/cars` | `insertOne(newCar)` |
| `PUT /api/cars/:id` | `findOneAndUpdate()` |
| `DELETE /api/cars/:id` | `findOneAndDelete()` |

이번 단계에서는 기존 화면이 계속 동작하도록 `/api/cars/search`, `/api/cars/filter`, `/cars` 호환 라우트를 유지했다. 복합 검색 API 정리는 다음 단계에서 진행한다.

## `.env` 설정 방법

루트에 `.env` 파일을 만들고 아래처럼 설정한다.

```text
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://사용자명:비밀번호@클러스터주소/?retryWrites=true&w=majority
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
DB_NAME=car_market
COLLECTION_CARS=cars
COLLECTION_USERS=users
COLLECTION_CHAT_ROOMS=chat_rooms
COLLECTION_MESSAGES=messages
CLIENT_URL=http://localhost:5173
```

주의할 점:

- 실제 `MONGODB_URI`는 절대 Git에 커밋하지 않는다.
- `.env`는 이미 `.gitignore`에 포함되어 있다.
- `.env.example`에는 실제 계정명, 비밀번호, 클러스터 주소를 넣지 않는다.
- 비밀번호에 `@`, `#`, `/`, `:` 같은 특수문자가 있으면 MongoDB 접속 문자열에서 URL 인코딩이 필요할 수 있다.
- `querySrv ECONNREFUSED`가 발생하면 로컬 DNS가 Atlas SRV 레코드 조회를 막는 경우가 있으므로 `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8`를 추가한다.

## MongoDB Atlas에서 해야 할 일

Atlas 콘솔에서는 보통 아래 순서로 준비한다.

### 1. 클러스터 생성

MongoDB Atlas에서 무료 또는 과제용 클러스터를 생성한다.

### 2. Database User 생성

`Database Access` 메뉴에서 서버가 사용할 DB 사용자를 만든다.

필요한 정보:

```text
username
password
```

이 값이 `MONGODB_URI`에 들어간다.

### 3. IP Access List 설정

`Network Access` 메뉴에서 접속을 허용할 IP를 등록한다.

로컬 개발 중이면 현재 내 IP를 등록한다. Render에서 접속할 때는 Render 환경에서 나가는 IP가 고정되지 않을 수 있으므로, 과제용 1차 구현에서는 Atlas Access List를 넓게 허용하는 설정을 쓰는 경우도 있다. 실제 운영 서비스라면 보안상 더 엄격하게 관리해야 한다.

### 4. 접속 문자열 복사

`Connect` 메뉴에서 Node.js용 connection string을 복사한다.

예시는 다음 형태다.

```text
mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority
```

`<username>`, `<password>`를 실제 Database User 값으로 바꿔 `.env`의 `MONGODB_URI`에 넣는다.

## 로컬에서 확인하는 방법

`.env`에 실제 `MONGODB_URI`를 넣은 뒤 루트에서 실행한다.

```bash
npm.cmd start
```

성공하면 콘솔에 아래처럼 나온다.

```text
MongoDB connected: car_market
Server is running on http://localhost:3000
```

그 다음 브라우저나 curl로 확인한다.

```bash
curl http://localhost:3000/api/cars
```

처음에는 데이터가 없을 수 있으므로 `[]`가 나와도 연결은 성공한 것이다.

차량 등록은 프론트 화면에서 해도 되고, API로 직접 보내도 된다.

```bash
curl -X POST http://localhost:3000/api/cars ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Sonata\",\"company\":\"HYUNDAI\",\"year\":2023,\"price\":2500}"
```

등록 후 `GET /api/cars`를 다시 호출하면 MongoDB에 저장된 차량이 보여야 한다.

## Render에서 설정해야 할 환경변수

Render Web Service의 Environment Variables에는 최소 아래 값을 등록한다.

```text
NODE_ENV=production
MONGODB_URI=MongoDB Atlas 접속 문자열
DB_NAME=car_market
COLLECTION_CARS=cars
COLLECTION_USERS=users
COLLECTION_CHAT_ROOMS=chat_rooms
COLLECTION_MESSAGES=messages
CLIENT_URL=Render 또는 로컬 클라이언트 주소
```

`PORT`는 Render가 자동으로 제공하므로 직접 넣지 않아도 된다.

배포 후 Render Logs에서 아래 메시지를 확인한다.

```text
MongoDB connected: car_market
Server is running on http://localhost:<Render가 제공한 포트>
```

## 자주 만날 수 있는 오류

| 오류 메시지 | 의미 | 확인할 것 |
| --- | --- | --- |
| `MONGODB_URI 환경변수가 설정되지 않았습니다.` | `.env` 또는 Render Environment에 접속 문자열이 없음 | `.env`, Render 환경변수 |
| `querySrv ECONNREFUSED _mongodb._tcp...` | 로컬 DNS가 `mongodb+srv` 주소의 SRV 레코드 조회를 거부함 | `.env`에 `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8` 추가 후 재실행 |
| `MongoDB 연결 실패` | Atlas에 접속하지 못함 | 접속 문자열, DB 사용자, 비밀번호, IP Access List |
| 인증 실패 관련 메시지 | DB 사용자 정보가 틀림 | username/password, 특수문자 인코딩 |
| timeout 관련 메시지 | 네트워크 접근이 막힘 | Atlas Network Access, 인터넷 연결 |
| `자동차를 찾을 수 없습니다.` | 해당 `_id` 문서가 없음 | URL의 ID 값, MongoDB 컬렉션 데이터 |

## 이번 단계에서 검증한 내용

| 검증 항목 | 결과 |
| --- | --- |
| `node --check server.js` | 성공 |
| `node --check db.js` | 성공 |
| `npm.cmd run build` | 성공 |
| `npm.cmd start` | 현재 로컬에 `MONGODB_URI`가 없어 의도한 오류 메시지로 종료 |

현재 작업 환경에는 실제 Atlas 접속 문자열을 넣지 않았기 때문에, 실제 DB 연결 성공과 API CRUD 동작은 사용자가 `.env`에 `MONGODB_URI`를 넣은 뒤 확인해야 한다.

## 이번 단계에서 일부러 하지 않은 것

- 실제 `.env` 파일 내용은 문서에 남기지 않았다.
- MongoDB Atlas 데이터 삭제나 초기화는 하지 않았다.
- `/api/cars/search` 복합 검색 고도화는 다음 단계로 남겼다.
- 사진 업로드용 `multer`와 `/uploads` 구현은 다음 단계 이후로 남겼다.
- Firebase 인증과 딜러 권한 체크는 아직 적용하지 않았다.
- Socket.io 상담 기능은 아직 적용하지 않았다.

## 다음 단계에서 이어갈 작업

1. 실제 `MONGODB_URI`를 등록하고 서버 실행 성공 여부를 확인한다.
2. `GET /api/cars/search`를 차량명, 제조사, 가격, 연식 복합 검색 API로 확장한다.
3. 차량 데이터 구조에 `type`, `fuel`, `mileage`, `location`, `description`, `imageUrl`, `dealerId`, `dealerName`을 단계적으로 추가한다.
4. 사진 업로드 단계에서 `multer`와 `/uploads` 정적 경로를 구현한다.
5. Firebase 인증 단계에서 사용자 UID와 딜러 역할을 차량 등록 권한에 연결한다.
