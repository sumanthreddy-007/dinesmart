import Restaurant from "../models/Restaurant.js";

export const getRestaurants = async (req, res) => {
  res.json(await Restaurant.find({ isActive: true }).sort({ createdAt: -1 }).lean());
};
