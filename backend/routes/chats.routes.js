const express = require("express");
const { requireAuth, requireUserProfile } = require("../middleware/auth");
const { asyncRoute } = require("../middleware/errors");
const {
  createChatRoom,
  getChatRoomDetail,
  listChatRoomMessages,
  listChatRooms,
} = require("../services/chats.service");
const {
  createSiteChatbotReply,
  listSiteChatbotMessages,
} = require("../services/siteChatbot.service");

function createChatsRouter() {
  const router = express.Router();

  router.post(
    "/rooms",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      res.status(201).json(
        await createChatRoom({
          buyerProfile: req.userProfile,
          carId: req.body.carId,
        }),
      );
    }),
  );

  router.get(
    "/rooms",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      res.json(await listChatRooms(req.userProfile));
    }),
  );

  router.get(
    "/site-bot/messages",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      res.json(await listSiteChatbotMessages(req.userProfile));
    }),
  );

  router.post(
    "/site-bot/messages",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      res.status(201).json(
        await createSiteChatbotReply({
          userProfile: req.userProfile,
          text: req.body.text,
        }),
      );
    }),
  );

  router.get(
    "/rooms/:roomId",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      const roomId = String(req.params.roomId || "").trim();
      res.json(await getChatRoomDetail(roomId, req.userProfile.uid));
    }),
  );

  router.get(
    "/rooms/:roomId/messages",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      const roomId = String(req.params.roomId || "").trim();
      res.json(await listChatRoomMessages(roomId, req.userProfile.uid));
    }),
  );

  return router;
}

module.exports = {
  createChatsRouter,
};
