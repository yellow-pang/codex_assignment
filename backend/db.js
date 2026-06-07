const dns = require("dns");
const { MongoClient } = require("mongodb");

const databaseName = process.env.DB_NAME || "car_market";

const collectionNames = {
  cars: process.env.COLLECTION_CARS || "cars",
  users: process.env.COLLECTION_USERS || "users",
  chatRooms: process.env.COLLECTION_CHAT_ROOMS || "chat_rooms",
  messages: process.env.COLLECTION_MESSAGES || "messages",
  settings: process.env.COLLECTION_SETTINGS || "settings",
};

let client;
let database;

async function connectDatabase() {
  if (database) {
    return database;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI 환경변수가 설정되지 않았습니다.");
  }

  configureMongoDnsServers();

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(databaseName);

  await database.command({ ping: 1 });
  await ensureBaseCollections();
  await ensureBaseIndexes();
  console.log(`MongoDB connected: ${databaseName}`);

  return database;
}

function configureMongoDnsServers() {
  const dnsServers = process.env.MONGODB_DNS_SERVERS;

  if (!dnsServers) {
    return;
  }

  const servers = dnsServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length === 0) {
    return;
  }

  dns.setServers(servers);
  console.log(`MongoDB DNS servers: ${servers.join(", ")}`);
}

async function ensureBaseCollections() {
  const existingCollections = await database.listCollections().toArray();
  const existingCollectionNames = new Set(existingCollections.map((collection) => collection.name));

  await Promise.all(
    Object.values(collectionNames).map(async (collectionName) => {
      if (!existingCollectionNames.has(collectionName)) {
        await database.createCollection(collectionName);
      }
    })
  );
}

async function ensureBaseIndexes() {
  const indexDefinitions = [
    {
      collectionName: collectionNames.users,
      keys: { uid: 1 },
      options: { unique: true, name: "unique_users_uid" },
    },
    {
      collectionName: collectionNames.chatRooms,
      keys: { roomId: 1 },
      options: { unique: true, name: "unique_chat_rooms_roomId" },
    },
    {
      collectionName: collectionNames.chatRooms,
      keys: { buyerId: 1, updatedAt: -1 },
      options: { name: "chat_rooms_buyer_updatedAt" },
    },
    {
      collectionName: collectionNames.chatRooms,
      keys: { dealerId: 1, updatedAt: -1 },
      options: { name: "chat_rooms_dealer_updatedAt" },
    },
    {
      collectionName: collectionNames.messages,
      keys: { roomId: 1, createdAt: 1, _id: 1 },
      options: { name: "messages_room_createdAt_id" },
    },
    {
      collectionName: collectionNames.cars,
      keys: { createdAt: -1, _id: -1 },
      options: { name: "cars_createdAt_id" },
    },
    {
      collectionName: collectionNames.settings,
      keys: { key: 1 },
      options: { unique: true, name: "unique_settings_key" },
    },
  ];

  for (const definition of indexDefinitions) {
    try {
      await database
        .collection(definition.collectionName)
        .createIndex(definition.keys, definition.options);
    } catch (error) {
      console.warn(
        `MongoDB index 생성 실패(${definition.options.name}): ${error.message}`,
      );
    }
  }
}

function getDatabase() {
  if (!database) {
    throw new Error("MongoDB가 아직 연결되지 않았습니다.");
  }

  return database;
}

function getCollection(name) {
  return getDatabase().collection(collectionNames[name] || name);
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}

module.exports = {
  collectionNames,
  connectDatabase,
  getCollection,
  getDatabase,
  closeDatabase,
};
