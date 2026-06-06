const express = require("express");
const {
  findUserByUid,
  listDealers,
  listUsers,
  requestDealerApproval,
  saveUserProfile,
  updateUserRole,
} = require("../services/users.service");

function createUsersRouter() {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      res.status(201).json(await saveUserProfile(req.body));
    } catch (error) {
      console.error("사용자 정보 저장 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "사용자 정보를 저장하지 못했습니다.",
      });
    }
  });

  router.get("/", async (req, res) => {
    try {
      res.json(await listUsers(req.query.requesterUid));
    } catch (error) {
      console.error("사용자 목록 조회 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "사용자 목록을 조회하지 못했습니다.",
      });
    }
  });

  router.get("/me", async (req, res) => {
    try {
      const uid = String(req.query.uid || "").trim();

      if (!uid) {
        return res.status(400).json({ message: "사용자 UID가 필요합니다." });
      }

      const user = await findUserByUid(uid);

      if (!user) {
        return res
          .status(404)
          .json({ message: "사용자 정보를 찾을 수 없습니다." });
      }

      res.json(user);
    } catch (error) {
      console.error("내 정보 조회 실패:", error.message);
      res.status(500).json({ message: "사용자 정보를 조회하지 못했습니다." });
    }
  });

  router.post("/dealer-request", async (req, res) => {
    try {
      const requesterUid = String(req.body.requesterUid || "").trim();
      res.json(await requestDealerApproval(requesterUid));
    } catch (error) {
      console.error("딜러 신청 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "딜러 신청을 처리하지 못했습니다.",
      });
    }
  });

  router.patch("/:uid/role", async (req, res) => {
    try {
      const targetUid = String(req.params.uid || "").trim();
      res.json(
        await updateUserRole({
          targetUid,
          requesterUid: String(req.body.requesterUid || "").trim(),
          role: req.body.role,
          dealerStatus: req.body.dealerStatus,
        }),
      );
    } catch (error) {
      console.error("사용자 역할 변경 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "사용자 역할을 변경하지 못했습니다.",
      });
    }
  });

  router.get("/dealers", async (req, res) => {
    try {
      res.json(await listDealers());
    } catch (error) {
      console.error("딜러 목록 조회 실패:", error.message);
      res.status(500).json({ message: "딜러 목록을 조회하지 못했습니다." });
    }
  });

  return router;
}

module.exports = {
  createUsersRouter,
};
