const { createCarFilterById, createChatRoomId, getMongoDocument, normalizeUid } = require("../utils/ids");
const { normalizeChatMessageText } = require("../utils/normalizers");
const { buildAgentContext, generateAgentReply } = require("./agent.service");
const {
  getCarsCollection,
  getChatRoomsCollection,
  getMessagesCollection,
} = require("./collections");
const { getDealerPresence } = require("./dealerPresence.service");
const { findUserByUid } = require("./users.service");

function createChatError(message) {
  return { message };
}

async function createChatRoom({ buyerId: rawBuyerId, carId: rawCarId }) {
  const carId = String(rawCarId || "").trim();
  const buyerId = normalizeUid(rawBuyerId);

  if (!carId) {
    const error = new Error("차량 ID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  if (!buyerId) {
    const error = new Error("사용자 UID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  const buyer = await findUserByUid(buyerId);

  if (!buyer) {
    const error = new Error("사용자 정보를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  const car = await getCarsCollection().findOne(createCarFilterById(carId));

  if (!car) {
    const error = new Error("자동차를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  const dealerId = normalizeUid(car.dealerId);

  if (!dealerId) {
    const error = new Error("이 차량에는 상담 가능한 딜러 정보가 없습니다.");
    error.statusCode = 400;
    throw error;
  }

  if (buyerId === dealerId) {
    const error = new Error("자기 자신과는 상담방을 만들 수 없습니다.");
    error.statusCode = 400;
    throw error;
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

  return getMongoDocument(result);
}

async function findChatRoomById(roomId) {
  return getChatRoomsCollection().findOne({ roomId });
}

async function getChatRoomDetail(roomId) {
  if (!roomId) {
    const error = new Error("상담방 ID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  const room = await findChatRoomById(roomId);

  if (!room) {
    const error = new Error("상담방을 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  const dealerPresence = await getDealerPresence(room.dealerId);

  return {
    ...room,
    dealerOnline: dealerPresence.isOnline,
    dealerLastSeenAt: dealerPresence.lastSeenAt,
  };
}

async function handleChatMessage(payload) {
  const roomId = String(payload?.roomId || "").trim();
  const senderId = normalizeUid(payload?.senderId);
  const senderName = String(payload?.senderName || "사용자").trim() || "사용자";
  const text = normalizeChatMessageText(payload?.text);

  if (!roomId) {
    throw new Error("상담방 ID가 필요합니다.");
  }

  if (!senderId) {
    throw new Error("보낸 사람 UID가 필요합니다.");
  }

  if (!text) {
    throw new Error("메시지를 입력해주세요.");
  }

  const room = await findChatRoomById(roomId);

  if (!room) {
    throw new Error("상담방을 찾을 수 없습니다.");
  }

  if (senderId !== room.buyerId && senderId !== room.dealerId) {
    throw new Error("상담방 참여자만 메시지를 보낼 수 있습니다.");
  }

  const now = new Date();
  const message = {
    roomId,
    senderId,
    senderName,
    text,
    createdAt: now,
  };
  const result = await getMessagesCollection().insertOne(message);
  const savedMessage = { _id: String(result.insertedId), ...message };

  await getChatRoomsCollection().updateOne(
    { roomId },
    {
      $set: {
        lastMessage: text,
        lastMessageAt: now,
        updatedAt: now,
      },
    },
  );

  const agentContext = await buildAgentContext({
    room,
    userMessage: savedMessage,
  });
  const agentReply = await generateAgentReply(agentContext);

  // 딜러가 오프라인이고 agentReply가 있으면 이후 단계에서 AI 메시지를
  // messages 컬렉션에 저장하고 receive-message로 전송할 수 있다.
  return {
    message: savedMessage,
    agentReply,
  };
}

async function listChatRoomMessages(roomId) {
  if (!roomId) {
    const error = new Error("상담방 ID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  return getMessagesCollection()
    .find({ roomId })
    .sort({ createdAt: 1 })
    .toArray();
}

async function listChatRooms(uid) {
  const userId = normalizeUid(uid);

  if (!userId) {
    const error = new Error("사용자 UID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  return getChatRoomsCollection()
    .find({ $or: [{ buyerId: userId }, { dealerId: userId }] })
    .sort({ updatedAt: -1 })
    .toArray();
}

module.exports = {
  createChatError,
  createChatRoom,
  findChatRoomById,
  getChatRoomDetail,
  handleChatMessage,
  listChatRoomMessages,
  listChatRooms,
};
