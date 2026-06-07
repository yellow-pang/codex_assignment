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

function getSettingsCollection() {
  return getCollection("settings");
}

function getUsersCollection() {
  return getCollection("users");
}

module.exports = {
  getCarsCollection,
  getChatRoomsCollection,
  getMessagesCollection,
  getSettingsCollection,
  getUsersCollection,
};
