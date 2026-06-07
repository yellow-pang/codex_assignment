const {
  createChatError,
  findChatRoomById,
  handleChatMessage,
} = require("../services/chats.service");
const { verifyFirebaseIdToken } = require("../config/firebaseAdmin");
const {
  emitDealerPresenceToRooms,
  getDealerPresence,
  markDealerOffline,
  markDealerOnline,
} = require("../services/dealerPresence.service");
const { findUserByUid } = require("../services/users.service");
const { normalizeUid } = require("../utils/ids");

function setupChatSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || "").trim();

      if (!token) {
        next(new Error("인증이 필요합니다."));
        return;
      }

      const decodedToken = await verifyFirebaseIdToken(token);
      const userProfile = await findUserByUid(decodedToken.uid);

      if (!userProfile) {
        next(new Error("사용자 정보를 찾을 수 없습니다."));
        return;
      }

      socket.data.auth = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
      };
      socket.data.userProfile = userProfile;
      next();
    } catch (error) {
      next(new Error("Firebase 인증 토큰을 확인하지 못했습니다."));
    }
  });

  io.on("connection", (socket) => {
    socket.data.joinedRooms = new Set();

    socket.on("join-room", async (payload = {}) => {
      try {
        const roomId = String(payload.roomId || "").trim();
        const userId = normalizeUid(socket.data.userProfile?.uid);

        if (!roomId || !userId) {
          socket.emit(
            "chat-error",
            createChatError("상담방 ID와 사용자 UID가 필요합니다."),
          );
          return;
        }

        const room = await findChatRoomById(roomId);

        if (!room) {
          socket.emit("chat-error", createChatError("상담방을 찾을 수 없습니다."));
          return;
        }

        if (userId !== room.buyerId && userId !== room.dealerId) {
          socket.emit(
            "chat-error",
            createChatError("상담방 참여자만 입장할 수 있습니다."),
          );
          return;
        }

        socket.join(roomId);
        socket.data.joinedRooms.add(roomId);
        socket.data.userId = userId;

        if (userId === room.dealerId) {
          socket.data.dealerId = room.dealerId;
          const presence = await markDealerOnline(room.dealerId, socket.id);
          await emitDealerPresenceToRooms(io, room.dealerId, presence);
          return;
        }

        const presence = await getDealerPresence(room.dealerId);
        socket.emit(
          presence.isOnline ? "dealer-online" : "dealer-offline",
          presence,
        );
      } catch (error) {
        console.error("상담방 입장 처리 실패:", error.message);
        socket.emit("chat-error", createChatError("상담방에 입장하지 못했습니다."));
      }
    });

    socket.on("send-message", async (payload = {}) => {
      try {
        const { message } = await handleChatMessage(
          payload,
          socket.data.userProfile,
        );
        io.to(message.roomId).emit("receive-message", message);
      } catch (error) {
        socket.emit("chat-error", createChatError(error.message));
      }
    });

    socket.on("leave-room", (payload = {}) => {
      const roomId = String(payload.roomId || "").trim();

      if (!roomId) {
        return;
      }

      socket.leave(roomId);
      socket.data.joinedRooms.delete(roomId);
    });

    socket.on("disconnect", async () => {
      const dealerId = socket.data.dealerId;

      if (!dealerId) {
        return;
      }

      try {
        const presence = await markDealerOffline(dealerId, socket.id);
        await emitDealerPresenceToRooms(io, dealerId, presence);
      } catch (error) {
        console.error("딜러 오프라인 처리 실패:", error.message);
      }
    });
  });
}

module.exports = {
  setupChatSocketHandlers,
};
