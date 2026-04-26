import React, { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [hotelName, setHotelName] = useState("Hotel");
  const [tables, setTables] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [walkin, setWalkin] = useState({
    name: "",
    time: "",
    guests: 2,
  });

  const [restaurants, setRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    location: "",
    tables: 10,
  });

  const token = localStorage.getItem("token");

  const fetchStaffData = async () => {
    const [dashRes, bookingRes] = await Promise.all([
      fetch("http://localhost:5000/api/staff/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:5000/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const dashData = await dashRes.json();
    const bookingData = await bookingRes.json();

    setHotelName(dashData.hotelName || "Hotel");
    setTables(dashData.tables || []);
    setWaitlist(dashData.waitlist || []);
    setBookings(Array.isArray(bookingData) ? bookingData : []);
  };

  const fetchAdminData = async () => {
    const [res1, res2] = await Promise.all([
      fetch("http://localhost:5000/api/admin/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:5000/api/admin/analytics/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    setRestaurants(await res1.json());
    setAnalytics(await res2.json());
  };

  useEffect(() => {
    const userRole = localStorage.getItem("role");

    if (!token) return navigate("/");
    if (userRole !== "staff" && userRole !== "admin") return navigate("/");

    setRole(userRole);
  }, [navigate, token]);

  useEffect(() => {
    if (!role) return;

    const load = async () => {
      try {
        setLoading(true);
        if (role === "staff") await fetchStaffData();
        if (role === "admin") await fetchAdminData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [role]);

  const handleAssignTable = async (table) => {
    if (!selectedCustomer || table.status !== "available") return;

    try {
      const res = await fetch("http://localhost:5000/api/staff/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tableId: table._id,
          customerId: selectedCustomer._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Assign failed");

      setSelectedCustomer(null);
      await fetchStaffData();
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleAddWalkin = async () => {
    if (!walkin.name || !walkin.time || !walkin.guests) {
      return alert("Enter walk-in name, time and guests");
    }

    try {
      const res = await fetch("http://localhost:5000/api/staff/walkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(walkin),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Walk-in failed");

      setWalkin({ name: "", time: "", guests: 2 });
      await fetchStaffData();
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleAddRestaurant = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRestaurant),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed to add restaurant");

      setRestaurants((prev) => [data.restaurant, ...prev]);
      setNewRestaurant({ name: "", location: "", tables: 10 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/restaurants/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      setRestaurants((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const stats = useMemo(
    () => ({
      total: tables.length,
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      waiting: waitlist.length,
    }),
    [tables, waitlist]
  );

  if (role === "admin") {
    return (
      <div className="dashboard-wrapper">
        <div className="dash-container">
          <div className="dash-top-bar">
            <div>
              <p className="sub">Management Control</p>
              <h2>Admin Panel</h2>
              <span className="tag">ADMIN</span>
            </div>
          </div>

          <div className="map-card">
            <div className="section-head">
              <h3>Add Restaurant</h3>
            </div>

            <div className="admin-form">
              <input
                placeholder="Restaurant Name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
              />
              <input
                placeholder="Location"
                value={newRestaurant.location}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, location: e.target.value })}
              />
              <input
                type="number"
                placeholder="Tables"
                value={newRestaurant.tables}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, tables: Number(e.target.value) })}
              />
              <button className="walkin-btn" onClick={handleAddRestaurant}>Add</button>
            </div>
          </div>

          <div className="dash-grid">
            <section className="map-card">
              <div className="section-head"><h3>Restaurants</h3></div>

              {restaurants.map((r) => (
                <div key={r._id} className="wait-row">
                  <div>
                    <div className="cust-name">{r.name}</div>
                    <div className="cust-time">{r.location || "No location"}</div>
                  </div>
                  <button className="assign-btn" onClick={() => handleDelete(r._id)}>Delete</button>
                </div>
              ))}
            </section>

            <aside className="wait-card">
              <div className="section-head"><h3>Analytics</h3></div>

              {analytics.map((a, i) => (
                <div key={i} className="wait-row">
                  <div>
                    <div className="cust-name">{a.restaurantName}</div>
                    <div className="cust-time">{a.totalBookings} bookings</div>
                    <small>₹{a.totalRevenue}</small>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dash-container">
        <div className="dash-top-bar">
          <div>
            <p className="sub">Front Desk Control</p>
            <h2>{hotelName}</h2>
            <span className="tag">STAFF PORTAL</span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
          <div className="stat-card"><span>Available</span><strong>{stats.available}</strong></div>
          <div className="stat-card"><span>Occupied</span><strong>{stats.occupied}</strong></div>
          <div className="stat-card"><span>Waitlist</span><strong>{stats.waiting}</strong></div>
        </div>

        <div className="map-card walkin-box">
          <div className="section-head"><h3>Add Walk-In Customer</h3></div>

          <div className="admin-form">
            <input
              placeholder="Customer name"
              value={walkin.name}
              onChange={(e) => setWalkin({ ...walkin, name: e.target.value })}
            />
            <input
              type="time"
              value={walkin.time}
              onChange={(e) => setWalkin({ ...walkin, time: e.target.value })}
            />
            <input
              type="number"
              min="1"
              value={walkin.guests}
              onChange={(e) => setWalkin({ ...walkin, guests: Number(e.target.value) })}
            />
            <button className="walkin-btn" onClick={handleAddWalkin}>Add to Waitlist</button>
          </div>
        </div>

        <div className="dash-grid">
          <section className="map-card">
            <div className="section-head">
              <div>
                <p className="sub">Realtime Seating</p>
                <h3>Live Table Map</h3>
              </div>
              <div className="pill">
                {selectedCustomer ? `Assigning: ${selectedCustomer.name}` : "Select customer"}
              </div>
            </div>

            {loading ? (
              <div className="empty">Loading...</div>
            ) : (
              <div className="table-flex">
                {tables.map((t) => (
                  <button
                    key={t._id}
                    className={`t-card ${t.status}`}
                    disabled={!selectedCustomer || t.status !== "available"}
                    onClick={() => handleAssignTable(t)}
                  >
                    <div className="t-head">TABLE {t.name}</div>
                    <p>Capacity: {t.capacity}</p>
                    <span className={`status ${t.status}`}>{t.status}</span>
                    {t.currentGuest && <small>Guest: {t.currentGuest}</small>}
                    {t.bookingTime && <small>Time: {t.bookingTime}</small>}
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="wait-card">
            <div className="section-head"><h3>Waitlist</h3></div>

            {waitlist.length === 0 ? (
              <div className="empty">No customers waiting.</div>
            ) : (
              waitlist.map((p) => (
                <div key={p._id} className={`wait-row ${selectedCustomer?._id === p._id ? "selected" : ""}`}>
                  <div>
                    <div className="cust-name">{p.name}</div>
                    <div className="cust-time">{p.time || "No time"}</div>
                    <small>{p.guests} Guests</small>
                  </div>
                  <button className="assign-btn" onClick={() => setSelectedCustomer(p)}>
                    {selectedCustomer?._id === p._id ? "Selected" : "Assign"}
                  </button>
                </div>
              ))
            )}
          </aside>
        </div>

        <section className="map-card">
          <div className="section-head"><h3>All Restaurant Bookings</h3></div>

          {bookings.length === 0 ? (
            <div className="empty">No bookings found.</div>
          ) : (
            bookings.map((b) => (
              <div key={b._id} className="wait-row">
                <div>
                  <div className="cust-name">{b.userEmail?.split("@")[0]}</div>
                  <div className="cust-time">{b.restaurantName} • {b.date} • {b.time}</div>
                  <small>{b.partySize} Guests • Table {b.tableId || "Not assigned"} • {b.status}</small>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}