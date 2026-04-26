import React, { useEffect, useState } from "react";
import "../styles/Waitlist.css";

function Waitlist() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWaitlist = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/bookings/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");

        setWaitlist(data.filter((b) => b.status === "waiting"));
      } catch (err) {
        console.error("Waitlist error:", err);
        setWaitlist([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWaitlist();
  }, []);

  return (
    <div className="waitlist-container">
      <h2>Waitlist</h2>

      {loading ? (
        <p>Loading...</p>
      ) : waitlist.length === 0 ? (
        <p>You are not in any waitlist</p>
      ) : (
        <div className="waitlist-list">
          {waitlist.map((item) => (
            <div className="waitlist-card" key={item._id}>
              <h3>{item.restaurantName}</h3>
              <p>Date: {item.date}</p>
              <p>Time: {item.time}</p>
              <p>Guests: {item.partySize}</p>
              <p>Status: Waiting</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Waitlist;