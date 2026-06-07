const { createImageUrl } = require("../config/upload");
const { createCarFilterById, getMongoDocument } = require("../utils/ids");
const { normalizeCarInput, validateCarInput } = require("../utils/normalizers");
const { assertNotDuplicateRequest, createStableHash } = require("../utils/requestGuard");
const { createCarSearchQuery } = require("../utils/search");
const { getCarsCollection } = require("./collections");
const { assertCarOwner, requireDealerProfile } = require("./users.service");

async function createCar(input, file, dealerProfile) {
  const now = new Date();
  const dealer = await requireDealerProfile(dealerProfile?.uid);
  const carInput = normalizeCarInput(input);
  validateOrThrow(validateCarInput(carInput));
  assertNotDuplicateRequest({
    keyParts: ["car:create", dealer.uid, createStableHash(carInput)],
    message: "같은 차량 등록 요청이 너무 빠르게 반복되었습니다.",
    ttlMs: 3000,
  });

  const newCar = {
    ...carInput,
    imageUrl: createImageUrl(file),
    dealerId: dealer.uid,
    dealerName: dealer.displayName,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getCarsCollection().insertOne(newCar);

  return { _id: result.insertedId, ...newCar };
}

async function deleteCar(id, dealerProfile) {
  const dealer = await requireDealerProfile(dealerProfile?.uid);
  const filter = createCarFilterById(id);
  assertNotDuplicateRequest({
    keyParts: ["car:delete", dealer.uid, id],
    message: "같은 차량 삭제 요청이 너무 빠르게 반복되었습니다.",
    ttlMs: 3000,
  });
  const existingCar = await getCarsCollection().findOne(filter);

  if (!existingCar) {
    const error = new Error("자동차를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  assertCarOwner(existingCar, dealer.uid);

  const result = await getCarsCollection().findOneAndDelete(filter);
  const deletedCar = getMongoDocument(result);

  if (!deletedCar) {
    const error = new Error("자동차를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  return deletedCar;
}

async function findCarById(id) {
  const car = await getCarsCollection().findOne(createCarFilterById(id));

  if (!car) {
    const error = new Error("자동차를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  return car;
}

async function listCars() {
  return getCarsCollection()
    .find({})
    .sort({ createdAt: -1, _id: -1 })
    .toArray();
}

async function searchCars(queryParams) {
  const query = createCarSearchQuery(queryParams);

  return getCarsCollection()
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .toArray();
}

async function updateCar(id, input, file, dealerProfile) {
  const filter = createCarFilterById(id);
  const dealer = await requireDealerProfile(dealerProfile?.uid);
  const existingCar = await getCarsCollection().findOne(filter);

  if (!existingCar) {
    const error = new Error("자동차를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  assertCarOwner(existingCar, dealer.uid);

  const carInput = normalizeCarInput(input);
  validateOrThrow(validateCarInput(carInput));
  assertNotDuplicateRequest({
    keyParts: ["car:update", dealer.uid, id, createStableHash(carInput)],
    message: "같은 차량 수정 요청이 너무 빠르게 반복되었습니다.",
    ttlMs: 3000,
  });

  if (file) {
    carInput.imageUrl = createImageUrl(file);
  }

  const result = await getCarsCollection().findOneAndUpdate(
    filter,
    {
      $set: {
        ...carInput,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  const updatedCar = getMongoDocument(result);

  if (!updatedCar) {
    const error = new Error("자동차를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  return updatedCar;
}

function validateOrThrow(validationMessage) {
  if (!validationMessage) {
    return;
  }

  const error = new Error(validationMessage);
  error.statusCode = 400;
  throw error;
}

module.exports = {
  createCar,
  deleteCar,
  findCarById,
  listCars,
  searchCars,
  updateCar,
};
