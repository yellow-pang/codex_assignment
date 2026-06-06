const path = require("path");

const rootPath = path.join(__dirname, "..", "..");
const frontendDistPath = path.join(rootPath, "frontend", "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const uploadsPath = path.join(rootPath, "uploads");

module.exports = {
  frontendDistPath,
  frontendIndexPath,
  rootPath,
  uploadsPath,
};
