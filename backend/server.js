import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(console.log);

/* ================= MODELS ================= */
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
      password: { type: String, required: true },
      role: { type: String, enum: ["customer", "staff", "admin"], default: "customer", index: true },
      restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null, index: true },
      restaurantName: { type: String, default: "", trim: true },
    },
    { timestamps: true }
  )
);

const Restaurant = mongoose.model(
  "Restaurant",
  new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true, trim: true, index: true },
      location: { type: String, default: "", trim: true },
      tables: { type: Number, default: 10, min: 1 },
      pricePerSeat: { type: Number, default: 150, min: 0 },
      image: { type: String, default: "/dinesmart-logo.png" },
      tag: { type: String, default: "" },
      rating: { type: Number, default: 4.5, min: 0, max: 5 },
      menu: { type: [String], default: [] },
      isActive: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
  )
);

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    restaurantName: { type: String, required: true, trim: true, index: true },
    date: { type: String, required: true, trim: true, index: true },
    time: { type: String, required: true, trim: true },
    partySize: { type: Number, required: true, min: 1 },
    tableId: { type: String, default: "", trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["confirmed", "waiting", "seated", "cancelled"],
      default: "confirmed",
      index: true,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ restaurantId: 1, date: 1, time: 1, tableId: 1, status: 1 });
const Booking = mongoose.model("Booking", bookingSchema);

/* ================= HELPERS ================= */
const cleanEmail = (v = "") => v.trim().toLowerCase();
const cleanText = (v = "") => v.trim();

const userOut = (u) => ({
  id: u._id,
  email: u.email,
  role: u.role,
  restaurantId: u.restaurantId || null,
  restaurantName: u.restaurantName || "",
});

const sign = (u) =>
  jwt.sign(
    {
      id: u._id,
      email: u.email,
      role: u.role,
      restaurantId: u.restaurantId || null,
      restaurantName: u.restaurantName || "",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const allow = (...roles) => (req, res, next) =>
  !req.user || !roles.includes(req.user.role)
    ? res.status(403).json({ message: "Access denied" })
    : next();

const asyncHandler = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  });

const restaurantPayload = (body = {}) => {
  const data = {};

  if (body.name !== undefined) data.name = cleanText(body.name);
  if (body.location !== undefined) data.location = cleanText(body.location);
  if (body.tables !== undefined) data.tables = Number(body.tables);
  if (body.pricePerSeat !== undefined) data.pricePerSeat = Number(body.pricePerSeat);

  if (body.image !== undefined) {
    data.image = body.image?.trim() || "/dinesmart-logo.png";
  } else {
    data.image = "/dinesmart-logo.png";
  }

  if (body.tag !== undefined) data.tag = cleanText(body.tag);
  if (body.rating !== undefined) data.rating = Number(body.rating);
  if (body.menu !== undefined) data.menu = Array.isArray(body.menu) ? body.menu : [];
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  return data;
};

/* ================= ROUTES ================= */
app.get("/", (_, res) => res.send("Backend Running 🚀"));

/* AUTH */
app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { password } = req.body;
  const role = req.body.role || "customer";
  const selectedRestaurantId = req.body.restaurantId || null;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (await User.findOne({ email })) {
    return res.status(400).json({ message: "User already exists" });
  }

  let restaurant = null;

  if (role === "staff") {
    if (!selectedRestaurantId) {
      return res.status(400).json({ message: "Staff must select a restaurant" });
    }

    restaurant = await Restaurant.findOne({ _id: selectedRestaurantId, isActive: true }).lean();
    if (!restaurant) {
      return res.status(404).json({ message: "Selected restaurant not found" });
    }
  }

  const user = await User.create({
    email,
    password: await bcrypt.hash(password, 10),
    role,
    restaurantId: restaurant?._id || null,
    restaurantName: restaurant?.name || "",
  });

  res.status(201).json({
    message: "Registration successful",
    token: sign(user),
    user: userOut(user),
  });
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (user.role === "staff" && user.restaurantId) {
    const restaurant = await Restaurant.findById(user.restaurantId).select("name isActive").lean();

    if (!restaurant) {
      user.restaurantId = null;
      user.restaurantName = "";
      await user.save();
    } else {
      if (!restaurant.isActive) {
        return res.status(403).json({ message: "Assigned restaurant is inactive" });
      }

      if (user.restaurantName !== restaurant.name) {
        user.restaurantName = restaurant.name;
        await user.save();
      }
    }
  }

  res.json({ token: sign(user), user: userOut(user) });
}));

/* RESTAURANTS */
app.get("/api/restaurants", asyncHandler(async (_, res) => {
  res.json(await Restaurant.find({ isActive: true }).sort({ createdAt: -1 }).lean());
}));

app.get("/api/admin/restaurants", auth, allow("admin"), asyncHandler(async (_, res) => {
  res.json(await Restaurant.find().sort({ createdAt: -1 }).lean());
}));

app.post("/api/admin/restaurants", auth, allow("admin"), asyncHandler(async (req, res) => {
  const data = restaurantPayload(req.body);
  if (!data.name) return res.status(400).json({ message: "Restaurant name is required" });

  const exists = await Restaurant.findOne({
    name: { $regex: `^${data.name}$`, $options: "i" },
  }).lean();

  if (exists) return res.status(400).json({ message: "Restaurant already exists" });

  const restaurant = await Restaurant.create({ tables: 10, ...data });
  res.status(201).json({ message: "Restaurant added successfully", restaurant });
}));

app.put("/api/admin/restaurants/:id", auth, allow("admin"), asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    restaurantPayload(req.body),
    { new: true, runValidators: true }
  );

  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  if (req.body.name !== undefined) {
    await Promise.all([
      User.updateMany(
        { role: "staff", restaurantId: restaurant._id },
        { $set: { restaurantName: restaurant.name } }
      ),
      Booking.updateMany(
        { restaurantId: restaurant._id },
        { $set: { restaurantName: restaurant.name } }
      ),
    ]);
  }

  res.json({ message: "Restaurant updated successfully", restaurant });
}));

app.delete("/api/admin/restaurants/:id", auth, allow("admin"), asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  await User.updateMany(
    { role: "staff", restaurantId: restaurant._id },
    { $set: { restaurantId: null, restaurantName: "" } }
  );

  res.json({ message: "Restaurant deleted successfully" });
}));

/* BOOKINGS */
app.post("/api/bookings", auth, allow("customer"), asyncHandler(async (req, res) => {
  const { restaurantId, date, time, partySize, tableId, totalAmount } = req.body;

  if (!restaurantId || !date || !time || !partySize || totalAmount === undefined) {
    return res.status(400).json({ message: "All booking fields are required" });
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
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    date,
    time,
    partySize: Number(partySize),
    tableId: clash ? "" : chosenTable,
    totalAmount: Number(totalAmount),
    status: clash ? "waiting" : "confirmed",
  });

  res.status(201).json({
    message: clash ? "Added to waitlist" : "Booking confirmed",
    booking,
  });
}));

app.get("/api/bookings/my", auth, allow("customer"), asyncHandler(async (req, res) => {
  res.json(await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean());
}));

app.get("/api/bookings", auth, allow("staff", "admin"), asyncHandler(async (req, res) => {
  const filter = req.user.role === "staff" ? { restaurantId: req.user.restaurantId } : {};
  if (req.user.role === "staff" && !req.user.restaurantId) return res.json([]);
  res.json(await Booking.find(filter).sort({ createdAt: -1 }).lean());
}));

app.put("/api/bookings/:id/cancel", auth, asyncHandler(async (req, res) => {
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
}));

/* STAFF */
app.get("/api/staff/dashboard", auth, allow("staff"), asyncHandler(async (req, res) => {
  if (!req.user.restaurantId) {
    return res.json({ hotelName: "No Restaurant Assigned", tables: [], waitlist: [] });
  }

  const restaurant = await Restaurant.findById(req.user.restaurantId).lean();
  if (!restaurant) {
    return res.json({ hotelName: "Restaurant Not Found", tables: [], waitlist: [] });
  }

  const today = new Date().toISOString().slice(0, 10);

  const activeBookings = await Booking.find({
    restaurantId: req.user.restaurantId,
    date: today,
    status: { $in: ["confirmed", "seated"] },
  }).select("tableId userEmail time partySize").lean();

  const waitingBookings = await Booking.find({
    restaurantId: req.user.restaurantId,
    date: today,
    status: "waiting",
  }).select("userEmail time partySize").sort({ createdAt: 1 }).lean();

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
}));

app.post("/api/staff/assign", auth, allow("staff"), asyncHandler(async (req, res) => {
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
    status: "waiting",
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

  res.json({ message: "Table assigned successfully" });
}));

/* ADMIN ANALYTICS */
app.get("/api/admin/analytics/restaurants", auth, allow("admin"), asyncHandler(async (_, res) => {
  res.json(await Booking.aggregate([
    { $match: { status: { $in: ["confirmed", "seated"] } } },
    {
      $group: {
        _id: { restaurantId: "$restaurantId", restaurantName: "$restaurantName" },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        totalGuests: { $sum: "$partySize" },
      },
    },
    {
      $project: {
        _id: 0,
        restaurantId: "$_id.restaurantId",
        restaurantName: "$_id.restaurantName",
        totalBookings: 1,
        totalRevenue: 1,
        totalGuests: 1,
      },
    },
    { $sort: { totalBookings: -1, totalRevenue: -1 } },
  ]));
}));

app.get("/api/admin/analytics/summary", auth, allow("admin"), asyncHandler(async (_, res) => {
  const [totalRestaurants, activeRestaurants, totalBookings, confirmedBookings, revenueData] =
    await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ["confirmed", "seated"] } }),
      Booking.aggregate([
        { $match: { status: { $in: ["confirmed", "seated"] } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

  res.json({
    totalRestaurants,
    activeRestaurants,
    totalBookings,
    confirmedBookings,
    totalRevenue: revenueData[0]?.totalRevenue || 0,
  });
}));

/* START */
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});