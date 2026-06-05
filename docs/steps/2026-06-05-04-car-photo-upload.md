# 2026-06-05 4단계 차량 등록과 사진 업로드 상세 설명

## 이 문서의 목표

이번 단계에서는 차량 등록 데이터를 신규 요구사항 구조로 확장하고, 차량 사진 업로드를 추가했다.

이 문서는 다음 내용을 처음 보는 사람이 이해할 수 있게 정리한다.

- `multer`를 어떤 방식으로 설정했는지
- 차량 등록과 수정 API가 어떻게 `multipart/form-data`를 처리하는지
- 프론트엔드 등록/수정 폼이 어떤 필드를 전송하는지
- 목록과 상세 화면에서 차량 이미지를 어떻게 표시하는지
- Render 무료 환경에서 업로드 파일 보관에 어떤 제한이 있는지

## 한 줄 요약

차량 등록과 수정 요청을 `FormData` 기반으로 바꾸고, `multer`가 저장한 사진 경로를 MongoDB `cars.imageUrl`에 저장해 목록과 상세 화면에서 볼 수 있게 했다.

## 작업 전 상태

3단계까지는 MongoDB 기반 차량 CRUD와 복합 검색이 구현되어 있었다.
하지만 차량 등록 데이터는 기존 CRUD 앱의 기본 필드만 사용했다.

| 기능      | 기존 상태                | 한계                                        |
| --------- | ------------------------ | ------------------------------------------- |
| 차량 등록 | JSON body로 등록         | 사진 파일 전송 불가                         |
| 차량 수정 | JSON body로 수정         | 사진 교체 불가                              |
| 등록 폼   | 이름, 제조사, 연식, 가격 | 차종, 연료, 주행거리, 지역, 설명, 사진 없음 |
| 목록 화면 | 텍스트 테이블            | 이미지와 상세 스펙 일부 없음                |
| 상세 화면 | 기본 정보 카드           | 큰 사진과 상세 설명 없음                    |

## 변경한 파일 요약

| 파일                                           | 변경 이유                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `server.js`                                    | `multer` 설정, `/uploads` 정적 경로, 등록/수정 multipart 처리 추가 |
| `package.json`                                 | `multer` 의존성 추가                                               |
| `package-lock.json`                            | `multer` 설치 결과 반영                                            |
| `frontend/src/App.jsx`                         | 등록/수정 요청을 `FormData`로 전환                                 |
| `frontend/src/components/CarForm.jsx`          | 차량 상세 필드와 사진 파일 입력 추가                               |
| `frontend/src/components/CarTable.jsx`         | 차량 썸네일, 주행거리, 지역 표시 추가                              |
| `frontend/src/components/CarDetail.jsx`        | 큰 차량 이미지, 상세 스펙, 설명 표시 추가                          |
| `.gitignore`                                   | 런타임 업로드 파일 제외, 기본 이미지는 커밋 가능하게 설정          |
| `README.md`                                    | 현재 API와 업로드 주의사항으로 보정                                |
| `docs/deploy-guide.md`                         | Render 무료 환경의 업로드 파일 비영속성 안내 추가                  |
| `docs/deploy-checklist.md`                     | 사진 업로드 배포 확인 항목 추가                                    |
| `docs/실시간_Car_Market_향후_개발_계획서.md`   | 사진 업로드 현재 구현 상태 보정                                    |
| `docs/plans/plan-04-car-photo-upload.md`       | 사용자 승인 방향 기록                                              |
| `docs/progress.md`                             | 4단계 작업 기록 추가                                               |
| `docs/steps/2026-06-05-04-car-photo-upload.md` | 이번 단계 상세 설명 추가                                           |
| `docs/pr/2026-06-05-04-car-photo-upload-pr.md` | PR 작성용 요약 추가                                                |

## 서버 변경 내용

### 1. `multer` 의존성 추가

루트 의존성에 `multer`를 추가했다.

```json
{
  "dependencies": {
    "multer": "^2.1.1"
  }
}
```

사진 파일은 서버의 `uploads/` 폴더에 저장한다.

### 2. 업로드 폴더 자동 생성

서버 시작 시 `uploads/` 폴더가 없으면 자동 생성한다.

```js
fs.mkdirSync(uploadsPath, { recursive: true });
```

사용자가 별도로 폴더를 만들지 않아도 사진 업로드가 가능하도록 하기 위한 처리다.

### 3. `/uploads` 정적 경로 제공

Express에서 업로드 폴더를 정적 경로로 제공한다.

```js
app.use("/uploads", express.static(uploadsPath));
```

MongoDB에는 파일 자체가 아니라 `/uploads/파일명` 형태의 경로를 저장한다.
React는 이 경로를 `img` 태그의 `src`로 바로 사용할 수 있다.

### 4. 파일 검증

업로드 가능한 파일 조건은 다음과 같다.

| 항목      | 값                                      |
| --------- | --------------------------------------- |
| 최대 크기 | 5MB                                     |
| 확장자    | `.jpg`, `.jpeg`, `.png`, `.webp`        |
| MIME 타입 | `image/jpeg`, `image/png`, `image/webp` |

조건에 맞지 않으면 서버는 `400` 상태 코드와 안내 메시지를 반환한다.
내부 파일 경로나 스택 트레이스는 응답에 노출하지 않는다.

### 5. 등록 API 확장

`POST /api/cars`는 `upload.single("image")`를 사용한다.

요청 방식:

```text
multipart/form-data
```

요청 필드:

```text
name
company
year
price
type
fuel
mileage
location
description
image
```

업로드 사진이 있으면 `imageUrl`에 `/uploads/파일명`을 저장한다.
사진 없이 등록하면 `imageUrl`은 빈 문자열로 저장된다.

### 6. 수정 API 사진 교체 지원

`PUT /api/cars/:id`도 `upload.single("image")`를 사용한다.

수정 기준:

- 새 사진이 있으면 `imageUrl`을 새 업로드 경로로 갱신한다.
- 새 사진이 없으면 기존 `imageUrl`을 그대로 유지한다.
- 기존 업로드 파일 삭제 자동화는 이번 단계에서 진행하지 않았다.

기존 파일 삭제는 실제 운영에서는 필요할 수 있지만, 이번 과제 1차 구현에서는 데이터 손실 위험을 줄이기 위해 남겨 둔다.

## 프론트엔드 변경 내용

### 1. 등록/수정 요청을 `FormData`로 전환

`frontend/src/App.jsx`에 `createCarFormData()`를 추가했다.

중요한 점은 `FormData` 요청에서는 `Content-Type` 헤더를 직접 지정하지 않는다는 것이다.
브라우저가 multipart boundary를 자동으로 설정해야 서버가 파일을 제대로 받을 수 있다.

### 2. 등록/수정 폼 확장

`CarForm.jsx`에서 입력 필드를 확장했다.

| 항목      | 입력 방식 |
| --------- | --------- |
| 이름      | text      |
| 제조사    | select    |
| 연식      | number    |
| 가격      | number    |
| 차종      | select    |
| 연료      | select    |
| 주행거리  | number    |
| 지역      | text      |
| 차량 설명 | textarea  |
| 차량 사진 | file      |

수정 화면에서는 새 파일을 선택하지 않으면 기존 사진을 유지한다는 안내 문구를 보여준다.

### 3. 목록 화면 이미지 출력

`CarTable.jsx`에 사진 열을 추가했다.

표시 기준:

- `car.imageUrl`이 있으면 해당 사진을 표시한다.
- `car.imageUrl`이 없으면 `/uploads/default-car.png`를 표시한다.

사용자는 기본 이미지 파일을 `uploads/default-car.png` 위치에 직접 추가하면 된다.

### 4. 상세 화면 이미지와 스펙 출력

`CarDetail.jsx`에 큰 차량 이미지와 상세 스펙을 추가했다.

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

딜러 정보와 상담 버튼은 Firebase 인증, 차량 상세 URL, 상담 단계에서 이어서 구현한다.

## 기본 이미지 경로

사진이 없는 차량은 아래 경로를 사용한다.

```text
uploads/default-car.png
```

`.gitignore`는 런타임 업로드 파일은 제외하되, 기본 이미지 파일은 커밋할 수 있게 설정했다.

```gitignore
uploads/*
!uploads/default-car.png
```

기본 이미지가 아직 없으면 브라우저에서 해당 이미지 요청이 404가 될 수 있다.
사용자가 기본 이미지를 추가하면 사진 없는 차량에도 같은 기본 이미지가 표시된다.

## Render 배포 주의사항

이번 단계의 업로드는 과제 요구사항에 맞춰 Express 서버 로컬 파일 시스템을 사용한다.

다만 Render 무료 환경의 파일 시스템은 영구 저장소가 아니다.
재배포, 인스턴스 재시작, 환경 재생성 시 `uploads/`에 저장된 사진이 사라질 수 있다.

운영 서비스로 확장하려면 아래 같은 외부 저장소를 검토해야 한다.

- AWS S3
- Cloudinary
- Firebase Storage

이번 단계에서는 외부 이미지 스토리지를 도입하지 않았다.

## 이번 단계에서 하지 않은 것

- Firebase Authentication과 딜러 권한 체크는 추가하지 않았다.
- 차량 상세 URL(`/cars/:id`)과 React Router는 도입하지 않았다.
- Socket.io 상담 진입은 구현하지 않았다.
- 차량 목록 전체 카드형 UI 개편은 진행하지 않았다.
- daisyUI class 제거는 진행하지 않았다.
- 기존 업로드 파일 삭제 자동화는 진행하지 않았다.

## 검증 방법

문법과 빌드를 확인한다.

```bash
node --check server.js
npm.cmd run build
```

실제 `MONGODB_URI`가 등록된 환경에서는 서버 실행 후 아래 흐름을 확인한다.

```bash
npm.cmd start
```

사진 포함 등록 예시:

```bash
curl -X POST http://localhost:3000/api/cars ^
  -F "name=Sonata Hybrid" ^
  -F "company=HYUNDAI" ^
  -F "year=2023" ^
  -F "price=2800" ^
  -F "type=sedan" ^
  -F "fuel=hybrid" ^
  -F "mileage=35000" ^
  -F "location=서울" ^
  -F "description=출퇴근용으로 적합한 하이브리드 세단" ^
  -F "image=@sample-car.jpg"
```

확인할 항목:

- `uploads/` 폴더에 이미지 파일이 생성되는가
- MongoDB `cars` 문서에 `imageUrl`이 저장되는가
- 목록 화면에서 썸네일이 보이는가
- 상세 화면에서 큰 사진과 상세 정보가 보이는가
- 수정 화면에서 새 사진을 선택하면 사진이 교체되는가

## 다음 단계

1. 실제 `MONGODB_URI`가 등록된 환경에서 사진 등록과 수정 API를 직접 확인한다.
2. 기본 이미지 파일이 `uploads/default-car.png` 위치에 있는지 확인한다.
3. 5단계에서 Firebase 인증과 딜러 권한 체크를 구현한다.
4. 이후 UI 개편 단계에서 차량 목록을 카드형 마켓 UI로 전환한다.
