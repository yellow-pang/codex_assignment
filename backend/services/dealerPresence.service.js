const { getMongoDocument } = require("../utils/ids");
const { getChatRoomsCollection, getUsersCollection } = require("./collections");

async function emitDealerPresenceToRooms(io, dealerId, presence) {
  const eventName = presence.isOnline ? "dealer-online" : "dealer-offline";
  const rooms = await getChatRoomsCollection()
    .find({ dealerId }, { projection: { roomId: 1 } })
    .toArray();

  rooms.forEach((room) => {
    io.to(room.roomId).emit(eventName, presence);
  });
}

async function getDealerPresence(dealerId) {
  const dealer = await getUsersCollection().findOne(
    { uid: dealerId },
    {
      projection: {
        uid: 1,
        dealerOnline: 1,
        dealerConnectedAt: 1,
        dealerLastSeenAt: 1,
      },
    },
  );

  return {
    dealerId,
    isOnline: Boolean(dealer?.dealerOnline),
    connectedAt: dealer?.dealerConnectedAt || null,
    lastSeenAt: dealer?.dealerLastSeenAt || null,
  };
}

async function markDealerOffline(dealerId, socketId) {
  const now = new Date();
  const result = await getUsersCollection().findOneAndUpdate(
    { uid: dealerId },
    {
      $pull: { dealerSocketIds: socketId },
      $set: { dealerLastSeenAt: now, updatedAt: now },
    },
    { returnDocument: "after" },
  );
  const dealer = getMongoDocument(result);
  const remainingSocketIds = Array.isArray(dealer?.dealerSocketIds)
    ? dealer.dealerSocketIds
    : [];

  if (remainingSocketIds.length > 0) {
    return {
      dealerId,
      isOnline: true,
      connectedAt: dealer.dealerConnectedAt || null,
      lastSeenAt: dealer.dealerLastSeenAt || now,
    };
  }

  await getUsersCollection().updateOne(
    { uid: dealerId },
    {
      $set: {
        dealerOnline: false,
        dealerLastSeenAt: now,
        updatedAt: now,
      },
      $unset: { dealerConnectedAt: "" },
    },
  );

  return {
    dealerId,
    isOnline: false,
    connectedAt: null,
    lastSeenAt: now,
  };
}

async function markDealerOnline(dealerId, socketId) {
  const now = new Date();
  const result = await getUsersCollection().findOneAndUpdate(
    { uid: dealerId },
    {
      $set: {
        dealerOnline: true,
        dealerConnectedAt: now,
        dealerLastSeenAt: now,
        updatedAt: now,
      },
      $addToSet: { dealerSocketIds: socketId },
    },
    { returnDocument: "after" },
  );

  const dealer = getMongoDocument(result);
  return {
    dealerId,
    isOnline: Boolean(dealer?.dealerOnline),
    connectedAt: dealer?.dealerConnectedAt || now,
    lastSeenAt: dealer?.dealerLastSeenAt || now,
  };
}

async function resetDealerPresenceOnStartup() {
  const now = new Date();
  await getUsersCollection().updateMany(
    { dealerOnline: true },
    {
      $set: {
        dealerOnline: false,
        dealerLastSeenAt: now,
        updatedAt: now,
      },
      $unset: {
        dealerConnectedAt: "",
        dealerSocketIds: "",
      },
    },
  );
}

module.exports = {
  emitDealerPresenceToRooms,
  getDealerPresence,
  markDealerOffline,
  markDealerOnline,
  resetDealerPresenceOnStartup,
};
