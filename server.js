require("dotenv").config({ quiet: true });

const express = require("express");
const fs = require("fs");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const path = require("path");
const { connectDatabase, getCollection } = require("./db");

// Express 애플리케이션을 생성합니다.
const app = express();

// Render 같은 배포 환경에서는 process.env.PORT를 사용하고, 로컬에서는 3000번을 사용합니다.
const port = process.env.PORT || 3000;
const frontendDistPath = path.join(__dirname, "frontend", "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const uploadsPath = path.join(__dirname, "uploads");
const maxUploadFileSize = 5 * 1024 * 1024;
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

fs.mkdirSync(uploadsPath, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsPath,
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}${extension}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: maxUploadFileSize },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      allowedImageExtensions.has(extension) &&
      allowedImageMimeTypes.has(file.mimetype)
    ) {
      cb(null, true);
      return;
    }

    cb(new Error("차량 사진은 jpg, jpeg, png, webp 형식만 업로드할 수 있습니다."));
  },
});

// JSON 형식의 요청 body를 req.body에서 사용할 수 있게 합니다.
app.use(express.json());

// 업로드한 차량 사진을 React 화면에서 바로 볼 수 있게 제공합니다.
app.use("/uploads", express.static(uploadsPath));

// React 빌드 결과물이 있으면 Express가 정적 파일로 제공합니다.
app.use(express.static(frontendDistPath));

const carsRouter = express.Router();

function getCarsCollection() {
  return getCollection("cars");
}

function createCarFilterById(id) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }

  return { _id: Number(id) };
}

function normalizeCarInput(input) {
  const car = { ...input };
  delete car._id;

  if (car.company) {
    car.company = String(car.company).trim().toUpperCase();
  }

  if (car.price !== undefined && car.price !== "") {
    car.price = Number(car.price);
  }

  if (car.year !== undefined && car.year !== "") {
    car.year = Number(car.year);
  }

  if (car.mileage !== undefined && car.mileage !== "") {
    car.mileage = Number(car.mileage);
  }

  ["name", "type", "fuel", "location", "description", "imageUrl"].forEach(
    (fieldName) => {
      if (car[fieldName] !== undefined) {
        car[fieldName] = String(car[fieldName]).trim();
      }
    },
  );

  return car;
}

function createImageUrl(file) {
  return file ? `/uploads/${file.filename}` : "";
}

function handleUploadError(error, res, fallbackMessage) {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "차량 사진은 5MB 이하로 업로드해주세요."
        : "차량 사진 업로드를 처리하지 못했습니다.";

    res.status(400).json({ message });
    return;
  }

  if (error.message && error.message.includes("차량 사진은")) {
    res.status(400).json({ message: error.message });
    return;
  }

  console.error(fallbackMessage, error.message);
  res.status(500).json({ message: fallbackMessage });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchText(value) {
  return String(value || "").trim();
}

function normalizeNumericSearchValue(value) {
  return String(value || "").replace(/\s+/g, "");
}

function parseSearchNumber(value, fieldName) {
  const normalizedValue = normalizeNumericSearchValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    const error = new Error(`${fieldName} 검색 조건은 숫자로 입력해야 합니다.`);
    error.statusCode = 400;
    throw error;
  }

  return parsedValue;
}

function createCarSearchQuery(queryParams) {
  const keyword = normalizeSearchText(queryParams.keyword);
  const company = normalizeSearchText(queryParams.company).toUpperCase();
  const minPrice = parseSearchNumber(queryParams.minPrice, "가격");
  const maxPrice = parseSearchNumber(queryParams.maxPrice, "가격");
  const minYear = parseSearchNumber(queryParams.minYear, "연식");
  const maxYear = parseSearchNumber(queryParams.maxYear, "연식");
  const query = {};

  if (keyword) {
    query.name = { $regex: escapeRegExp(keyword), $options: "i" };
  }

  if (company) {
    query.company = company;
  }

  const priceQuery = {};
  if (minPrice !== undefined) {
    priceQuery.$gte = minPrice;
  }
  if (maxPrice !== undefined) {
    priceQuery.$lte = maxPrice;
  }
  if (Object.keys(priceQuery).length > 0) {
    query.price = priceQuery;
  }

  const yearQuery = {};
  if (minYear !== undefined) {
    yearQuery.$gte = minYear;
  }
  if (maxYear !== undefined) {
    yearQuery.$lte = maxYear;
  }
  if (Object.keys(yearQuery).length > 0) {
    query.year = yearQuery;
  }

  return query;
}

function getMongoDocument(result) {
  return result && result.value !== undefined ? result.value : result;
}

// 전체 자동차 목록을 JSON으로 응답합니다.
carsRouter.get("/", async (req, res) => {
  try {
    const cars = await getCarsCollection()
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    res.json(cars);
  } catch (error) {
    console.error("자동차 목록 조회 실패:", error.message);
    res.status(500).json({ message: "자동차 목록을 조회하지 못했습니다." });
  }
});

// 차량명, 제조사, 가격, 연식 조건을 함께 사용할 수 있는 복합 검색 API입니다.
carsRouter.get("/search", async (req, res) => {
  try {
    const query = createCarSearchQuery(req.query);
    const searchedCars = await getCarsCollection()
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    res.json(searchedCars);
  } catch (error) {
    console.error("자동차 검색 실패:", error.message);
    res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "자동차를 검색하지 못했습니다.",
    });
  }
});

// URL의 id와 일치하는 자동차 한 대를 조회합니다.
carsRouter.get("/:id", async (req, res) => {
  try {
    const car = await getCarsCollection().findOne(
      createCarFilterById(req.params.id),
    );

    if (!car) {
      return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
    }

    res.json(car);
  } catch (error) {
    console.error("자동차 상세 조회 실패:", error.message);
    res
      .status(500)
      .json({ message: "자동차 상세 정보를 조회하지 못했습니다." });
  }
});

// 요청 body와 차량 사진 파일을 받아 자동차 정보를 목록에 추가합니다.
carsRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const now = new Date();
    const newCar = {
      ...normalizeCarInput(req.body),
      imageUrl: createImageUrl(req.file),
      createdAt: now,
      updatedAt: now,
    };

    const result = await getCarsCollection().insertOne(newCar);

    res.status(201).json({ _id: result.insertedId, ...newCar });
  } catch (error) {
    console.error("자동차 등록 실패:", error.message);
    res.status(500).json({ message: "자동차를 등록하지 못했습니다." });
  }
});

// URL의 id와 일치하는 자동차 정보를 요청 body와 새 사진 파일의 값으로 수정합니다.
carsRouter.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const filter = createCarFilterById(req.params.id);
    const carInput = normalizeCarInput(req.body);

    if (req.file) {
      carInput.imageUrl = createImageUrl(req.file);
    }

    const update = {
      $set: {
        ...carInput,
        updatedAt: new Date(),
      },
    };

    const result = await getCarsCollection().findOneAndUpdate(filter, update, {
      returnDocument: "after",
    });
    const updatedCar = getMongoDocument(result);

    if (!updatedCar) {
      return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
    }

    res.json(updatedCar);
  } catch (error) {
    console.error("자동차 수정 실패:", error.message);
    res.status(500).json({ message: "자동차 정보를 수정하지 못했습니다." });
  }
});

// URL의 id와 일치하는 자동차를 목록에서 삭제합니다.
carsRouter.delete("/:id", async (req, res) => {
  try {
    const result = await getCarsCollection().findOneAndDelete(
      createCarFilterById(req.params.id),
    );
    const deletedCar = getMongoDocument(result);

    if (!deletedCar) {
      return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
    }

    res.json(deletedCar);
  } catch (error) {
    console.error("자동차 삭제 실패:", error.message);
    res.status(500).json({ message: "자동차를 삭제하지 못했습니다." });
  }
});

app.use("/api/cars", carsRouter);

// 기존 CRUD 앱의 /cars 호출은 다음 단계 전까지 호환용으로 유지합니다.
app.use("/cars", carsRouter);

app.use((error, req, res, next) => {
  handleUploadError(error, res, "파일 업로드 중 오류가 발생했습니다.");
});

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

async function startServer() {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("MongoDB 연결 실패:", error.message);
    process.exit(1);
  }
}

startServer();
