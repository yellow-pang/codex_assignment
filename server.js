const express = require("express");
const fs = require("fs");
const path = require("path");

// Express 애플리케이션을 생성합니다.
const app = express();

// Render 같은 배포 환경에서는 process.env.PORT를 사용하고, 로컬에서는 3000번을 사용합니다.
const port = process.env.PORT || 3000;
const frontendDistPath = path.join(__dirname, "frontend", "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

// JSON 형식의 요청 body를 req.body에서 사용할 수 있게 합니다.
app.use(express.json());

// React 빌드 결과물이 있으면 Express가 정적 파일로 제공합니다.
app.use(express.static(frontendDistPath));

// MongoDB 연결 전까지 seed/fallback 용도로 사용하는 메모리 자동차 데이터입니다.
let cars = [
  { _id: 1, name: "Sonata", price: 2500, company: "HYUNDAI", year: 2023 },
  { _id: 2, name: "K5", price: 2700, company: "KIA", year: 2024 },
  { _id: 3, name: "SM6", price: 2300, company: "RENAULT", year: 2022 },
];

const carsRouter = express.Router();

// 전체 자동차 목록을 JSON으로 응답합니다.
carsRouter.get("/", (req, res) => {
  res.json(cars);
});

// company 쿼리 값이 있으면 해당 회사 자동차만 검색하고, 없으면 전체 목록을 응답합니다.
carsRouter.get("/search", (req, res) => {
  const { company } = req.query;

  if (!company) {
    return res.json(cars);
  }

  const searchedCars = cars.filter((car) => car.company === company);
  res.json(searchedCars);
});

// minPrice와 maxPrice 쿼리 값으로 가격 범위에 맞는 자동차만 응답합니다.
carsRouter.get("/filter", (req, res) => {
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

  const filteredCars = cars.filter((car) => {
    const isAboveMin = minPrice === undefined || car.price >= minPrice;
    const isBelowMax = maxPrice === undefined || car.price <= maxPrice;

    return isAboveMin && isBelowMax;
  });

  res.json(filteredCars);
});

// URL의 id와 일치하는 자동차 한 대를 조회합니다.
carsRouter.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const car = cars.find((item) => item._id === id);

  if (!car) {
    return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
  }

  res.json(car);
});

// 요청 body로 받은 자동차 정보를 목록에 추가합니다.
carsRouter.post("/", (req, res) => {
  const newCar = req.body;
  cars.push(newCar);

  res.status(201).json(newCar);
});

// URL의 id와 일치하는 자동차 정보를 요청 body의 값으로 수정합니다.
carsRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const carIndex = cars.findIndex((item) => item._id === id);

  if (carIndex === -1) {
    return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
  }

  cars[carIndex] = { ...cars[carIndex], ...req.body, _id: id };
  res.json(cars[carIndex]);
});

// URL의 id와 일치하는 자동차를 목록에서 삭제합니다.
carsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const carIndex = cars.findIndex((item) => item._id === id);

  if (carIndex === -1) {
    return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
  }

  const deletedCar = cars.splice(carIndex, 1);
  res.json(deletedCar[0]);
});

app.use("/api/cars", carsRouter);

// 기존 CRUD 앱의 /cars 호출은 다음 단계 전까지 호환용으로 유지합니다.
app.use("/cars", carsRouter);

// 브라우저나 클라이언트가 GET / 요청을 보내면 React 화면 또는 기본 문구를 응답합니다.
app.get("/", (req, res) => {
  if (fs.existsSync(frontendIndexPath)) {
    return res.sendFile(frontendIndexPath);
  }

  res.send("Hello Codex");
});

// React 화면 새로고침 시에도 index.html을 응답합니다.
app.get("*", (req, res) => {
  if (fs.existsSync(frontendIndexPath)) {
    return res.sendFile(frontendIndexPath);
  }

  res.status(404).json({ message: "페이지를 찾을 수 없습니다." });
});

// 3000번 포트에서 서버 실행을 시작합니다.
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
