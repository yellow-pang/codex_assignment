# 4단계 차량 등록과 사진 업로드 작업 계획

## 1. 작업 배경

`docs/실시간_Car_Market_향후_개발_계획서.md`의 4단계 항목에 따라 차량 등록 데이터 구조를 확장하고 사진 업로드 기능을 추가한다.

현재 서버는 MongoDB Atlas `cars` 컬렉션 기반 CRUD와 복합 검색 API를 제공한다. 하지만 차량 등록은 아직 JSON 요청만 받으며, 차량 사진과 상세 스펙 필드는 입력하거나 화면에 표시하지 않는다.

| 현재 기능 | 현재 상태 | 한계 |
| --- | --- | --- |
| 차량 등록 API | `POST /api/cars` JSON body 처리 | 사진 파일 업로드 불가 |
| 차량 등록 폼 | 이름, 제조사, 연식, 가격 입력 | 차종, 연료, 주행거리, 지역, 설명, 사진 입력 없음 |
| 차량 목록 | 테이블 형태 텍스트 정보 출력 | `imageUrl` 출력 없음 |
| 차량 상세 | 기본 정보만 출력 | 사진과 상세 스펙 출력 없음 |
| 정적 업로드 경로 | 없음 | `/uploads` 파일 제공 불가 |

신규 요구사항은 `multer`로 차량 사진을 업로드하고, MongoDB에는 이미지 파일 자체가 아니라 React에서 바로 볼 수 있는 `imageUrl` 경로를 저장하는 것이다.

## 2. 작업 목표

- 루트 의존성에 `multer`를 추가한다.
- Express에서 `/uploads` 폴더를 정적 경로로 제공한다.
- `POST /api/cars`가 `multipart/form-data` 요청을 받아 차량 정보와 사진을 함께 저장하도록 확장한다.
- 차량 등록 폼에 차종, 연료, 주행거리, 지역, 설명, 차량 사진 필드를 추가한다.
- 목록과 상세 화면에서 `imageUrl`이 있으면 차량 사진을 출력한다.
- 사진이 없는 차량도 기존 데이터가 깨지지 않도록 기본 placeholder 또는 안내 영역을 표시한다.

## 3. 백엔드 구현 계획

### 3.1 `multer` 설정 추가

루트 서버에서 업로드 파일을 저장할 `uploads` 폴더를 사용한다.

예상 처리:

```js
const multer = require("multer");

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: ...
  }),
  limits: { fileSize: ... },
  fileFilter: ...
});
```

업로드 파일명은 충돌을 줄이기 위해 시간값 또는 고유값을 포함한다. 원본 파일명은 직접 URL에 노출하지 않고 안전한 파일명으로 저장한다.

### 3.2 `/uploads` 정적 파일 제공

Express에서 업로드 폴더를 정적 파일로 제공한다.

```js
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

저장되는 `imageUrl`은 React에서 바로 사용할 수 있도록 `/uploads/파일명` 형태로 둔다.

### 3.3 파일 검증

업로드 파일은 1차 구현 기준으로 이미지 파일만 허용한다.

| 항목 | 처리 방향 |
| --- | --- |
| 허용 확장자 | `.jpg`, `.jpeg`, `.png`, `.webp` |
| MIME 타입 | `image/jpeg`, `image/png`, `image/webp` 계열 |
| 파일 크기 | 과제용 1차 구현 기준으로 제한값 적용 |
| 사진 미첨부 | 등록은 허용하고 `imageUrl`을 빈 값으로 저장 |

파일 검증 실패 시 내부 경로나 스택 트레이스를 노출하지 않고 안내 메시지를 응답한다.

### 3.4 차량 입력값 확장

`normalizeCarInput`에서 기존 필드와 신규 필드를 함께 정리한다.

| 필드 | 처리 방향 |
| --- | --- |
| `name` | 문자열 trim |
| `company` | 문자열 trim 후 대문자 변환 |
| `price` | 숫자 변환 |
| `year` | 숫자 변환 |
| `type` | 문자열 trim |
| `fuel` | 문자열 trim |
| `mileage` | 숫자 변환 |
| `location` | 문자열 trim |
| `description` | 문자열 trim |
| `imageUrl` | 업로드 파일이 있으면 `/uploads/...` 저장 |

서버는 최소한 숫자 변환과 업로드 검증을 담당한다. 상세한 폼 필수값 검증은 프론트엔드에서 먼저 처리하되, 서버도 빈 값과 잘못된 숫자에 대한 기본 방어를 둔다.

### 3.5 등록 API 확장

`POST /api/cars`는 `upload.single("image")` 미들웨어를 사용해 `multipart/form-data`를 처리한다.

예상 요청 필드:

```text
name
company
price
year
type
fuel
mileage
location
description
image
```

MongoDB 저장 예시:

```json
{
  "name": "Sonata Hybrid",
  "company": "HYUNDAI",
  "price": 2800,
  "year": 2023,
  "type": "sedan",
  "fuel": "hybrid",
  "mileage": 35000,
  "location": "서울",
  "description": "출퇴근용으로 적합한 하이브리드 세단",
  "imageUrl": "/uploads/sonata-20260605.jpg",
  "createdAt": "2026-06-05T00:00:00.000Z",
  "updatedAt": "2026-06-05T00:00:00.000Z"
}
```

### 3.6 수정 API 처리 범위

사용자 승인에 따라 수정 화면에서도 사진 교체를 지원한다.

처리 방향:

- 등록 API는 `multipart/form-data`로 확장한다.
- 수정 API도 `multipart/form-data` 요청을 받을 수 있게 한다.
- 수정 시 새 사진이 없으면 기존 `imageUrl`을 유지한다.
- 수정 시 새 사진이 있으면 새 `/uploads/...` 경로로 `imageUrl`을 갱신한다.

## 4. 프론트엔드 구현 계획

### 4.1 등록 폼 필드 확장

`frontend/src/components/CarForm.jsx`의 폼 상태를 확장한다.

```js
{
  name: "",
  company: "",
  year: "",
  price: "",
  type: "",
  fuel: "",
  mileage: "",
  location: "",
  description: "",
  image: null
}
```

추가 입력 항목:

| 항목 | 입력 UI |
| --- | --- |
| 차종 | select 또는 text |
| 연료 | select 또는 text |
| 주행거리 | number |
| 지역 | text |
| 설명 | textarea |
| 차량 사진 | file input |

### 4.2 등록 요청을 `FormData`로 전환

`frontend/src/App.jsx`의 `handleCreateCar`는 JSON 대신 `FormData`를 서버에 보낸다.

중요 사항:

- `FormData` 요청에서는 브라우저가 boundary를 자동 설정하므로 `Content-Type` 헤더를 직접 지정하지 않는다.
- 파일이 없는 경우에도 텍스트 필드는 정상 전송한다.
- 서버 응답 후 기존처럼 전체 목록을 다시 조회한다.

### 4.3 수정 폼 사진 교체 지원

수정 화면에서도 `FormData`로 차량 정보를 전송한다.

처리 기준:

- 기존 차량에 `imageUrl`이 있으면 현재 사진을 미리 보여준다.
- 새 파일을 선택하지 않으면 기존 사진을 유지한다.
- 새 파일을 선택하면 서버에서 새 파일을 저장하고 `imageUrl`을 갱신한다.
- 기존 업로드 파일 삭제 정책은 이번 단계에서 자동화하지 않는다.

### 4.4 목록 화면 이미지 출력

현재 `CarTable.jsx`는 테이블형 관리 UI이다. 이번 단계에서는 대규모 UI 개편을 하지 않고, 테이블에 작은 썸네일 열을 추가하는 방향을 우선한다.

표시 기준:

- `car.imageUrl`이 있으면 `<img src={car.imageUrl}>`로 출력한다.
- `imageUrl`이 없으면 기본 placeholder 영역 또는 "사진 없음" 안내를 출력한다.
- 차량 목록 전체 카드형 전환은 UI 개편 단계에서 진행한다.

### 4.5 상세 화면 이미지와 스펙 출력

`CarDetail.jsx`에 차량 사진과 상세 필드를 추가한다.

표시 항목:

```text
차량 사진
차량명
제조사
가격
연식
차종
연료
주행거리
지역
차량 설명
```

딜러 정보와 상담 버튼은 Firebase 인증과 상담 단계에서 이어서 구현한다.

## 5. 문서 갱신 계획

구현 승인 후 실제 코드 변경까지 진행할 때 아래 문서를 갱신한다.

| 문서 | 갱신 내용 |
| --- | --- |
| `docs/progress.md` | 4단계 차량 등록과 사진 업로드 작업 기록 추가 |
| `docs/steps/2026-06-05-04-car-photo-upload.md` | 구현 상세 설명 문서 추가 |
| `docs/pr/2026-06-05-04-car-photo-upload-pr.md` | PR 작성용 요약 문서 추가 |
| `docs/deploy-guide.md` | Render 무료 환경의 `/uploads` 파일 비영속성 안내 보강 |
| `docs/deploy-checklist.md` | 사진 업로드 확인 항목 추가 |

README는 최종 제출 정리 단계에서 전체 기능 기준으로 갱신하되, 이번 단계에서 업로드 동작이나 Render 주의사항이 크게 바뀌면 함께 점검한다.

## 6. 검증 계획

가능한 범위에서 아래 검증을 진행한다.

| 검증 항목 | 명령 또는 방법 |
| --- | --- |
| 서버 문법 확인 | `node --check server.js` |
| 루트 빌드 | `npm.cmd run build` |
| 서버 실행 | `npm.cmd start` |
| 업로드 폴더 확인 | 사진 등록 후 `uploads` 폴더에 파일 생성 확인 |
| API 확인 | 실제 `MONGODB_URI`가 있을 때 `POST /api/cars` multipart 요청 확인 |
| 화면 확인 | 차량 목록과 상세에서 `imageUrl` 이미지 표시 확인 |

현재 로컬 환경에 실제 `MONGODB_URI`가 없다면 서버 실행은 MongoDB 연결 실패 메시지까지만 확인하고, 실제 업로드 API 검증은 사용자가 환경변수를 등록한 뒤 진행한다.

## 7. 이번 단계에서 하지 않을 일

- Firebase Authentication과 딜러 권한 체크는 5단계에서 진행한다.
- Socket.io 상담 진입과 상담방 생성은 6단계 이후에서 진행한다.
- 차량 목록 전체를 카드형 마켓 UI로 바꾸는 작업은 별도 UI 개편 단계에서 진행한다.
- daisyUI class 제거와 패키지 제거는 UI 대체가 끝난 뒤 진행한다.
- 외부 이미지 스토리지 또는 CDN은 도입하지 않는다.
- Render 배포 구조를 Web Service 단일 배포에서 분리 배포로 바꾸지 않는다.
- 실제 업로드 파일의 영구 보관을 보장하지 않는다. Render 무료 환경의 파일 비영속성은 문서에 명시한다.

## 8. 사용자 확인 결과

사용자 승인에 따라 아래 방향으로 구현한다.

1. 차량 등록뿐 아니라 차량 수정 화면에서도 사진 교체를 지원한다.
2. 사진이 없는 차량은 기본 이미지 경로를 사용한다. 실제 이미지 파일은 사용자가 지정 경로에 직접 업로드한다.
3. 업로드 파일 크기 제한은 권장값인 5MB로 진행한다.
4. 허용 이미지 형식은 `.jpg`, `.jpeg`, `.png`, `.webp`로 제한한다.
5. `uploads/` 폴더는 서버 시작 시 자동 생성한다.

이 계획에 따라 코드 구현, 검증, Step 문서, PR 문서 작성을 진행한다.
