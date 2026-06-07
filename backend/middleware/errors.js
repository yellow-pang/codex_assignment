function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function sendErrorResponse(error, req, res, next) {
  const statusCode = Number(error.statusCode) || 500;
  const message =
    statusCode >= 500
      ? error.publicMessage || "요청을 처리하는 중 오류가 발생했습니다."
      : error.message;

  if (statusCode >= 500) {
    console.error("서버 오류:", error.message);
  }

  res.status(statusCode).json({ message });
}

module.exports = {
  asyncRoute,
  createHttpError,
  sendErrorResponse,
};
