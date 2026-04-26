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
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

const TABLE_GRID = Array.from({ length: 20 }, (_, i) => ({
  id: `${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}`,
  capacity: i >= 15 ? 6 : i < 5 ? 2 : 4,
}));

function BookTable() {
  const location = useLocation();
  const navigate = useNavigate();
  const restaurant = location.state?.restaurant || null;

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "customer") {
      navigate("/");
      return;
    }

    if (!restaurant?._id) {
      navigate("/restaurants");
    }
  }, [navigate, restaurant]);

  useEffect(() => {
    setSelectedTableId("");
  }, [date, time, partySize]);

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const pricePerSeat = useMemo(
    () => Number(restaurant?.pricePerSeat) || 150,
    [restaurant]
  );

  const availableTables = useMemo(() => {
    return TABLE_GRID.filter((table) => table.capacity >= partySize);
  }, [partySize]);

  const selectedTable = useMemo(() => {
    return availableTables.find((table) => table.id === selectedTableId) || null;
  }, [availableTables, selectedTableId]);

  const totalAmount = useMemo(() => {
    return partySize * pricePerSeat;
  }, [partySize, pricePerSeat]);

  const handleBack = useCallback(() => {
    navigate("/restaurants");
  }, [navigate]);

  const handleBooking = useCallback(async () => {
    if (!restaurant?._id) {
      alert("Restaurant data missing");
      return;
    }

    if (!date || !time || !selectedTableId) {
      alert("Please select date, time, and table");
      return;
    }

    if (!phone) {
      alert("Please provide a phone number for SMS notifications");
      return;
    }

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
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Booking failed");
        return;
      }

      alert("✅ Booking Confirmed!");
      navigate("/customer");
    } catch (error) {
      console.error("Booking error:", error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  }, [restaurant, date, time, selectedTableId, partySize, totalAmount, phone, navigate]);

  return (
    <div className="book-table-page">
      <div className="book-table-container">
        <div className="booking-header">
          <div className="booking-header-top">
            <button type="button" className="back-btn" onClick={handleBack}>
              ← Back to Restaurants
            </button>
          </div>

          <h1 className="booking-title">Reserve Your Experience</h1>
          <p className="booking-subtitle">
            Book your table at{" "}
            <span className="restaurant-highlight">
              {restaurant?.name || "the Restaurant"}
            </span>
          </p>
        </div>

        <div className="restaurant-info-card">
          <div className="restaurant-info-left">
            <h2>{restaurant?.name || "Restaurant"}</h2>
            <p>{restaurant?.cuisine || "Fine Dining Experience"}</p>
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
                  className={`party-option-btn ${
                    partySize === option.count ? "active" : ""
                  }`}
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
              <span className="table-help-text">
                Tables shown for {partySize} guest{partySize > 1 ? "s" : ""}
              </span>
            </div>

            <div className="floor-plan-box">
              <span className="interior-label">RESTAURANT INTERIOR</span>

              <div className="table-legend">
                <div className="legend-item">
                  <span className="legend-box available-box"></span>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box selected-box"></span>
                  <span>Selected</span>
                </div>
              </div>

              <div className="table-matrix">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    className={`table-unit ${
                      selectedTableId === table.id ? "selected" : "available"
                    }`}
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    <span className="t-id">{table.id}</span>
                    <span className="t-cap">👤 x {table.capacity}</span>
                  </button>
                ))}
              </div>

              {availableTables.length === 0 && (
                <p className="no-table-text">
                  No suitable tables available for this party size.
                </p>
              )}
            </div>
          </section>

          <section className="booking-summary-panel">
            <h3>3. Booking Summary</h3>

            <div className="summary-card">
              <label className="sage-label" style={{marginBottom: "5px", display: "block"}}>Phone Number (for SMS)</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+1234567890"
                style={{width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc"}}
                required
              />

              <div className="summary-info">
                <div className="info-row">
                  <span>Restaurant</span>
                  <span>{restaurant?.name || "Not selected"}</span>
                </div>
                <div className="info-row">
                  <span>Date</span>
                  <span>{date || "Not Selected"}</span>
                </div>
                <div className="info-row">
                  <span>Time</span>
                  <span>{time || "Not Selected"}</span>
                </div>
                <div className="info-row">
                  <span>Table</span>
                  <span>{selectedTable?.id || "None"}</span>
                </div>
                <div className="info-row">
                  <span>Seats</span>
                  <span>{partySize}</span>
                </div>
                <div className="info-row">
                  <span>Capacity</span>
                  <span>{selectedTable?.capacity || "-"}</span>
                </div>
              </div>

              <div className="price-box">
                <span className="price-label">Total Amount</span>
                <span className="price-value">₹{totalAmount}</span>
              </div>

              <button
                className="final-book-btn"
                disabled={!selectedTableId || !time || !date || !phone || loading}
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