import jwt from "jsonwebtoken";

export const cleanEmail = (v = "") => v.trim().toLowerCase();
export const cleanText = (v = "") => String(v).trim();

export const userOut = (u) => ({
  id: u._id,
  email: u.email,
  role: u.role,
  restaurantId: u.restaurantId || null,
  restaurantName: u.restaurantName || "",
});

export const signToken = (u) =>
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

export const restaurantPayload = (body = {}) => {
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
