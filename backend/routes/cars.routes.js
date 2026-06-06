const express = require("express");
const { upload } = require("../config/upload");
const {
  createCar,
  deleteCar,
  findCarById,
  listCars,
  searchCars,
  updateCar,
} = require("../services/cars.service");

function createCarsRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      res.json(await listCars());
    } catch (error) {
      console.error("자동차 목록 조회 실패:", error.message);
      res.status(500).json({ message: "자동차 목록을 조회하지 못했습니다." });
    }
  });

  router.get("/search", async (req, res) => {
    try {
      res.json(await searchCars(req.query));
    } catch (error) {
      console.error("자동차 검색 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "자동차를 검색하지 못했습니다.",
      });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      res.json(await findCarById(req.params.id));
    } catch (error) {
      console.error("자동차 상세 조회 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "자동차 상세 정보를 조회하지 못했습니다.",
      });
    }
  });

  router.post("/", upload.single("image"), async (req, res) => {
    try {
      res.status(201).json(await createCar(req.body, req.file));
    } catch (error) {
      console.error("자동차 등록 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "자동차를 등록하지 못했습니다.",
      });
    }
  });

  router.put("/:id", upload.single("image"), async (req, res) => {
    try {
      res.json(await updateCar(req.params.id, req.body, req.file));
    } catch (error) {
      console.error("자동차 수정 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "자동차 정보를 수정하지 못했습니다.",
      });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const dealerId = req.body?.dealerId || req.query.dealerId;
      res.json(await deleteCar(req.params.id, dealerId));
    } catch (error) {
      console.error("자동차 삭제 실패:", error.message);
      res.status(error.statusCode || 500).json({
        message: error.statusCode
          ? error.message
          : "자동차를 삭제하지 못했습니다.",
      });
    }
  });

  return router;
}

module.exports = {
  createCarsRouter,
};
