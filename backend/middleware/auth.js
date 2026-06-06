const { verifyFirebaseIdToken } = require("../config/firebaseAdmin");
const { findUserByUid } = require("../services/users.service");
const { createHttpError } = require("./errors");

function getBearerToken(req) {
  const headerValue = String(req.get("Authorization") || "").trim();
  const [scheme, token] = headerValue.split(/\s+/);

  if (scheme !== "Bearer" || !token) {
    return "";
  }

  return token;
}

async function requireAuth(req, res, next) {
  try {
    const idToken = getBearerToken(req);

    if (!idToken) {
      throw createHttpError(401, "인증이 필요합니다.");
    }

    const decodedToken = await verifyFirebaseIdToken(idToken);
    const userProfile = await findUserByUid(decodedToken.uid);

    req.auth = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || "",
    };
    req.userProfile = userProfile;

    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
      return;
    }

    next(createHttpError(401, "Firebase 인증 토큰을 확인하지 못했습니다."));
  }
}

function requireUserProfile(req, res, next) {
  if (!req.userProfile) {
    next(createHttpError(404, "사용자 정보를 찾을 수 없습니다."));
    return;
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.userProfile || req.userProfile.role !== "admin") {
    next(createHttpError(403, "관리자 권한이 필요합니다."));
    return;
  }

  next();
}

function requireDealer(req, res, next) {
  const user = req.userProfile;

  if (
    !user ||
    user.role !== "dealer" ||
    user.dealerStatus !== "approved"
  ) {
    next(createHttpError(403, "딜러 권한이 필요합니다."));
    return;
  }

  next();
}

module.exports = {
  requireAdmin,
  requireAuth,
  requireDealer,
  requireUserProfile,
};
