const express = require("express");
const {
  createChatRoom,
  getChatRoomDetail,
  listChatRoomMessages,
  listChatRooms,
} = require("../services/chats.service");

function createChatsRouter() {
  const router = express.Router();

  router.post("/rooms", async (req, res) => {
    try {
      res.status(201).json(
        await createChatRoom({
          buyerId: req.body.buyerId,
          carId: req.body.carId,
        }),
      );
    } catch (error) {
      console.error("상담방 생성 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "상담방을 생성하지 못했습니다.",
      });
    }
  });

  router.get("/rooms", async (req, res) => {
    try {
      res.json(await listChatRooms(req.query.uid));
    } catch (error) {
      console.error("상담방 목록 조회 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "상담방 목록을 조회하지 못했습니다.",
      });
    }
  });

  router.get("/rooms/:roomId", async (req, res) => {
    try {
      const roomId = String(req.params.roomId || "").trim();
      res.json(await getChatRoomDetail(roomId));
    } catch (error) {
      console.error("상담방 상세 조회 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "상담방 정보를 조회하지 못했습니다.",
      });
    }
  });

  router.get("/rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = String(req.params.roomId || "").trim();
      res.json(await listChatRoomMessages(roomId));
    } catch (error) {
      console.error("메시지 조회 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode ? error.message : "메시지를 조회하지 못했습니다.",
      });
    }
  });

  return router;
}

module.exports = {
  createChatsRouter,
};
