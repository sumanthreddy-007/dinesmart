import express from "express";
import { createBooking, getMyBookings, getAllBookings, cancelBooking } from "../controllers/bookingController.js";
import { auth, allow } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorMiddleware.js";

const router = express.Router();

router.use(auth);

router.post("/", allow("customer"), asyncHandler(createBooking));
router.get("/my", allow("customer"), asyncHandler(getMyBookings));
router.get("/", allow("staff", "admin"), asyncHandler(getAllBookings));
router.put("/:id/cancel", asyncHandler(cancelBooking));

export default router;
