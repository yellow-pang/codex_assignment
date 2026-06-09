const { normalizeChatMessageText, validateChatMessageText } = require("../utils/normalizers");
const { getChatbotMessagesCollection, getCarsCollection } = require("./collections");
const {
  directContactText,
  getChatbotModel,
  getContextMessageLimit,
  runChatbotGraph,
} = require("./agentGraph.service");

const defaultDailyUserLimit = 20;
const siteRoomPrefix = "site";

async function listSiteChatbotMessages(userProfile) {
  const roomId = createSiteChatbotRoomId(userProfile);

  return getChatbotMessagesCollection()
    .find(
      { roomId, contextType: "site" },
      {
        projection: {
          _id: 1,
          roomId: 1,
          senderId: 1,
          senderName: 1,
          senderType: 1,
          isAgentMessage: 1,
          text: 1,
          createdAt: 1,
          triggerType: 1,
        },
      },
    )
    .sort({ createdAt: 1, _id: 1 })
    .limit(50)
    .toArray()
    .then((messages) => messages.map(normalizeMessageForClient));
}

async function createSiteChatbotReply({ userProfile, text: rawText }) {
  const text = normalizeChatMessageText(rawText);
  const validationMessage = validateChatMessageText(text);

  if (validationMessage) {
    const error = new Error(validationMessage);
    error.statusCode = 400;
    throw error;
  }

  const roomId = createSiteChatbotRoomId(userProfile);
  const now = new Date();
  const userMessage = {
    roomId,
    contextType: "site",
    buyerId: userProfile.uid,
    triggerType: "site_widget",
    senderId: userProfile.uid,
    senderName: userProfile.displayName || "사용자",
    senderType: "user",
    isAgentMessage: false,
    text,
    provider: "local",
    createdAt: now,
  };
  const userResult = await getChatbotMessagesCollection().insertOne(userMessage);
  const savedUserMessage = normalizeMessageForClient({
    _id: userResult.insertedId,
    ...userMessage,
  });
  const usageLimit = await getSiteChatbotUsageLimit(userProfile.uid);
  const context = await buildSiteChatbotContext({
    roomId,
    userProfile,
    userMessage: savedUserMessage,
  });
  const graphResult = await safeRunSiteChatbotGraph(context, usageLimit);
  const agentMessage = {
    roomId,
    contextType: "site",
    buyerId: userProfile.uid,
    triggerType: "site_widget",
    userMessageId: savedUserMessage._id,
    senderId: "ai-agent",
    senderName: "AI 상담원",
    senderType: "agent",
    isAgentMessage: true,
    text: graphResult.text,
    model: graphResult.model || getChatbotModel(),
    provider: graphResult.provider || "openai",
    metadata: {
      ...(graphResult.metadata || {}),
      intent: graphResult.intent,
    },
    createdAt: new Date(),
  };
  const agentResult = await getChatbotMessagesCollection().insertOne(agentMessage);

  return {
    userMessage: savedUserMessage,
    agentMessage: normalizeMessageForClient({
      _id: agentResult.insertedId,
      ...agentMessage,
    }),
  };
}

async function buildSiteChatbotContext({ roomId, userProfile, userMessage }) {
  const [cars, recentMessages] = await Promise.all([
    getCarsCollection()
      .find(
        {},
        {
          projection: {
            name: 1,
            company: 1,
            price: 1,
            year: 1,
            mileage: 1,
            fuel: 1,
            type: 1,
            location: 1,
          },
        },
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(8)
      .toArray(),
    getChatbotMessagesCollection()
      .find(
        { roomId, contextType: "site" },
        {
          projection: {
            _id: 1,
            senderId: 1,
            senderName: 1,
            senderType: 1,
            isAgentMessage: 1,
            text: 1,
            createdAt: 1,
          },
        },
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(getContextMessageLimit())
      .toArray(),
  ]);

  return {
    triggerType: "site_widget",
    room: {
      roomId,
      buyerId: userProfile.uid,
      dealerId: "",
      carId: "",
    },
    car: null,
    cars,
    messages: recentMessages.reverse(),
    dealerPresence: {
      isOnline: false,
      lastSeenAt: null,
    },
    userMessage,
  };
}

async function safeRunSiteChatbotGraph(context, usageLimit) {
  if (!isChatbotEnabled()) {
    return {
      text: `AI 상담 기능이 아직 활성화되지 않았습니다.\n${directContactText}`,
      intent: "disabled",
      model: getChatbotModel(),
      provider: "openai",
      metadata: { chatbotEnabled: false },
    };
  }

  try {
    return await runChatbotGraph(context, usageLimit);
  } catch (error) {
    console.warn(`사이트 AI 챗봇 응답 생성 실패: ${error.message}`);
    return {
      text: `AI 상담 응답을 생성하지 못했습니다.\n${directContactText}`,
      intent: "generation_error",
      model: getChatbotModel(),
      provider: "openai",
      metadata: { generationError: true },
    };
  }
}

async function getSiteChatbotUsageLimit(userId) {
  const userLimit = getPositiveEnvNumber(
    "AI_CHATBOT_DAILY_USER_LIMIT",
    defaultDailyUserLimit,
  );
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const userCount = await getChatbotMessagesCollection().countDocuments({
    buyerId: userId,
    senderType: "agent",
    createdAt: { $gte: dayStart },
  });

  return {
    isLimited: userCount >= userLimit,
    roomCount: userCount,
    userCount,
    roomLimit: userLimit,
    userLimit,
  };
}

function createSiteChatbotRoomId(userProfile) {
  return `${siteRoomPrefix}:${userProfile.uid}`;
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

function normalizeMessageForClient(message) {
  return {
    ...message,
    _id: String(message._id || ""),
  };
}

module.exports = {
  createSiteChatbotReply,
  listSiteChatbotMessages,
};
