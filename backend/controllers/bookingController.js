import Booking from "../models/Booking.js";
import Restaurant from "../models/Restaurant.js";
import { cleanText } from "../utils/helpers.js";
import twilio from "twilio";

const getTwilioClient = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (err) {
      console.error("Twilio init error:", err);
      return null;
    }
  }
  return null;
};

export const createBooking = async (req, res) => {
  console.log("Incoming Booking Request:", req.body);
  const { restaurantId, date, time, partySize, tableId, totalAmount, phone } = req.body;

  if (!restaurantId || !date || !time || !partySize || totalAmount === undefined || !phone) {
    console.log("Missing fields detected:", { restaurantId, date, time, partySize, totalAmount, phone });
    return res.status(400).json({ message: "All booking fields (including phone) are required" });
  }

  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true }).lean();
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  const chosenTable = cleanText(tableId || "");

  const clash = chosenTable
    ? await Booking.findOne({
        restaurantId,
        date,
        time,
        tableId: chosenTable,
        status: { $in: ["confirmed", "seated"] },
      }).lean()
    : null;

  const booking = await Booking.create({
    userId: req.user.id,
    userEmail: req.user.email,
    phone: cleanText(phone),
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    date,
    time,
    partySize: Number(partySize),
    tableId: clash ? "" : chosenTable,
    totalAmount: Number(totalAmount),
    status: clash ? "waiting" : "confirmed",
  });

  // SMS Notification on immediate confirmation
  if (!clash && booking.phone && process.env.TWILIO_PHONE_NUMBER) {
    const client = getTwilioClient();
    if (client) {
      try {
        let toPhone = booking.phone.trim();
        if (toPhone.length === 10 && !toPhone.startsWith("+")) toPhone = "+91" + toPhone;
        
        await client.messages.create({
          body: `Success! Your table ${booking.tableId} is confirmed at ${booking.restaurantName} for ${booking.date} at ${booking.time}.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: toPhone,
        });
        console.log(`✅ Confirmation SMS sent to ${toPhone}`);
      } catch (err) {
        console.error("❌ Confirmation SMS failed:", err.message);
      }
    }
  }

  res.status(201).json({
    message: clash ? "Added to waitlist" : "Booking confirmed",
    booking,
  });
};

export const getMyBookings = async (req, res) => {
  res.json(await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean());
};

export const getAllBookings = async (req, res) => {
  const filter = req.user.role === "staff" ? { restaurantId: req.user.restaurantId } : {};
  if (req.user.role === "staff" && !req.user.restaurantId) return res.json([]);
  res.json(await Booking.find(filter).sort({ createdAt: -1 }).lean());
};

export const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const own = booking.userId.toString() === req.user.id;
  const admin = req.user.role === "admin";
  const sameStaffRestaurant =
    req.user.role === "staff" &&
    req.user.restaurantId &&
    booking.restaurantId.toString() === String(req.user.restaurantId);

  if (!own && !admin && !sameStaffRestaurant) {
    return res.status(403).json({ message: "Access denied" });
  }

  booking.status = "cancelled";
  await booking.save();

  res.json({ message: "Booking cancelled successfully", booking });
};
