const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { uploadsPath } = require("./paths");

const maxUploadFileSize = 5 * 1024 * 1024;
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

fs.mkdirSync(uploadsPath, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsPath,
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}${extension}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: maxUploadFileSize, files: 1 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      allowedImageExtensions.has(extension) &&
      allowedImageMimeTypes.has(file.mimetype)
    ) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        "차량 사진은 jpg, jpeg, png, webp 형식만 업로드할 수 있습니다.",
      ),
    );
  },
});

function createImageUrl(file) {
  return file ? `/uploads/${file.filename}` : "";
}

function handleUploadError(error, res, fallbackMessage, next) {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "차량 사진은 5MB 이하로 업로드해주세요."
        : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
          ? "차량 사진은 image 필드로 1장만 업로드할 수 있습니다."
        : "차량 사진 업로드를 처리하지 못했습니다.";

    res.status(400).json({ message });
    return;
  }

  if (error.message && error.message.includes("차량 사진은")) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (next) {
    next(error);
    return;
  }

  console.error(fallbackMessage, error.message);
  res.status(500).json({ message: fallbackMessage });
}

module.exports = {
  createImageUrl,
  handleUploadError,
  upload,
};
