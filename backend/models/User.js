import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "staff", "admin"], default: "customer", index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null, index: true },
    restaurantName: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
