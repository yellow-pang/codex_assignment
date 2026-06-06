const { ObjectId } = require("mongodb");

function createCarFilterById(id) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }

  return { _id: Number(id) };
}

function createChatRoomId({ buyerId, carId, dealerId }) {
  return `${carId}_${buyerId}_${dealerId}`;
}

function getMongoDocument(result) {
  return result && result.value !== undefined ? result.value : result;
}

function normalizeUid(value) {
  return String(value || "").trim();
}

module.exports = {
  createCarFilterById,
  createChatRoomId,
  getMongoDocument,
  normalizeUid,
};
