import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
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
export default mongoose.model("Booking", bookingSchema);
