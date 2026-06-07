const userRoles = new Set(["buyer", "dealer", "admin"]);
const dealerStatuses = new Set(["none", "pending", "approved", "rejected"]);
const maxMessageLength = 1000;
const currentYear = new Date().getFullYear();
const allowedCompanies = new Set([
  "HYUNDAI",
  "KIA",
  "RENAULT",
  "GENESIS",
  "CHEVROLET",
]);
const allowedCarTypes = new Set([
  "sedan",
  "SUV",
  "compact",
  "hatchback",
  "truck",
]);
const allowedFuelTypes = new Set([
  "gasoline",
  "diesel",
  "hybrid",
  "electric",
  "LPG",
]);

function normalizeCarInput(input) {
  const car = { ...input };
  delete car._id;
  delete car.dealerId;
  delete car.dealerName;
  delete car.dealerRole;
  delete car.imageUrls;

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
  return String(value || "").trim();
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
  if (user.displayName.length < 2 || user.displayName.length > 40) {
    return "사용자 이름은 2자 이상 40자 이하로 입력해주세요.";
  }

  return "";
}

function validateCarInput(car) {
  if (!car.name) return "자동차 이름을 입력해주세요.";
  if (car.name.length < 2 || car.name.length > 80) {
    return "자동차 이름은 2자 이상 80자 이하로 입력해주세요.";
  }

  if (!car.company) return "제조사를 입력해주세요.";
  if (car.company.length < 2 || car.company.length > 40) {
    return "제조사는 2자 이상 40자 이하로 입력해주세요.";
  }

  if (!Number.isInteger(car.year) || car.year < 1900 || car.year > currentYear) {
    return "올바른 연식을 입력해주세요.";
  }

  if (!Number.isFinite(car.price) || car.price <= 0 || car.price > 100000) {
    return "올바른 가격을 입력해주세요.";
  }

  if (!car.type) return "차종을 입력해주세요.";
  if (!allowedCarTypes.has(car.type)) {
    return "지원하는 차종을 선택해주세요.";
  }

  if (!car.fuel) return "연료를 입력해주세요.";
  if (!allowedFuelTypes.has(car.fuel)) {
    return "지원하는 연료를 선택해주세요.";
  }

  if (!Number.isFinite(car.mileage) || car.mileage < 0 || car.mileage > 2000000) {
    return "올바른 주행거리를 입력해주세요.";
  }

  if (!car.location) return "지역을 입력해주세요.";
  if (car.location.length < 2 || car.location.length > 40) {
    return "지역은 2자 이상 40자 이하로 입력해주세요.";
  }

  if (!car.description) return "차량 설명을 입력해주세요.";
  if (car.description.length < 10 || car.description.length > 1000) {
    return "차량 설명은 10자 이상 1000자 이하로 입력해주세요.";
  }

  return "";
}

function validateChatMessageText(text) {
  if (!text) return "메시지를 입력해주세요.";
  if (text.length > maxMessageLength) {
    return `메시지는 ${maxMessageLength}자 이하로 입력해주세요.`;
  }

  return "";
}

function validateRoleUpdateInput({ role, dealerStatus }) {
  if (!userRoles.has(role)) {
    return "사용자 역할 값이 올바르지 않습니다.";
  }

  if (!dealerStatuses.has(dealerStatus)) {
    return "딜러 상태 값이 올바르지 않습니다.";
  }

  if (role === "dealer" && dealerStatus !== "approved") {
    return "딜러 역할은 승인 상태와 함께 저장해야 합니다.";
  }

  if (role === "admin" && dealerStatus !== "none") {
    return "관리자 역할은 딜러 상태를 신청 없음으로 저장해야 합니다.";
  }

  if (role === "buyer" && dealerStatus === "approved") {
    return "일반 사용자는 승인된 딜러 상태로 저장할 수 없습니다.";
  }

  return "";
}

module.exports = {
  allowedCarTypes,
  allowedCompanies,
  allowedFuelTypes,
  dealerStatuses,
  maxMessageLength,
  normalizeCarInput,
  normalizeChatMessageText,
  normalizeDealerStatus,
  normalizeUserDocument,
  normalizeUserInput,
  userRoles,
  validateCarInput,
  validateChatMessageText,
  validateRoleUpdateInput,
  validateUserInput,
};
