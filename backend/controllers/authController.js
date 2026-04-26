import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import { cleanEmail, userOut, signToken } from "../utils/helpers.js";

export const registerUser = async (req, res) => {
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
    token: signToken(user),
    user: userOut(user),
  });
};

export const loginUser = async (req, res) => {
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

  res.json({ token: signToken(user), user: userOut(user) });
};
