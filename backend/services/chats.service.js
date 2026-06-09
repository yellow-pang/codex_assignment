const { createCarFilterById, createChatRoomId, getMongoDocument, normalizeUid } = require("../utils/ids");
const {
  normalizeChatMessageText,
  validateChatMessageText,
} = require("../utils/normalizers");
const { assertNotDuplicateRequest, createStableHash } = require("../utils/requestGuard");
const { buildAgentContext, generateAgentReply } = require("./agent.service");
const {
  getCarsCollection,
  getChatbotMessagesCollection,
  getChatRoomsCollection,
  getMessagesCollection,
} = require("./collections");
const { getDealerPresence } = require("./dealerPresence.service");
const { findUserByUid } = require("./users.service");

function createChatError(message) {
  return { message };
}

function getPrimaryCarImageUrl(car) {
  if (Array.isArray(car?.imageUrls) && car.imageUrls.length > 0) {
    return car.imageUrls[0] || "";
  }

  return car?.imageUrl || "";
}

function applyCarSnapshotToRoom(room, car) {
  if (!room || !car) {
    return room;
  }

  return {
    ...room,
    carName: car.name || room.carName || "",
    imageUrl: getPrimaryCarImageUrl(car),
    imageUrls: Array.isArray(car.imageUrls) ? car.imageUrls : [],
  };
}

function assertChatRoomParticipant(room, userId) {
  if (userId !== room.buyerId && userId !== room.dealerId) {
    const error = new Error("상담방 참여자만 접근할 수 있습니다.");
    error.statusCode = 403;
    throw error;
  }
}

async function createChatRoom({ buyerProfile, carId: rawCarId }) {
  const carId = String(rawCarId || "").trim();
  const buyerId = normalizeUid(buyerProfile?.uid);

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

  const buyer = buyerProfile || (await findUserByUid(buyerId));

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
  assertNotDuplicateRequest({
    keyParts: ["chat-room:create", buyerId, roomId],
    message: "상담방 생성 요청이 너무 빠르게 반복되었습니다.",
    ttlMs: 3000,
  });
  const roomUpdate = {
    $set: {
      carId,
      buyerId,
      buyerName: buyer.displayName,
      dealerId,
      dealerName: car.dealerName || "딜러",
      carName: car.name || "",
      imageUrl: getPrimaryCarImageUrl(car),
      imageUrls: Array.isArray(car.imageUrls) ? car.imageUrls : [],
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

async function getChatRoomDetail(roomId, userId) {
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

  assertChatRoomParticipant(room, normalizeUid(userId));

  const [dealerPresence, car] = await Promise.all([
    getDealerPresence(room.dealerId),
    getCarsCollection().findOne(createCarFilterById(room.carId)),
  ]);
  const hydratedRoom = applyCarSnapshotToRoom(room, car);

  return {
    ...hydratedRoom,
    dealerOnline: dealerPresence.isOnline,
    dealerLastSeenAt: dealerPresence.lastSeenAt,
  };
}

async function handleChatMessage(payload, senderProfile) {
  const roomId = String(payload?.roomId || "").trim();
  const senderId = normalizeUid(senderProfile?.uid);
  const senderName =
    String(senderProfile?.displayName || "사용자").trim() || "사용자";
  const text = normalizeChatMessageText(payload?.text);

  if (!roomId) {
    throw new Error("상담방 ID가 필요합니다.");
  }

  if (!senderId) {
    throw new Error("보낸 사람 UID가 필요합니다.");
  }

  validateChatMessageOrThrow(text);

  const room = await findChatRoomById(roomId);

  if (!room) {
    throw new Error("상담방을 찾을 수 없습니다.");
  }

  assertChatRoomParticipant(room, senderId);
  assertNotDuplicateRequest({
    keyParts: ["chat:message", senderId, roomId, createStableHash(text)],
    message: "같은 메시지가 너무 빠르게 반복 전송되었습니다.",
    ttlMs: 1500,
  });

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
  const triggerType = getChatbotTriggerType({
    agentContext,
    requestAgent: payload?.requestAgent,
    senderId,
  });

  if (triggerType) {
    agentContext.triggerType = triggerType;
  }

  const agentReply = await generateAgentReply(agentContext);
  const agentMessage = agentReply
    ? await createChatbotMessage({
        room,
        userMessage: savedMessage,
        agentReply,
      })
    : null;

  if (agentMessage) {
    await getChatRoomsCollection().updateOne(
      { roomId },
      {
        $set: {
          lastMessage: agentMessage.text,
          lastMessageAt: agentMessage.createdAt,
          updatedAt: agentMessage.createdAt,
        },
      },
    );
  }

  return {
    message: savedMessage,
    agentMessage,
  };
}

async function listChatRoomMessages(roomId, userId) {
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

  assertChatRoomParticipant(room, normalizeUid(userId));

  const [messages, chatbotMessages] = await Promise.all([
    getMessagesCollection().find({ roomId }).toArray(),
    getChatbotMessagesCollection().find({ roomId }).toArray(),
  ]);

  return [...messages, ...chatbotMessages]
    .map(normalizeChatMessageForClient)
    .sort(compareMessagesByCreatedAt);
}

async function listChatRooms(userProfile) {
  const userId = normalizeUid(userProfile?.uid);

  if (!userId) {
    const error = new Error("사용자 UID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  const rooms = await getChatRoomsCollection()
    .find({ $or: [{ buyerId: userId }, { dealerId: userId }] })
    .sort({ updatedAt: -1, _id: -1 })
    .toArray();

  const carIds = [...new Set(rooms.map((room) => room.carId).filter(Boolean))];

  if (carIds.length === 0) {
    return rooms;
  }

  const cars = await getCarsCollection()
    .find({ $or: carIds.map((carId) => createCarFilterById(carId)) })
    .toArray();
  const carsById = new Map(cars.map((car) => [String(car._id), car]));

  return rooms.map((room) =>
    applyCarSnapshotToRoom(room, carsById.get(String(room.carId))),
  );
}

function validateChatMessageOrThrow(text) {
  const validationMessage = validateChatMessageText(text);

  if (!validationMessage) {
    return;
  }

  const error = new Error(validationMessage);
  error.statusCode = 400;
  throw error;
}

async function createChatbotMessage({ room, userMessage, agentReply }) {
  const now = new Date();
  const chatbotMessage = {
    roomId: room.roomId,
    buyerId: room.buyerId,
    dealerId: room.dealerId,
    carId: room.carId,
    triggerType: agentReply.triggerType,
    userMessageId: userMessage._id,
    senderId: "ai-agent",
    senderName: "AI 상담원",
    senderType: "agent",
    isAgentMessage: true,
    text: agentReply.text,
    model: agentReply.model,
    provider: agentReply.provider,
    metadata: {
      ...(agentReply.metadata || {}),
      intent: agentReply.intent,
    },
    createdAt: now,
  };
  const result = await getChatbotMessagesCollection().insertOne(chatbotMessage);

  return normalizeChatMessageForClient({
    _id: result.insertedId,
    ...chatbotMessage,
  });
}

function getChatbotTriggerType({ agentContext, requestAgent, senderId }) {
  if (senderId !== agentContext.room?.buyerId) {
    return "";
  }

  if (requestAgent) {
    return "user_ai_button";
  }

  if (agentContext.dealerPresence && !agentContext.dealerPresence.isOnline) {
    return "dealer_offline";
  }

  return "";
}

function normalizeChatMessageForClient(message) {
  return {
    ...message,
    _id: String(message._id || ""),
  };
}

function compareMessagesByCreatedAt(first, second) {
  const firstTime = new Date(first.createdAt || 0).getTime();
  const secondTime = new Date(second.createdAt || 0).getTime();

  if (firstTime !== secondTime) {
    return firstTime - secondTime;
  }

  return String(first._id || "").localeCompare(String(second._id || ""));
}

module.exports = {
  assertChatRoomParticipant,
  createChatError,
  createChatRoom,
  findChatRoomById,
  getChatRoomDetail,
  handleChatMessage,
  listChatRoomMessages,
  listChatRooms,
};
