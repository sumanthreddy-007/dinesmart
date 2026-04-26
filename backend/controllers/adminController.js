import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { restaurantPayload } from "../utils/helpers.js";

export const getAdminRestaurants = async (req, res) => {
  res.json(await Restaurant.find().sort({ createdAt: -1 }).lean());
};

export const createRestaurant = async (req, res) => {
  const data = restaurantPayload(req.body);
  if (!data.name) return res.status(400).json({ message: "Restaurant name is required" });

  const exists = await Restaurant.findOne({
    name: { $regex: `^${data.name}$`, $options: "i" },
  }).lean();

  if (exists) return res.status(400).json({ message: "Restaurant already exists" });

  const restaurant = await Restaurant.create({ tables: 10, ...data });
  res.status(201).json({ message: "Restaurant added successfully", restaurant });
};

export const updateRestaurant = async (req, res) => {
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
};

export const deleteRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  await User.updateMany(
    { role: "staff", restaurantId: restaurant._id },
    { $set: { restaurantId: null, restaurantName: "" } }
  );

  res.json({ message: "Restaurant deleted successfully" });
};

export const getAdminAnalyticsRestaurants = async (req, res) => {
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
};

export const getAdminAnalyticsSummary = async (req, res) => {
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
};

export const getGlobalWaitlist = async (req, res) => {
  const waitlist = await Booking.find({
    $or: [
      { status: "waiting" },
      { status: "confirmed", tableId: "" },
      { status: "confirmed", tableId: { $exists: false } }
    ]
  }).sort({ date: 1, time: 1 }).lean();

  res.json(waitlist);
};
