const { createCarFilterById } = require("../utils/ids");
const {
  getCarsCollection,
  getChatbotMessagesCollection,
  getMessagesCollection,
} = require("./collections");
const { getDealerPresence } = require("./dealerPresence.service");
const {
  directContactText,
  getChatbotModel,
  getContextMessageLimit,
  runChatbotGraph,
} = require("./agentGraph.service");

const defaultDailyRoomLimit = 10;
const defaultDailyUserLimit = 20;

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
  if (!isChatbotEnabled()) {
    return null;
  }

  if (!context?.triggerType) {
    return null;
  }

  if (context.userMessage?.senderId !== context.room?.buyerId) {
    return null;
  }

  const usageLimit = await getChatbotUsageLimit(context);
  let graphResult;

  try {
    graphResult = await runChatbotGraph(context, usageLimit);
  } catch (error) {
    console.warn(`AI 상담 응답 생성 실패: ${error.message}`);
    graphResult = {
      text: `AI 상담 응답을 생성하지 못했습니다.\n${directContactText}`,
      intent: "generation_error",
      model: getChatbotModel(),
      provider: "openai",
      metadata: {
        generationError: true,
      },
    };
  }

  if (!graphResult?.text) {
    return null;
  }

  return {
    text: graphResult.text,
    model: graphResult.model || getChatbotModel(),
    provider: graphResult.provider || "openai",
    metadata: graphResult.metadata || {},
    intent: graphResult.intent || "general",
    triggerType: context.triggerType,
  };
}

async function getRecentRoomMessages(roomId, limit = getContextMessageLimit()) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 1, 50));
  const projection = {
    _id: 1,
    senderId: 1,
    senderName: 1,
    senderType: 1,
    isAgentMessage: 1,
    text: 1,
    createdAt: 1,
  };
  const [messages, chatbotMessages] = await Promise.all([
    getMessagesCollection()
      .find({ roomId }, { projection })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .toArray(),
    getChatbotMessagesCollection()
      .find({ roomId }, { projection })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .toArray(),
  ]);

  return [...messages, ...chatbotMessages]
    .sort(compareMessagesByCreatedAt)
    .slice(-safeLimit);
}

async function getChatbotUsageLimit(context) {
  const roomLimit = getPositiveEnvNumber(
    "AI_CHATBOT_DAILY_ROOM_LIMIT",
    defaultDailyRoomLimit,
  );
  const userLimit = getPositiveEnvNumber(
    "AI_CHATBOT_DAILY_USER_LIMIT",
    defaultDailyUserLimit,
  );
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [roomCount, userCount] = await Promise.all([
    getChatbotMessagesCollection().countDocuments({
      roomId: context.room.roomId,
      createdAt: { $gte: dayStart },
    }),
    getChatbotMessagesCollection().countDocuments({
      buyerId: context.room.buyerId,
      createdAt: { $gte: dayStart },
    }),
  ]);

  return {
    isLimited: roomCount >= roomLimit || userCount >= userLimit,
    roomCount,
    userCount,
    roomLimit,
    userLimit,
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

function isChatbotEnabled() {
  return String(process.env.AI_CHATBOT_ENABLED || "false").toLowerCase() === "true";
}

function getPositiveEnvNumber(name, fallback) {
  const value = Number(process.env[name]);

  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

module.exports = {
  buildAgentContext,
  generateAgentReply,
};
