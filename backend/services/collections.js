const { getCollection } = require("../db");

function getCarsCollection() {
  return getCollection("cars");
}

function getChatRoomsCollection() {
  return getCollection("chatRooms");
}

function getChatbotMessagesCollection() {
  return getCollection("chatbotMessages");
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
  getChatbotMessagesCollection,
  getMessagesCollection,
  getSettingsCollection,
  getUsersCollection,
};
