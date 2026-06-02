# Codex CLI 실습 프로젝트

이 프로젝트는 Codex CLI 사용법을 연습하기 위한 프로젝트입니다.

## 자동차 목록 API 사용 예시

서버 실행:

```bash
npm start
```

전체 자동차 목록 조회:

```bash
curl http://localhost:3000/cars
```

회사명으로 자동차 검색:

```bash
curl "http://localhost:3000/cars/search?company=HYUNDAI"
```

`company` 값을 보내지 않으면 전체 목록을 반환합니다.

가격 범위로 자동차 필터링:

```bash
curl "http://localhost:3000/cars/filter?minPrice=2000&maxPrice=3000"
```

최소 가격만 지정:

```bash
curl "http://localhost:3000/cars/filter?minPrice=2500"
```

최대 가격만 지정:

```bash
curl "http://localhost:3000/cars/filter?maxPrice=2500"
```

## React 프론트엔드 실행 방법

Express API 서버 실행:

```bash
npm install
npm start
```

새 터미널에서 React 프론트엔드 실행:

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 Vite 개발 서버 주소로 접속하면 자동차 목록을 표로 확인할 수 있습니다.
React 코드는 `/api/cars`로 요청하고, Vite 프록시가 이 요청을 Express 서버의 `/cars` API로 전달합니다.
