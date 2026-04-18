import React from "react";
import { useNavigate } from "react-router-dom";

function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();

  return (
    <div style={{ border: "1px solid", margin: "10px", padding: "10px" }}>
      <h3>{restaurant.name}</h3>
      <p>Rating: {restaurant.rating}</p>

      <button
        onClick={() =>
          navigate("/book", { state: { restaurant } })
        }
      >
        Book Table
      </button>
    </div>
  );
}

export default RestaurantCard;