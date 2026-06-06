const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function parseServiceAccountJson() {
  const rawValue = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();

  if (!rawValue) {
    const error = new Error(
      "Firebase Admin 서비스 계정 환경변수가 설정되지 않았습니다.",
    );
    error.statusCode = 500;
    error.publicMessage = "Firebase Admin 서버 설정이 필요합니다.";
    throw error;
  }

  try {
    const serviceAccount = JSON.parse(rawValue);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n",
      );
    }

    return serviceAccount;
  } catch (error) {
    const configError = new Error(
      "Firebase Admin 서비스 계정 JSON 형식이 올바르지 않습니다.",
    );
    configError.statusCode = 500;
    configError.publicMessage = "Firebase Admin 서버 설정을 확인해주세요.";
    throw configError;
  }
}

function getFirebaseAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(parseServiceAccountJson()),
    });
  }

  return getAuth();
}

async function verifyFirebaseIdToken(idToken) {
  return getFirebaseAdminAuth().verifyIdToken(idToken);
}

module.exports = {
  verifyFirebaseIdToken,
};
