import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
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
);

export default mongoose.model("Restaurant", RestaurantSchema);
