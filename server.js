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

    cb(
      new Error(
        "차량 사진은 jpg, jpeg, png, webp 형식만 업로드할 수 있습니다.",
      ),
    );
  },
});

// JSON 형식의 요청 body를 req.body에서 사용할 수 있게 합니다.
app.use(express.json());

// 업로드한 차량 사진을 React 화면에서 바로 볼 수 있게 제공합니다.
app.use("/uploads", express.static(uploadsPath));

// React 빌드 결과물이 있으면 Express가 정적 파일로 제공합니다.
app.use(express.static(frontendDistPath));

const carsRouter = express.Router();
const chatsRouter = express.Router();
const usersRouter = express.Router();
const userRoles = new Set(["buyer", "dealer", "admin"]);
const dealerStatuses = new Set(["none", "pending", "approved", "rejected"]);
const initialAdminEmails = new Set(
  String(process.env.INITIAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function getCarsCollection() {
  return getCollection("cars");
}

function getUsersCollection() {
  return getCollection("users");
}

function getChatRoomsCollection() {
  return getCollection("chatRooms");
}

function getMessagesCollection() {
  return getCollection("messages");
}

function createCarFilterById(id) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }

  return { _id: Number(id) };
}

function normalizeUid(value) {
  return String(value || "").trim();
}

function createChatRoomId({ buyerId, carId, dealerId }) {
  return `${carId}_${buyerId}_${dealerId}`;
}

function normalizeCarInput(input) {
  const car = { ...input };
  delete car._id;
  delete car.dealerId;
  delete car.dealerName;
  delete car.dealerRole;

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

function normalizeUserInput(input) {
  return {
    uid: String(input.uid || "").trim(),
    email: String(input.email || "")
      .trim()
      .toLowerCase(),
    displayName: String(input.displayName || "").trim(),
    role: String(input.role || "").trim(),
  };
}

function normalizeDealerStatus(value) {
  const status = String(value || "").trim();
  return dealerStatuses.has(status) ? status : "none";
}

function normalizeUserDocument(user) {
  if (!user) {
    return null;
  }

  const role = userRoles.has(user.role) ? user.role : "buyer";
  const defaultDealerStatus = role === "dealer" ? "approved" : "none";

  return {
    ...user,
    role,
    dealerStatus: normalizeDealerStatus(
      user.dealerStatus || defaultDealerStatus,
    ),
    dealerRequestedAt: user.dealerRequestedAt || null,
    dealerApprovedAt: user.dealerApprovedAt || null,
    dealerApprovedBy: user.dealerApprovedBy || null,
  };
}

function getInitialUserRole(email) {
  return initialAdminEmails.has(String(email || "").toLowerCase())
    ? "admin"
    : "buyer";
}

function validateUserInput(user) {
  if (!user.uid) return "사용자 UID가 필요합니다.";
  if (!user.email) return "이메일이 필요합니다.";
  if (!user.displayName) return "사용자 이름이 필요합니다.";

  return "";
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

async function findDealerByUid(uid) {
  const dealerId = normalizeUid(uid);

  if (!dealerId) {
    return null;
  }

  const dealer = await getUsersCollection().findOne({
    uid: dealerId,
    role: "dealer",
    dealerStatus: "approved",
  });

  return normalizeUserDocument(dealer);
}

async function findUserByUid(uid) {
  const userId = normalizeUid(uid);

  if (!userId) {
    return null;
  }

  return normalizeUserDocument(
    await getUsersCollection().findOne({ uid: userId }),
  );
}

async function requireDealerProfile(dealerId) {
  const dealer = await findDealerByUid(dealerId);

  if (!dealer) {
    const error = new Error("딜러 권한이 필요합니다.");
    error.statusCode = 403;
    throw error;
  }

  return dealer;
}

async function requireAdminProfile(adminUid) {
  const uid = String(adminUid || "").trim();

  if (!uid) {
    const error = new Error("관리자 UID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  const admin = normalizeUserDocument(
    await getUsersCollection().findOne({ uid }),
  );

  if (!admin || admin.role !== "admin") {
    const error = new Error("관리자 권한이 필요합니다.");
    error.statusCode = 403;
    throw error;
  }

  return admin;
}

function assertCarOwner(car, dealerId) {
  if (String(car.dealerId || "") !== String(dealerId || "")) {
    const error = new Error(
      "차량을 등록한 딜러만 수정하거나 삭제할 수 있습니다.",
    );
    error.statusCode = 403;
    throw error;
  }
}

function createRoleUpdate({
  admin,
  nextDealerStatus,
  nextRole,
  now,
  targetUser,
}) {
  const update = {
    role: nextRole,
    dealerStatus: nextDealerStatus,
    updatedAt: now,
  };

  if (nextRole === "dealer") {
    update.dealerStatus = "approved";
    update.dealerApprovedAt = now;
    update.dealerApprovedBy = admin.uid;
    update.dealerRequestedAt = targetUser.dealerRequestedAt || now;
    return update;
  }

  if (nextRole === "admin") {
    update.dealerStatus = "none";
    update.dealerApprovedAt = null;
    update.dealerApprovedBy = null;
    update.dealerRequestedAt = targetUser.dealerRequestedAt || null;
    return update;
  }

  update.role = "buyer";
  update.dealerApprovedAt = null;
  update.dealerApprovedBy = null;

  if (nextDealerStatus === "pending") {
    update.dealerRequestedAt = targetUser.dealerRequestedAt || now;
  } else if (nextDealerStatus === "rejected") {
    update.dealerRequestedAt = targetUser.dealerRequestedAt || now;
  } else {
    update.dealerStatus = "none";
    update.dealerRequestedAt = null;
  }

  return update;
}

usersRouter.post("/", async (req, res) => {
  try {
    const now = new Date();
    const userInput = normalizeUserInput(req.body);
    const validationMessage = validateUserInput(userInput);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const existingUser = normalizeUserDocument(
      await getUsersCollection().findOne({ uid: userInput.uid }),
    );
    const initialRole =
      existingUser?.role || getInitialUserRole(userInput.email);
    const initialDealerStatus =
      initialRole === "dealer"
        ? "approved"
        : existingUser?.dealerStatus || "none";

    const update = {
      $set: {
        email: userInput.email,
        displayName: userInput.displayName,
        role: initialRole,
        dealerStatus: initialDealerStatus,
        dealerRequestedAt: existingUser?.dealerRequestedAt || null,
        dealerApprovedAt: existingUser?.dealerApprovedAt || null,
        dealerApprovedBy: existingUser?.dealerApprovedBy || null,
        updatedAt: now,
      },
      $setOnInsert: {
        uid: userInput.uid,
        createdAt: now,
      },
    };

    const result = await getUsersCollection().findOneAndUpdate(
      { uid: userInput.uid },
      update,
      { upsert: true, returnDocument: "after" },
    );
    const savedUser = normalizeUserDocument(getMongoDocument(result));

    res.status(201).json(savedUser);
  } catch (error) {
    console.error("사용자 정보 저장 실패:", error.message);
    res.status(500).json({ message: "사용자 정보를 저장하지 못했습니다." });
  }
});

usersRouter.get("/", async (req, res) => {
  try {
    await requireAdminProfile(req.query.requesterUid);

    const users = await getUsersCollection()
      .find({})
      .sort({ createdAt: -1, email: 1 })
      .toArray();

    res.json(users.map(normalizeUserDocument));
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error.message);
    res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "사용자 목록을 조회하지 못했습니다.",
    });
  }
});

usersRouter.get("/me", async (req, res) => {
  try {
    const uid = String(req.query.uid || "").trim();

    if (!uid) {
      return res.status(400).json({ message: "사용자 UID가 필요합니다." });
    }

    const user = normalizeUserDocument(
      await getUsersCollection().findOne({ uid }),
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "사용자 정보를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (error) {
    console.error("내 정보 조회 실패:", error.message);
    res.status(500).json({ message: "사용자 정보를 조회하지 못했습니다." });
  }
});

usersRouter.post("/dealer-request", async (req, res) => {
  try {
    const requesterUid = String(req.body.requesterUid || "").trim();

    if (!requesterUid) {
      return res.status(400).json({ message: "사용자 UID가 필요합니다." });
    }

    const user = normalizeUserDocument(
      await getUsersCollection().findOne({ uid: requesterUid }),
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "사용자 정보를 찾을 수 없습니다." });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ message: "관리자는 딜러 신청이 필요하지 않습니다." });
    }

    if (user.role === "dealer" && user.dealerStatus === "approved") {
      return res.status(400).json({ message: "이미 승인된 딜러입니다." });
    }

    const now = new Date();
    const result = await getUsersCollection().findOneAndUpdate(
      { uid: requesterUid },
      {
        $set: {
          role: "buyer",
          dealerStatus: "pending",
          dealerRequestedAt: now,
          dealerApprovedAt: null,
          dealerApprovedBy: null,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );

    res.json(normalizeUserDocument(getMongoDocument(result)));
  } catch (error) {
    console.error("딜러 신청 실패:", error.message);
    res.status(500).json({ message: "딜러 신청을 처리하지 못했습니다." });
  }
});

usersRouter.patch("/:uid/role", async (req, res) => {
  try {
    const targetUid = String(req.params.uid || "").trim();
    const requesterUid = String(req.body.requesterUid || "").trim();
    const nextRole = String(req.body.role || "").trim();
    const nextDealerStatus = normalizeDealerStatus(req.body.dealerStatus);

    const admin = await requireAdminProfile(requesterUid);

    if (!targetUid) {
      return res.status(400).json({ message: "대상 사용자 UID가 필요합니다." });
    }

    if (!userRoles.has(nextRole)) {
      return res
        .status(400)
        .json({ message: "사용자 역할 값이 올바르지 않습니다." });
    }

    if (targetUid === admin.uid && nextRole !== "admin") {
      return res.status(400).json({
        message: "자기 자신의 관리자 권한은 해제할 수 없습니다.",
      });
    }

    const targetUser = normalizeUserDocument(
      await getUsersCollection().findOne({ uid: targetUid }),
    );

    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "대상 사용자를 찾을 수 없습니다." });
    }

    const now = new Date();
    const roleUpdate = createRoleUpdate({
      admin,
      nextDealerStatus,
      nextRole,
      now,
      targetUser,
    });

    const result = await getUsersCollection().findOneAndUpdate(
      { uid: targetUid },
      { $set: roleUpdate },
      { returnDocument: "after" },
    );

    res.json(normalizeUserDocument(getMongoDocument(result)));
  } catch (error) {
    console.error("사용자 역할 변경 실패:", error.message);
    res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "사용자 역할을 변경하지 못했습니다.",
    });
  }
});

usersRouter.get("/dealers", async (req, res) => {
  try {
    const dealers = await getUsersCollection()
      .find({ role: "dealer", dealerStatus: "approved" })
      .sort({ displayName: 1, createdAt: -1 })
      .toArray();

    res.json(dealers.map(normalizeUserDocument));
  } catch (error) {
    console.error("딜러 목록 조회 실패:", error.message);
    res.status(500).json({ message: "딜러 목록을 조회하지 못했습니다." });
  }
});

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
    const dealer = await requireDealerProfile(req.body.dealerId);
    const newCar = {
      ...normalizeCarInput(req.body),
      imageUrl: createImageUrl(req.file),
      dealerId: dealer.uid,
      dealerName: dealer.displayName,
      createdAt: now,
      updatedAt: now,
    };

    const result = await getCarsCollection().insertOne(newCar);

    res.status(201).json({ _id: result.insertedId, ...newCar });
  } catch (error) {
    console.error("자동차 등록 실패:", error.message);
    res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "자동차를 등록하지 못했습니다.",
    });
  }
});

// URL의 id와 일치하는 자동차 정보를 요청 body와 새 사진 파일의 값으로 수정합니다.
carsRouter.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const filter = createCarFilterById(req.params.id);
    const dealer = await requireDealerProfile(req.body.dealerId);
    const existingCar = await getCarsCollection().findOne(filter);

    if (!existingCar) {
      return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
    }

    assertCarOwner(existingCar, dealer.uid);

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
    res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "자동차 정보를 수정하지 못했습니다.",
    });
  }
});

// URL의 id와 일치하는 자동차를 목록에서 삭제합니다.
carsRouter.delete("/:id", async (req, res) => {
  try {
    const dealerId = req.body?.dealerId || req.query.dealerId;
    const dealer = await requireDealerProfile(dealerId);
    const filter = createCarFilterById(req.params.id);
    const existingCar = await getCarsCollection().findOne(filter);

    if (!existingCar) {
      return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
    }

    assertCarOwner(existingCar, dealer.uid);

    const result = await getCarsCollection().findOneAndDelete(filter);
    const deletedCar = getMongoDocument(result);

    if (!deletedCar) {
      return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
    }

    res.json(deletedCar);
  } catch (error) {
    console.error("자동차 삭제 실패:", error.message);
    res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "자동차를 삭제하지 못했습니다.",
    });
  }
});

chatsRouter.post("/rooms", async (req, res) => {
  try {
    const carId = String(req.body.carId || "").trim();
    const buyerId = normalizeUid(req.body.buyerId);

    if (!carId) {
      return res.status(400).json({ message: "차량 ID가 필요합니다." });
    }

    if (!buyerId) {
      return res.status(400).json({ message: "사용자 UID가 필요합니다." });
    }

    const buyer = await findUserByUid(buyerId);

    if (!buyer) {
      return res
        .status(404)
        .json({ message: "사용자 정보를 찾을 수 없습니다." });
    }

    const car = await getCarsCollection().findOne(createCarFilterById(carId));

    if (!car) {
      return res.status(404).json({ message: "자동차를 찾을 수 없습니다." });
    }

    const dealerId = normalizeUid(car.dealerId);

    if (!dealerId) {
      return res.status(400).json({
        message: "이 차량에는 상담 가능한 딜러 정보가 없습니다.",
      });
    }

    if (buyerId === dealerId) {
      return res.status(400).json({
        message: "자기 자신과는 상담방을 만들 수 없습니다.",
      });
    }

    const now = new Date();
    const roomId = createChatRoomId({ buyerId, carId, dealerId });
    const roomUpdate = {
      $set: {
        carId,
        buyerId,
        buyerName: buyer.displayName,
        dealerId,
        dealerName: car.dealerName || "딜러",
        carName: car.name || "",
        imageUrl: car.imageUrl || "",
        updatedAt: now,
      },
      $setOnInsert: {
        roomId,
        createdAt: now,
      },
    };

    const result = await getChatRoomsCollection().findOneAndUpdate(
      { roomId },
      roomUpdate,
      { upsert: true, returnDocument: "after" },
    );
    const chatRoom = getMongoDocument(result);

    res.status(201).json(chatRoom);
  } catch (error) {
    console.error("상담방 생성 실패:", error.message);
    res.status(500).json({ message: "상담방을 생성하지 못했습니다." });
  }
});

// GET /api/chats/rooms?uid=xxx - 내 상담방 목록 조회
chatsRouter.get("/rooms", async (req, res) => {
  try {
    const uid = normalizeUid(req.query.uid);

    if (!uid) {
      return res.status(400).json({ message: "사용자 UID가 필요합니다." });
    }

    const rooms = await getChatRoomsCollection()
      .find({ $or: [{ buyerId: uid }, { dealerId: uid }] })
      .sort({ updatedAt: -1 })
      .toArray();

    res.json(rooms);
  } catch (error) {
    console.error("상담방 목록 조회 실패:", error.message);
    res.status(500).json({ message: "상담방 목록을 조회하지 못했습니다." });
  }
});

// GET /api/chats/rooms/:roomId/messages - 이전 메시지 조회
chatsRouter.get("/rooms/:roomId/messages", async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();

    if (!roomId) {
      return res.status(400).json({ message: "상담방 ID가 필요합니다." });
    }

    const messages = await getMessagesCollection()
      .find({ roomId })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(messages);
  } catch (error) {
    console.error("메시지 조회 실패:", error.message);
    res.status(500).json({ message: "메시지를 조회하지 못했습니다." });
  }
});

app.use("/api/users", usersRouter);
app.use("/api/cars", carsRouter);
app.use("/api/chats", chatsRouter);
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
