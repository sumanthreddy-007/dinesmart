import Restaurant from "../models/Restaurant.js";
import Booking from "../models/Booking.js";
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

export const getStaffDashboard = async (req, res) => {
  if (!req.user.restaurantId) {
    return res.json({ hotelName: "No Restaurant Assigned", tables: [], waitlist: [] });
  }

  const restaurant = await Restaurant.findById(req.user.restaurantId).lean();
  if (!restaurant) {
    return res.json({ hotelName: "Restaurant Not Found", tables: [], waitlist: [] });
  }

  const targetDate = req.query.date || new Date().toISOString().slice(0, 10);

  const activeBookings = await Booking.find({
    restaurantId: req.user.restaurantId,
    date: targetDate,
    status: { $in: ["confirmed", "seated"] },
    tableId: { $ne: "" },
  }).select("tableId userEmail time partySize").lean();

  const waitingBookings = await Booking.find({
    restaurantId: req.user.restaurantId,
    date: targetDate,
    $or: [
      { status: "waiting" },
      { status: "confirmed", tableId: "" },
      { status: "confirmed", tableId: { $exists: false } }
    ]
  }).select("userEmail time partySize status").sort({ createdAt: 1 }).lean();

  const bookedMap = new Map();
  activeBookings.forEach((b) => {
    if (b.tableId) bookedMap.set(b.tableId, b);
  });

  const tables = Array.from({ length: restaurant.tables || 10 }, (_, i) => {
    const n = i + 1;
    const name = `T${n}`;
    const booking = bookedMap.get(name);

    return {
      _id: name,
      name,
      capacity: n <= 3 ? 2 : n <= 7 ? 4 : 6,
      status: booking ? "occupied" : "available",
      currentGuest: booking ? booking.userEmail.split("@")[0] : "",
      bookingTime: booking ? booking.time : "",
    };
  });

  res.json({
    hotelName: restaurant.name,
    tables,
    waitlist: waitingBookings.map((b) => ({
      _id: b._id,
      name: b.userEmail.split("@")[0],
      time: b.time,
      guests: b.partySize,
    })),
  });
};

export const assignTable = async (req, res) => {
  const { tableId, customerId } = req.body;

  if (!req.user.restaurantId) {
    return res.status(400).json({ message: "No restaurant assigned" });
  }

  if (!tableId || !customerId) {
    return res.status(400).json({ message: "tableId and customerId are required" });
  }

  const booking = await Booking.findOne({
    _id: customerId,
    restaurantId: req.user.restaurantId,
    $or: [
      { status: "waiting" },
      { status: "confirmed", tableId: "" },
      { status: "confirmed", tableId: { $exists: false } }
    ]
  });

  if (!booking) {
    return res.status(404).json({ message: "Waiting customer not found" });
  }

  const clash = await Booking.findOne({
    restaurantId: req.user.restaurantId,
    date: booking.date,
    time: booking.time,
    tableId,
    status: { $in: ["confirmed", "seated"] },
  }).lean();

  if (clash) {
    return res.status(400).json({ message: "Table already occupied for this slot" });
  }

  booking.tableId = tableId;
  booking.status = "seated";
  await booking.save();

  // Send Twilio SMS if phone exists
  if (booking.phone && process.env.TWILIO_PHONE_NUMBER) {
    const client = getTwilioClient();
    if (client) {
      try {
        // Simple formatting to ensure number starts with +
        let toPhone = booking.phone.trim();
        if (!toPhone.startsWith("+")) {
          // Default to India (+91) since user is in IST, or just warn
          // For now, let's assume +91 if 10 digits, or just leave it
          if (toPhone.length === 10) toPhone = "+91" + toPhone;
          else if (!toPhone.startsWith("+")) console.log("Warning: Phone number might need country code starting with +");
        }

        console.log(`Attempting to send SMS to ${toPhone} from ${process.env.TWILIO_PHONE_NUMBER}`);

        const message = await client.messages.create({
          body: `Hi! Your table ${tableId} is ready at ${booking.restaurantName}. Please head to the host stand.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: toPhone,
        });
        console.log(`✅ SMS sent successfully! SID: ${message.sid}`);
      } catch (err) {
        console.error("❌ Twilio SMS failed:", err.message);
      }
    } else {
      console.log("Twilio client could not be initialized. Check your SID/Token.");
    }
  } else {
    console.log(`Skipping SMS: Phone: ${booking.phone}, Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}`);
  }

  res.json({ message: "Table assigned successfully" });
};

export const createWalkinBooking = async (req, res) => {
  const { partySize, guestName, date, time, phone } = req.body;

  if (!req.user.restaurantId) {
    return res.status(400).json({ message: "No restaurant assigned" });
  }

  if (!partySize || !guestName) {
    return res.status(400).json({ message: "partySize and guestName are required" });
  }

  const restaurant = await Restaurant.findById(req.user.restaurantId).lean();
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  const targetDate = date || new Date().toISOString().slice(0, 10);
  const targetTime = time || new Date().toTimeString().slice(0, 5);

  const booking = await Booking.create({
    userId: req.user.id,
    userEmail: `${guestName.toLowerCase().replace(/\s+/g, '')}@walkin.local`,
    phone: phone || "",
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    date: targetDate,
    time: targetTime,
    partySize: Number(partySize),
    tableId: "",
    totalAmount: 0,
    status: "waiting",
  });

  res.status(201).json({ message: "Walk-in added to waitlist", booking });
};
