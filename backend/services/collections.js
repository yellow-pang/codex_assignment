const { getCollection } = require("../db");

function getCarsCollection() {
  return getCollection("cars");
}

function getChatRoomsCollection() {
  return getCollection("chatRooms");
}

function getMessagesCollection() {
  return getCollection("messages");
}

function getUsersCollection() {
  return getCollection("users");
}

module.exports = {
  getCarsCollection,
  getChatRoomsCollection,
  getMessagesCollection,
  getUsersCollection,
};
