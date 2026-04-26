import React, { useEffect, useMemo, useState } from "react";
import "../styles/Profile.css";

function Profile() {
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail");

  const [name, setName] = useState(localStorage.getItem("name") || "User");
  const [image, setImage] = useState(localStorage.getItem("profileImage") || "");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    localStorage.setItem("name", value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      localStorage.setItem("profileImage", reader.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/bookings/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch bookings");

        const data = await res.json();
        setBookings(Array.isArray(data) ? data : data.bookings || []);
      } catch (err) {
        console.error("Profile bookings error:", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  const totalSpent = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      return sum + Number(booking.totalAmount || booking.amount || 0);
    }, 0);
  }, [bookings]);

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      <div className="profile-top">
        <img
          src={image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          alt="profile"
          className="profile-pic"
        />

        <input type="file" accept="image/*" onChange={handleImageChange} />

        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          className="name-input"
          placeholder="Enter your name"
        />

        {userEmail && <p className="profile-email">{userEmail}</p>}
      </div>

      <div className="profile-section">
        <h3>Previous Reservations</h3>

        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p>No reservations yet</p>
        ) : (
          <div className="profile-list">
            {bookings.map((booking) => (
              <div className="profile-card" key={booking._id}>
                <h4>{booking.restaurantName || booking.restaurant?.name || "Restaurant"}</h4>
                <p>Customer: {booking.customerName || name}</p>
                <p>Date: {booking.date || "Not selected"}</p>
                <p>Time: {booking.time || booking.slot || "Not selected"}</p>
                <p>Guests: {booking.guests || booking.partySize || 1}</p>
                <p>Status: {booking.status || "Booked"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>Payment History</h3>

        {bookings.length === 0 ? (
          <p>No payment history yet</p>
        ) : (
          <p>Total spent: ₹{totalSpent}</p>
        )}
      </div>

      <div className="profile-section">
        <h3>Orders</h3>

        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p>No orders yet</p>
        ) : (
          <div className="profile-list">
            {bookings.map((booking) => (
              <div className="profile-card" key={`order-${booking._id}`}>
                <h4>{booking.restaurantName || booking.restaurant?.name || "Restaurant Order"}</h4>
                <p>Booking ID: {booking._id}</p>
                <p>Table: {booking.tableNumber || "Not assigned yet"}</p>
                <p>Amount: ₹{booking.totalAmount || booking.amount || 0}</p>
                <p>Status: {booking.status || "Booked"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;