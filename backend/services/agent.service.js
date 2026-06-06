const { createCarFilterById } = require("../utils/ids");
const {
  getCarsCollection,
  getMessagesCollection,
} = require("./collections");
const { getDealerPresence } = require("./dealerPresence.service");

const agentContextMessageLimit = 20;

function createAgentCarContext(car) {
  if (!car) {
    return null;
  }

  return {
    id: String(car._id || ""),
    name: car.name || "",
    company: car.company || "",
    price: car.price ?? null,
    year: car.year ?? null,
    mileage: car.mileage ?? null,
    location: car.location || "",
    fuel: car.fuel || "",
    type: car.type || "",
    description: car.description || "",
  };
}

async function buildAgentContext({ room, userMessage }) {
  const [car, messages, dealerPresence] = await Promise.all([
    getCarsCollection().findOne(createCarFilterById(room.carId)),
    getRecentRoomMessages(room.roomId),
    getDealerPresence(room.dealerId),
  ]);

  return {
    room: {
      roomId: room.roomId,
      buyerId: room.buyerId,
      dealerId: room.dealerId,
      carId: room.carId,
    },
    car: createAgentCarContext(car),
    messages,
    dealerPresence,
    userMessage: {
      senderId: userMessage.senderId,
      senderName: userMessage.senderName,
      text: userMessage.text,
      createdAt: userMessage.createdAt,
    },
  };
}

async function generateAgentReply(context) {
  // 실제 AI API 연동은 이후 단계에서 이 함수 내부만 교체해 확장한다.
  // 현재 단계에서는 상담 동작을 바꾸지 않기 위해 자동 응답을 만들지 않는다.
  return null;
}

async function getRecentRoomMessages(roomId, limit = agentContextMessageLimit) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 1, 50));
  const messages = await getMessagesCollection()
    .find(
      { roomId },
      {
        projection: {
          _id: 0,
          senderId: 1,
          senderName: 1,
          text: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .toArray();

  return messages.reverse();
}

module.exports = {
  buildAgentContext,
  generateAgentReply,
};
