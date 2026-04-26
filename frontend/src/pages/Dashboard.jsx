import React, { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [hotelName, setHotelName] = useState("Hotel");
  const [tables, setTables] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [restaurants, setRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [globalWaitlist, setGlobalWaitlist] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    location: "",
    tables: 10,
    image: "",
    menu: "",
  });

  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ guestName: "", phone: "", partySize: 2 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
      navigate("/");
      return;
    }

    if (userRole !== "staff" && userRole !== "admin") {
      navigate("/");
      return;
    }

    setRole(userRole);
  }, [navigate]);

  useEffect(() => {
    if (!role) return;

    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        setLoading(true);

        if (role === "staff") {
          const res = await fetch(`http://localhost:5000/api/staff/dashboard?date=${targetDate}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setHotelName(data.hotelName || "Hotel");
          setTables(data.tables || []);
          setWaitlist(data.waitlist || []);
        }

        if (role === "admin") {
          const [res1, res2, res3] = await Promise.all([
            fetch("http://localhost:5000/api/admin/restaurants", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/admin/analytics/restaurants", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/admin/waitlist", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const restaurantsData = await res1.json();
          const analyticsData = await res2.json();
          const waitlistData = await res3.json();

          setRestaurants(restaurantsData || []);
          setAnalytics(analyticsData || []);
          setGlobalWaitlist(waitlistData || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, targetDate, refreshTrigger]);

  const handleAssignTable = async (table) => {
    if (!selectedCustomer || table.status !== "available") return;

    try {
      const token = localStorage.getItem("token");

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
      if (!res.ok) return alert(data.message || "Failed to assign table");

      setSelectedCustomer(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Server error occurred");
    }
  };

  const handleAddRestaurant = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/admin/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newRestaurant,
          menu: newRestaurant.menu ? newRestaurant.menu.split(",").map(i => i.trim()).filter(Boolean) : []
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed to add restaurant");

      setRestaurants((prev) => [data.restaurant, ...prev]);
      setNewRestaurant({ name: "", location: "", tables: 10, image: "", menu: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");

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

  const handleWalkIn = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/staff/walkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...walkInForm,
          date: targetDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed to add walk-in");

      setShowWalkInModal(false);
      setWalkInForm({ guestName: "", phone: "", partySize: 2 });
      setRefreshTrigger(prev => prev + 1);
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

          <div className="map-card" style={{ marginBottom: "20px" }}>
            <div className="section-head">
              <h3>Add Restaurant</h3>
            </div>

            <div className="admin-form">
              <input
                type="text"
                placeholder="Restaurant Name"
                value={newRestaurant.name}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Location"
                value={newRestaurant.location}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, location: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Tables"
                value={newRestaurant.tables}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, tables: Number(e.target.value) })
                }
              />
              <input
                type="text"
                placeholder="Image URL"
                value={newRestaurant.image}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, image: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Menu Items (comma separated)"
                value={newRestaurant.menu}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, menu: e.target.value })
                }
              />
              <button className="walkin-btn" onClick={handleAddRestaurant}>
                Add Restaurant
              </button>
            </div>
          </div>

          <div className="dash-grid">
            <section className="map-card">
              <div className="section-head">
                <h3>Restaurants</h3>
              </div>

              {loading ? (
                <div className="empty">Loading...</div>
              ) : restaurants.length === 0 ? (
                <div className="empty">No restaurants found.</div>
              ) : (
                restaurants.map((r) => (
                  <div key={r._id} className="wait-row">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {r.image && <img src={r.image} alt="thumb" style={{width: "40px", height: "40px", borderRadius: "8px", marginRight: "12px", objectFit: "cover"}} />}
                      <div>
                        <div className="cust-name">{r.name}</div>
                        <div className="cust-time">{r.location || "No location"} • {r.menu?.length || 0} menu items</div>
                      </div>
                    </div>
                    <button className="assign-btn" onClick={() => handleDelete(r._id)}>
                      Delete
                    </button>
                  </div>
                ))
              )}
            </section>

            <aside className="wait-card">
              <div className="section-head">
                <h3>Analytics</h3>
              </div>

              {loading ? (
                <div className="empty">Loading...</div>
              ) : analytics.length === 0 ? (
                <div className="empty">No analytics yet.</div>
              ) : (
                analytics.map((a, i) => (
                  <div key={i} className="wait-row">
                    <div>
                      <div className="cust-name">{a.restaurantName}</div>
                      <div className="cust-time">{a.totalBookings} bookings</div>
                      <small>₹{a.totalRevenue}</small>
                    </div>
                  </div>
                ))
              )}
            </aside>
          </div>

          <div className="dash-grid" style={{ marginTop: "20px", display: "block" }}>
            <section className="map-card">
              <div className="section-head">
                <h3>Global Waitlist</h3>
              </div>
              
              {loading ? (
                <div className="empty">Loading...</div>
              ) : globalWaitlist.length === 0 ? (
                <div className="empty">No customers waiting.</div>
              ) : (
                <div className="table-flex" style={{display: "block"}}>
                  {globalWaitlist.map((w) => (
                    <div key={w._id} className="wait-row">
                      <div>
                        <div className="cust-name">{w.userEmail.split("@")[0]}</div>
                        <div className="cust-time">{w.date} • {w.time} • {w.partySize} Guests</div>
                      </div>
                      <div className="pill" style={{background: "#eee", padding: "5px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold"}}>
                        {w.restaurantName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
            <input 
              type="date" 
              className="date-picker" 
              value={targetDate} 
              onChange={(e) => setTargetDate(e.target.value)} 
              style={{ marginLeft: "15px", padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
          </div>
          <button className="walkin-btn" onClick={() => setShowWalkInModal(true)}>+ Walk-In Booking</button>
        </div>

        {showWalkInModal && (
          <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div className="modal-content" style={{ background: "#fff", padding: "20px", borderRadius: "10px", width: "300px" }}>
              <h3>Add Walk-In</h3>
              <form onSubmit={handleWalkIn}>
                <input 
                  type="text" 
                  placeholder="Guest Name" 
                  value={walkInForm.guestName} 
                  onChange={e => setWalkInForm({...walkInForm, guestName: e.target.value})} 
                  required 
                  style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "5px" }}
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number (optional)" 
                  value={walkInForm.phone} 
                  onChange={e => setWalkInForm({...walkInForm, phone: e.target.value})} 
                  style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "5px" }}
                />
                <input 
                  type="number" 
                  placeholder="Party Size" 
                  value={walkInForm.partySize} 
                  onChange={e => setWalkInForm({...walkInForm, partySize: Number(e.target.value)})} 
                  min="1" 
                  required 
                  style={{ width: "100%", padding: "8px", margin: "10px 0", border: "1px solid #ccc", borderRadius: "5px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                  <button type="button" onClick={() => setShowWalkInModal(false)} style={{ padding: "8px 15px", borderRadius: "5px", border: "none", background: "#eee", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" className="walkin-btn" style={{ margin: 0 }}>Add to Waitlist</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
          <div className="stat-card"><span>Available</span><strong>{stats.available}</strong></div>
          <div className="stat-card"><span>Occupied</span><strong>{stats.occupied}</strong></div>
          <div className="stat-card"><span>Waitlist</span><strong>{stats.waiting}</strong></div>
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
            <div className="section-head">
              <div>
                <p className="sub">Queue Overview</p>
                <h3>Waitlist</h3>
              </div>
            </div>

            {loading ? (
              <div className="empty">Loading...</div>
            ) : waitlist.length === 0 ? (
              <div className="empty">No customers waiting.</div>
            ) : (
              waitlist.map((p) => (
                <div
                  key={p._id}
                  className={`wait-row ${selectedCustomer?._id === p._id ? "selected" : ""}`}
                >
                  <div>
                    <div className="cust-name">{p.name}</div>
                    <div className="cust-time">{p.time || "No time"}</div>
                    {p.guests && <small>{p.guests} Guests</small>}
                  </div>
                  <button className="assign-btn" onClick={() => setSelectedCustomer(p)}>
                    {selectedCustomer?._id === p._id ? "Selected" : "Assign"}
                  </button>
                </div>
              ))
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}