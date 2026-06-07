const express = require("express");
const {
  requireAdmin,
  requireAuth,
  requireUserProfile,
} = require("../middleware/auth");
const { asyncRoute } = require("../middleware/errors");
const {
  listDealers,
  listUsers,
  requestDealerApproval,
  saveUserProfile,
  updateUserRole,
} = require("../services/users.service");

function createUsersRouter() {
  const router = express.Router();

  router.post("/", requireAuth, asyncRoute(async (req, res) => {
    res.status(201).json(await saveUserProfile(req.body, req.auth));
  }));

  router.get(
    "/",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      res.json(await listUsers());
    }),
  );

  router.get(
    "/me",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      res.json(req.userProfile);
    }),
  );

  router.post(
    "/dealer-request",
    requireAuth,
    requireUserProfile,
    asyncRoute(async (req, res) => {
      res.json(await requestDealerApproval(req.userProfile));
    }),
  );

  router.patch(
    "/:uid/role",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      const targetUid = String(req.params.uid || "").trim();
      res.json(
        await updateUserRole({
          targetUid,
          adminProfile: req.userProfile,
          role: req.body.role,
          dealerStatus: req.body.dealerStatus,
        }),
      );
    }),
  );

  router.get("/dealers", asyncRoute(async (req, res) => {
    res.json(await listDealers());
  }));

  return router;
}

module.exports = {
  createUsersRouter,
};
