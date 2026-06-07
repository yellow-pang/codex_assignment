const express = require("express");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const {
  frontendDistPath,
  frontendIndexPath,
  uploadsPath,
} = require("./config/paths");
const { handleUploadError } = require("./config/upload");
const { connectDatabase } = require("./db");
const { sendErrorResponse } = require("./middleware/errors");
const { createCarsRouter } = require("./routes/cars.routes");
const { createChatsRouter } = require("./routes/chats.routes");
const { createSettingsRouter } = require("./routes/settings.routes");
const { createUsersRouter } = require("./routes/users.routes");
const { resetDealerPresenceOnStartup } = require("./services/dealerPresence.service");
const { setupChatSocketHandlers } = require("./sockets/chat.socket");

const app = express();
const server = http.createServer(app);
function createSocketCorsOptions() {
  if (process.env.CLIENT_URL) {
    return { origin: process.env.CLIENT_URL };
  }

  return process.env.NODE_ENV === "production" ? undefined : { origin: true };
}

const io = new Server(server, {
  cors: createSocketCorsOptions(),
});
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsPath));
app.use(express.static(frontendDistPath));

const carsRouter = createCarsRouter();

app.use("/api/users", createUsersRouter());
app.use("/api/settings", createSettingsRouter());
app.use("/api/cars", carsRouter);
app.use("/api/chats", createChatsRouter());
app.use("/cars", carsRouter);

app.use((error, req, res, next) => {
  handleUploadError(
    error,
    res,
    "파일 업로드 중 오류가 발생했습니다.",
    next,
  );
});

app.get("/", (req, res) => {
  if (fs.existsSync(frontendIndexPath)) {
    return res.sendFile(frontendIndexPath);
  }

  res.send("Hello Codex");
});

app.get("*", (req, res) => {
  if (fs.existsSync(frontendIndexPath)) {
    return res.sendFile(frontendIndexPath);
  }

  res.status(404).json({ message: "페이지를 찾을 수 없습니다." });
});

app.use(sendErrorResponse);

async function startServer() {
  try {
    await connectDatabase();
    await resetDealerPresenceOnStartup();
    setupChatSocketHandlers(io);

    server.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("MongoDB 연결 실패:", error.message);
    process.exit(1);
  }
}

startServer();
