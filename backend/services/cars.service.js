const { createImageUrl } = require("../config/upload");
const { createCarFilterById, getMongoDocument } = require("../utils/ids");
const { normalizeCarInput } = require("../utils/normalizers");
const { createCarSearchQuery } = require("../utils/search");
const { getCarsCollection } = require("./collections");
const { assertCarOwner, requireDealerProfile } = require("./users.service");

async function createCar(input, file) {
  const now = new Date();
  const dealer = await requireDealerProfile(input.dealerId);
  const newCar = {
    ...normalizeCarInput(input),
    imageUrl: createImageUrl(file),
    dealerId: dealer.uid,
    dealerName: dealer.displayName,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getCarsCollection().insertOne(newCar);

  return { _id: result.insertedId, ...newCar };
}

async function deleteCar(id, dealerId) {
  const dealer = await requireDealerProfile(dealerId);
  const filter = createCarFilterById(id);
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

async function updateCar(id, input, file) {
  const filter = createCarFilterById(id);
  const dealer = await requireDealerProfile(input.dealerId);
  const existingCar = await getCarsCollection().findOne(filter);

  if (!existingCar) {
    const error = new Error("자동차를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  assertCarOwner(existingCar, dealer.uid);

  const carInput = normalizeCarInput(input);

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

module.exports = {
  createCar,
  deleteCar,
  findCarById,
  listCars,
  searchCars,
  updateCar,
};
