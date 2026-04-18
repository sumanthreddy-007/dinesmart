import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  location: { type: String, default: "" },
  tables: { type: Number, default: 20 },
  pricePerSeat: { type: Number, default: 150 },
  image: { type: String, default: "" },
  tag: { type: String, default: "" },
  rating: { type: Number, default: 4.5 },
  menu: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

const restaurants = [
  {
    name: "The Royal Saffron",
    location: "Hyderabad",
    tables: 20,
    pricePerSeat: 550,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    tag: "Luxury Dining",
    rating: 4.8,
    menu: ["Paneer Butter Masala", "Biryani", "Tandoori Chicken"],
    isActive: true,
  },
  {
    name: "Olive & Ember",
    location: "Hyderabad",
    tables: 20,
    pricePerSeat: 620,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9",
    tag: "Italian",
    rating: 4.7,
    menu: ["Pizza", "Pasta", "Lasagna"],
    isActive: true,
  },
  {
    name: "Skyline Grill",
    location: "Hyderabad",
    tables: 20,
    pricePerSeat: 700,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    tag: "BBQ",
    rating: 4.6,
    menu: ["BBQ Chicken", "Steak", "Grilled Fish"],
    isActive: true,
  },
  {
    name: "Lotus Pavilion",
    location: "Hyderabad",
    tables: 20,
    pricePerSeat: 480,
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de",
    tag: "Chinese",
    rating: 4.5,
    menu: ["Noodles", "Fried Rice", "Manchurian"],
    isActive: true,
  },
  {
    name: "Coastal Spice House",
    location: "Vizag",
    tables: 20,
    pricePerSeat: 650,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
    tag: "Seafood",
    rating: 4.9,
    menu: ["Fish Fry", "Prawns", "Crab Curry"],
    isActive: true,
  },
  {
    name: "Urban Tandoor",
    location: "Vijayawada",
    tables: 20,
    pricePerSeat: 420,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947",
    tag: "Indian",
    rating: 4.4,
    menu: ["Tandoori Chicken", "Naan", "Dal"],
    isActive: true,
  },
  {
    name: "Garden Terrace Café",
    location: "Mangalagiri",
    tables: 20,
    pricePerSeat: 350,
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
    tag: "Cafe",
    rating: 4.6,
    menu: ["Coffee", "Sandwich", "Desserts"],
    isActive: true,
  },
  {
    name: "The Velvet Fork",
    location: "Hyderabad",
    tables: 20,
    pricePerSeat: 780,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    tag: "Fine Dining",
    rating: 4.8,
    menu: ["Steak", "Wine", "Desserts"],
    isActive: true,
  },
  {
    name: "Spice Route Bistro",
    location: "Hyderabad",
    tables: 20,
    pricePerSeat: 500,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    tag: "Biryani",
    rating: 4.7,
    menu: ["Biryani", "Kebabs", "Haleem"],
    isActive: true,
  },
  {
    name: "Moonlight Bay",
    location: "Vizag",
    tables: 20,
    pricePerSeat: 850,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
    tag: "Sea View",
    rating: 4.9,
    menu: ["Seafood Platter", "Wine", "Desserts"],
    isActive: true,
  },
];

const seed = async () => {
  try {
    for (const restaurant of restaurants) {
      await Restaurant.updateOne(
        { name: restaurant.name },
        { $set: restaurant },
        { upsert: true }
      );
    }

    console.log("✅ Restaurants inserted / updated");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();