import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/BookTable.css";

const PARTY_OPTIONS = [
  { id: "single", icon: "🧍", count: 1, label: "Solo" },
  { id: "couple", icon: "💑", count: 2, label: "Couple" },
  { id: "family", icon: "👨‍👩‍👧‍👦", count: 4, label: "Family" },
  { id: "group", icon: "🧑‍🤝‍🧑", count: 6, label: "Group" },
];

const TIME_SLOTS = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
];

const TABLE_GRID = Array.from({ length: 20 }, (_, i) => ({
  id: `T${i + 1}`,
  capacity: i < 5 ? 2 : i < 15 ? 4 : 6,
}));

function BookTable() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const restaurant = state?.restaurant || null;

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "customer") return navigate("/login");
    if (!restaurant?._id) return navigate("/restaurants");
  }, [navigate, restaurant]);

  useEffect(() => {
    setSelectedTableId("");
  }, [date, time, partySize]);

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const pricePerSeat = Number(restaurant?.pricePerSeat) || 150;

  const availableTables = useMemo(
    () => TABLE_GRID.filter((t) => t.capacity >= partySize),
    [partySize]
  );

  const selectedTable = useMemo(
    () => availableTables.find((t) => t.id === selectedTableId),
    [availableTables, selectedTableId]
  );

  const totalAmount = partySize * pricePerSeat;

  const handleBooking = useCallback(async () => {
    if (!restaurant?._id) return alert("Restaurant data missing");
    if (!date || !time || !selectedTableId) return alert("Select date, time, and table");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant._id,
          date,
          time,
          partySize,
          tableId: selectedTableId,
          totalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Booking failed");

      alert(data.message || "Booking confirmed");
      navigate("/profile");
    } catch (err) {
      console.error("Booking error:", err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  }, [restaurant, date, time, selectedTableId, partySize, totalAmount, navigate]);

  return (
    <div className="book-table-page">
      <div className="book-table-container">
        <div className="booking-header">
          <button type="button" className="back-btn" onClick={() => navigate("/restaurants")}>
            ← Back to Restaurants
          </button>

          <h1 className="booking-title">Reserve Your Experience</h1>
          <p className="booking-subtitle">
            Book your table at{" "}
            <span className="restaurant-highlight">{restaurant?.name || "Restaurant"}</span>
          </p>
        </div>

        <div className="restaurant-info-card">
          <div className="restaurant-info-left">
            <h2>{restaurant?.name || "Restaurant"}</h2>
            <p>{restaurant?.cuisine || restaurant?.tag || "Fine Dining Experience"}</p>
          </div>

          <div className="restaurant-info-right">
            <span className="seat-price-label">Price per seat</span>
            <span className="seat-price-value">₹{pricePerSeat}</span>
          </div>
        </div>

        <div className="booking-content-layout">
          <section className="booking-panel">
            <h3>1. Select Schedule</h3>

            <label className="sage-label">Reservation Date</label>
            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="date-input"
            />

            <label className="sage-label">Available Slots</label>
            <div className="slot-grid">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot-btn ${time === slot ? "active" : ""}`}
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>

            <label className="sage-label">Party Size</label>
            <div className="party-grid">
              {PARTY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`party-option-btn ${partySize === option.count ? "active" : ""}`}
                  onClick={() => setPartySize(option.count)}
                >
                  <span className="party-icon">{option.icon}</span>
                  <span className="party-text">{option.label}</span>
                  <span className="party-count">{option.count} Seats</span>
                </button>
              ))}
            </div>
          </section>

          <section className="seating-chart-panel">
            <div className="section-head">
              <h3>2. Pick a Table</h3>
              <span className="table-help-text">Tables for {partySize} guest{partySize > 1 ? "s" : ""}</span>
            </div>

            <div className="floor-plan-box">
              <span className="interior-label">RESTAURANT INTERIOR</span>

              <div className="table-matrix">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    className={`table-unit ${selectedTableId === table.id ? "selected" : "available"}`}
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    <span className="t-id">{table.id}</span>
                    <span className="t-cap">👤 x {table.capacity}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="booking-summary-panel">
            <h3>3. Booking Summary</h3>

            <div className="summary-card">
              <div className="summary-info">
                <div className="info-row"><span>Restaurant</span><span>{restaurant?.name || "Not selected"}</span></div>
                <div className="info-row"><span>Date</span><span>{date || "Not selected"}</span></div>
                <div className="info-row"><span>Time</span><span>{time || "Not selected"}</span></div>
                <div className="info-row"><span>Table</span><span>{selectedTable?.id || "None"}</span></div>
                <div className="info-row"><span>Seats</span><span>{partySize}</span></div>
              </div>

              <div className="price-box">
                <span className="price-label">Total Amount</span>
                <span className="price-value">₹{totalAmount}</span>
              </div>

              <button
                className="final-book-btn"
                disabled={!selectedTableId || !time || !date || loading}
                onClick={handleBooking}
              >
                {loading ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default BookTable;