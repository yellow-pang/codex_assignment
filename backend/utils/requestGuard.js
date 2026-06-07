const crypto = require("crypto");

const activeRequests = new Map();

function createRequestKey(parts) {
  return parts
    .map((part) => String(part ?? "").trim())
    .join(":");
}

function createStableHash(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value ?? ""))
    .digest("hex")
    .slice(0, 24);
}

function assertNotDuplicateRequest({ keyParts, message, ttlMs }) {
  const now = Date.now();
  const key = createRequestKey(keyParts);
  const expiresAt = activeRequests.get(key);

  cleanupExpiredRequests(now);

  if (expiresAt && expiresAt > now) {
    const error = new Error(message || "같은 요청이 너무 빠르게 반복되었습니다.");
    error.statusCode = 429;
    throw error;
  }

  activeRequests.set(key, now + ttlMs);
}

function cleanupExpiredRequests(now = Date.now()) {
  for (const [key, expiresAt] of activeRequests.entries()) {
    if (expiresAt <= now) {
      activeRequests.delete(key);
    }
  }
}

module.exports = {
  assertNotDuplicateRequest,
  createStableHash,
};
