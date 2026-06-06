const userRoles = new Set(["buyer", "dealer", "admin"]);
const dealerStatuses = new Set(["none", "pending", "approved", "rejected"]);
const maxMessageLength = 1000;

function normalizeCarInput(input) {
  const car = { ...input };
  delete car._id;
  delete car.dealerId;
  delete car.dealerName;
  delete car.dealerRole;

  if (car.company) {
    car.company = String(car.company).trim().toUpperCase();
  }

  if (car.price !== undefined && car.price !== "") {
    car.price = Number(car.price);
  }

  if (car.year !== undefined && car.year !== "") {
    car.year = Number(car.year);
  }

  if (car.mileage !== undefined && car.mileage !== "") {
    car.mileage = Number(car.mileage);
  }

  ["name", "type", "fuel", "location", "description", "imageUrl"].forEach(
    (fieldName) => {
      if (car[fieldName] !== undefined) {
        car[fieldName] = String(car[fieldName]).trim();
      }
    },
  );

  return car;
}

function normalizeChatMessageText(value) {
  return String(value || "").trim().slice(0, maxMessageLength);
}

function normalizeDealerStatus(value) {
  const status = String(value || "").trim();
  return dealerStatuses.has(status) ? status : "none";
}

function normalizeUserDocument(user) {
  if (!user) {
    return null;
  }

  const role = userRoles.has(user.role) ? user.role : "buyer";
  const defaultDealerStatus = role === "dealer" ? "approved" : "none";

  return {
    ...user,
    role,
    dealerStatus: normalizeDealerStatus(
      user.dealerStatus || defaultDealerStatus,
    ),
    dealerRequestedAt: user.dealerRequestedAt || null,
    dealerApprovedAt: user.dealerApprovedAt || null,
    dealerApprovedBy: user.dealerApprovedBy || null,
    dealerOnline: Boolean(user.dealerOnline),
    dealerConnectedAt: user.dealerConnectedAt || null,
    dealerLastSeenAt: user.dealerLastSeenAt || null,
  };
}

function normalizeUserInput(input) {
  return {
    uid: String(input.uid || "").trim(),
    email: String(input.email || "")
      .trim()
      .toLowerCase(),
    displayName: String(input.displayName || "").trim(),
    role: String(input.role || "").trim(),
  };
}

function validateUserInput(user) {
  if (!user.uid) return "사용자 UID가 필요합니다.";
  if (!user.email) return "이메일이 필요합니다.";
  if (!user.displayName) return "사용자 이름이 필요합니다.";

  return "";
}

module.exports = {
  dealerStatuses,
  normalizeCarInput,
  normalizeChatMessageText,
  normalizeDealerStatus,
  normalizeUserDocument,
  normalizeUserInput,
  userRoles,
  validateUserInput,
};
