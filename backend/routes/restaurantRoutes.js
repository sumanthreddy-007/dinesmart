import express from "express";
import { getRestaurants } from "../controllers/restaurantController.js";
import { asyncHandler } from "../middlewares/errorMiddleware.js";

const router = express.Router();

router.get("/", asyncHandler(getRestaurants));

export default router;
