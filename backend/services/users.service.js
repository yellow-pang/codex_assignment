const { getMongoDocument, normalizeUid } = require("../utils/ids");
const {
  normalizeDealerStatus,
  normalizeUserDocument,
  normalizeUserInput,
  userRoles,
  validateUserInput,
} = require("../utils/normalizers");
const { getUsersCollection } = require("./collections");

const initialAdminEmails = new Set(
  String(process.env.INITIAL_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function assertCarOwner(car, dealerId) {
  if (String(car.dealerId || "") !== String(dealerId || "")) {
    const error = new Error(
      "차량을 등록한 딜러만 수정하거나 삭제할 수 있습니다.",
    );
    error.statusCode = 403;
    throw error;
  }
}

function createRoleUpdate({
  admin,
  nextDealerStatus,
  nextRole,
  now,
  targetUser,
}) {
  const update = {
    role: nextRole,
    dealerStatus: nextDealerStatus,
    updatedAt: now,
  };

  if (nextRole === "dealer") {
    update.dealerStatus = "approved";
    update.dealerApprovedAt = now;
    update.dealerApprovedBy = admin.uid;
    update.dealerRequestedAt = targetUser.dealerRequestedAt || now;
    return update;
  }

  if (nextRole === "admin") {
    update.dealerStatus = "none";
    update.dealerApprovedAt = null;
    update.dealerApprovedBy = null;
    update.dealerRequestedAt = targetUser.dealerRequestedAt || null;
    return update;
  }

  update.role = "buyer";
  update.dealerApprovedAt = null;
  update.dealerApprovedBy = null;

  if (nextDealerStatus === "pending") {
    update.dealerRequestedAt = targetUser.dealerRequestedAt || now;
  } else if (nextDealerStatus === "rejected") {
    update.dealerRequestedAt = targetUser.dealerRequestedAt || now;
  } else {
    update.dealerStatus = "none";
    update.dealerRequestedAt = null;
  }

  return update;
}

async function findDealerByUid(uid) {
  const dealerId = normalizeUid(uid);

  if (!dealerId) {
    return null;
  }

  const dealer = await getUsersCollection().findOne({
    uid: dealerId,
    role: "dealer",
    dealerStatus: "approved",
  });

  return normalizeUserDocument(dealer);
}

async function findUserByUid(uid) {
  const userId = normalizeUid(uid);

  if (!userId) {
    return null;
  }

  return normalizeUserDocument(
    await getUsersCollection().findOne({ uid: userId }),
  );
}

function getInitialUserRole(email) {
  return initialAdminEmails.has(String(email || "").toLowerCase())
    ? "admin"
    : "buyer";
}

async function listDealers() {
  const dealers = await getUsersCollection()
    .find({ role: "dealer", dealerStatus: "approved" })
    .sort({ displayName: 1, createdAt: -1 })
    .toArray();

  return dealers.map(normalizeUserDocument);
}

async function listUsers() {
  const users = await getUsersCollection()
    .find({})
    .sort({ createdAt: -1, email: 1 })
    .toArray();

  return users.map(normalizeUserDocument);
}

async function requireAdminProfile(adminUid) {
  const uid = String(adminUid || "").trim();

  if (!uid) {
    const error = new Error("관리자 UID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  const admin = normalizeUserDocument(
    await getUsersCollection().findOne({ uid }),
  );

  if (!admin || admin.role !== "admin") {
    const error = new Error("관리자 권한이 필요합니다.");
    error.statusCode = 403;
    throw error;
  }

  return admin;
}

async function requireDealerProfile(dealerId) {
  const dealer = await findDealerByUid(dealerId);

  if (!dealer) {
    const error = new Error("딜러 권한이 필요합니다.");
    error.statusCode = 403;
    throw error;
  }

  return dealer;
}

async function requestDealerApproval(userProfile) {
  const user = userProfile;

  if (!user) {
    const error = new Error("사용자 정보를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "admin") {
    const error = new Error("관리자는 딜러 신청이 필요하지 않습니다.");
    error.statusCode = 400;
    throw error;
  }

  if (user.role === "dealer" && user.dealerStatus === "approved") {
    const error = new Error("이미 승인된 딜러입니다.");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const result = await getUsersCollection().findOneAndUpdate(
    { uid: user.uid },
    {
      $set: {
        role: "buyer",
        dealerStatus: "pending",
        dealerRequestedAt: now,
        dealerApprovedAt: null,
        dealerApprovedBy: null,
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  );

  return normalizeUserDocument(getMongoDocument(result));
}

async function saveUserProfile(input, authUser = {}) {
  const now = new Date();
  const userInput = normalizeUserInput({
    ...input,
    uid: authUser.uid || input.uid,
    email: authUser.email || input.email,
  });
  const validationMessage = validateUserInput(userInput);

  if (validationMessage) {
    const error = new Error(validationMessage);
    error.statusCode = 400;
    throw error;
  }

  const existingUser = normalizeUserDocument(
    await getUsersCollection().findOne({ uid: userInput.uid }),
  );
  const initialRole = existingUser?.role || getInitialUserRole(userInput.email);
  const initialDealerStatus =
    initialRole === "dealer"
      ? "approved"
      : existingUser?.dealerStatus || "none";

  const update = {
    $set: {
      email: userInput.email,
      displayName: userInput.displayName,
      role: initialRole,
      dealerStatus: initialDealerStatus,
      dealerRequestedAt: existingUser?.dealerRequestedAt || null,
      dealerApprovedAt: existingUser?.dealerApprovedAt || null,
      dealerApprovedBy: existingUser?.dealerApprovedBy || null,
      updatedAt: now,
    },
    $setOnInsert: {
      uid: userInput.uid,
      createdAt: now,
    },
  };

  const result = await getUsersCollection().findOneAndUpdate(
    { uid: userInput.uid },
    update,
    { upsert: true, returnDocument: "after" },
  );

  return normalizeUserDocument(getMongoDocument(result));
}

async function updateUserRole({ targetUid, adminProfile, role, dealerStatus }) {
  const admin = adminProfile;
  const nextRole = String(role || "").trim();
  const nextDealerStatus = normalizeDealerStatus(dealerStatus);

  if (!admin || admin.role !== "admin") {
    const error = new Error("관리자 권한이 필요합니다.");
    error.statusCode = 403;
    throw error;
  }

  if (!targetUid) {
    const error = new Error("대상 사용자 UID가 필요합니다.");
    error.statusCode = 400;
    throw error;
  }

  if (!userRoles.has(nextRole)) {
    const error = new Error("사용자 역할 값이 올바르지 않습니다.");
    error.statusCode = 400;
    throw error;
  }

  if (targetUid === admin.uid && nextRole !== "admin") {
    const error = new Error("자기 자신의 관리자 권한은 해제할 수 없습니다.");
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await findUserByUid(targetUid);

  if (!targetUser) {
    const error = new Error("대상 사용자를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const roleUpdate = createRoleUpdate({
    admin,
    nextDealerStatus,
    nextRole,
    now,
    targetUser,
  });

  const result = await getUsersCollection().findOneAndUpdate(
    { uid: targetUid },
    { $set: roleUpdate },
    { returnDocument: "after" },
  );

  return normalizeUserDocument(getMongoDocument(result));
}

module.exports = {
  assertCarOwner,
  findUserByUid,
  listDealers,
  listUsers,
  normalizeUserDocument,
  requestDealerApproval,
  requireAdminProfile,
  requireDealerProfile,
  saveUserProfile,
  updateUserRole,
};
