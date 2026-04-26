import express from "express";
import { getStaffDashboard, assignTable, createWalkinBooking } from "../controllers/staffController.js";
import { auth, allow } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorMiddleware.js";

const router = express.Router();

router.use(auth, allow("staff"));

router.get("/dashboard", asyncHandler(getStaffDashboard));
router.post("/assign", asyncHandler(assignTable));
router.post("/walkin", asyncHandler(createWalkinBooking));

export default router;
