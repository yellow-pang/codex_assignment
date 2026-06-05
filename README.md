# 실시간 Car Market

React + Vite 프론트엔드와 Node.js + Express 백엔드로 구성한 실시간 Car Market 과제 프로젝트입니다.
차량 데이터는 MongoDB Atlas에 저장하고, Render Web Service 단일 배포 구조를 기준으로 개발합니다.

## 실행 방법

서버 실행:

```bash
npm install
npm start
```

React 프론트엔드 개발 서버 실행:

```bash
cd frontend
npm install
npm run dev
```

React 코드는 `/api/*` 상대 경로로 요청하고, Vite 개발 서버에서는 프록시가 Express 서버로 요청을 전달합니다.

## 자동차 API 사용 예시

전체 자동차 목록 조회:

```bash
curl http://localhost:3000/api/cars
```

복합 검색:

```bash
curl "http://localhost:3000/api/cars/search?keyword=sonata&company=HYUNDAI&minPrice=1000&maxPrice=3000&minYear=2020"
```

차량 등록과 사진 업로드:

```bash
curl -X POST http://localhost:3000/api/cars \
  -F "name=Sonata Hybrid" \
  -F "company=HYUNDAI" \
  -F "year=2023" \
  -F "price=2800" \
  -F "type=sedan" \
  -F "fuel=hybrid" \
  -F "mileage=35000" \
  -F "location=서울" \
  -F "description=출퇴근용으로 적합한 하이브리드 세단" \
  -F "image=@./sample-car.jpg"
```

사진 없이도 차량 등록은 가능합니다. 사진이 없는 차량은 `/uploads/default-car.png`를 기본 이미지 경로로 사용합니다.
기본 이미지를 사용하려면 `uploads/default-car.png` 위치에 이미지 파일을 추가하면 됩니다.

## 사진 업로드 주의사항

- 차량 사진은 `multer`로 처리하고 서버의 `uploads/` 폴더에 저장합니다.
- 허용 형식은 `jpg`, `jpeg`, `png`, `webp`입니다.
- 파일 크기는 최대 5MB입니다.
- Render 무료 환경에서는 서버 파일 시스템에 저장된 업로드 파일이 재배포 또는 인스턴스 재시작 후 유지되지 않을 수 있습니다.
- 장기 운영이 필요하면 S3, Cloudinary 같은 외부 이미지 스토리지 도입을 검토해야 합니다.

## 빌드

```bash
npm run build
```
