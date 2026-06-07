const express = require("express");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const { asyncRoute } = require("../middleware/errors");
const {
  getCarFormSettings,
  updateCarFormSettings,
} = require("../services/settings.service");

function createSettingsRouter() {
  const router = express.Router();

  router.get(
    "/car-form",
    asyncRoute(async (req, res) => {
      res.json(await getCarFormSettings());
    }),
  );

  router.patch(
    "/car-form",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      res.json(await updateCarFormSettings(req.body, req.userProfile));
    }),
  );

  return router;
}

module.exports = {
  createSettingsRouter,
};
