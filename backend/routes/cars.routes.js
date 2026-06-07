const express = require("express");
const { upload } = require("../config/upload");
const {
  requireAuth,
  requireDealer,
} = require("../middleware/auth");
const { asyncRoute } = require("../middleware/errors");
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

  router.get("/", asyncRoute(async (req, res) => {
    res.json(await listCars());
  }));

  router.get("/search", asyncRoute(async (req, res) => {
    res.json(await searchCars(req.query));
  }));

  router.get("/:id", requireAuth, asyncRoute(async (req, res) => {
    res.json(await findCarById(req.params.id));
  }));

  router.post(
    "/",
    requireAuth,
    requireDealer,
    upload.single("image"),
    asyncRoute(async (req, res) => {
      res.status(201).json(await createCar(req.body, req.file, req.userProfile));
    }),
  );

  router.put(
    "/:id",
    requireAuth,
    requireDealer,
    upload.single("image"),
    asyncRoute(async (req, res) => {
      res.json(
        await updateCar(req.params.id, req.body, req.file, req.userProfile),
      );
    }),
  );

  router.delete(
    "/:id",
    requireAuth,
    requireDealer,
    asyncRoute(async (req, res) => {
      res.json(await deleteCar(req.params.id, req.userProfile));
    }),
  );

  return router;
}

module.exports = {
  createCarsRouter,
};
