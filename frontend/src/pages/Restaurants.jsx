import React, { useEffect, useMemo, useState } from "react";
import "../styles/Restaurants.css";
import { useNavigate } from "react-router-dom";

function Restaurants() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showMenuFor, setShowMenuFor] = useState(null);
  const [restaurantData, setRestaurantData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "customer") {
      navigate("/");
      return;
    }

    const controller = new AbortController();

    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("http://localhost:5000/api/restaurants", {
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch restaurants");
        }

        setRestaurantData(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Restaurants fetch error:", err);
          setError("Unable to load restaurants");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();

    return () => controller.abort();
  }, [navigate]);

  const filteredRestaurants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return restaurantData;

    return restaurantData.filter((res) =>
      (res.name || "").toLowerCase().includes(query)
    );
  }, [restaurantData, searchTerm]);

  const handleCardClick = (id) => {
    setSelectedId((prev) => {
      if (prev === id) {
        setShowMenuFor(null);
        return null;
      }
      setShowMenuFor(null);
      return id;
    });
  };

  const handleMenuToggle = (e, id) => {
    e.stopPropagation();
    setShowMenuFor((prev) => (prev === id ? null : id));
  };

  const handleBookNow = (e, restaurant) => {
    e.stopPropagation();

    navigate("/book", {
      state: {
        restaurant: {
          _id: restaurant._id,
          id: restaurant._id,
          name: restaurant.name,
          location: restaurant.location,
          tables: restaurant.tables,
          pricePerSeat: restaurant.pricePerSeat,
        },
      },
    });
  };

  const getImage = (img) => {
    if (!img || !img.trim()) return "/dinesmart-logo.png";
    return img;
  };

  return (
    <div className="restaurants-container">
      <header className="page-header">
        <h1>
          Discover <span className="highlight">Excellence</span>
        </h1>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by restaurant name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" className="search-btn">
            Search
          </button>
        </div>
      </header>

      {loading && <p className="no-results">Loading restaurants...</p>}
      {error && <p className="no-results">{error}</p>}

      {!loading && !error && (
        <div className="restaurant-grid">
          {filteredRestaurants.map((res) => {
            const id = res._id;
            const isExpanded = selectedId === id;
            const isMenuOpen = showMenuFor === id;

            return (
              <div
                key={id}
                className={`res-card ${isExpanded ? "expanded" : ""}`}
                onClick={() => handleCardClick(id)}
              >
                <div className="image-container">
                  <img
                    src={getImage(res.image)}
                    alt={res.name}
                    className="main-img"
                    loading="lazy"
                    onError={(e) => {
                      if (e.currentTarget.src.includes("dinesmart-logo.png")) return;
                      e.currentTarget.src = "/dinesmart-logo.png";
                    }}
                  />
                  {res.tag && <span className="tag">{res.tag}</span>}
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <h2>{res.name}</h2>
                    <span className="rating">⭐ {res.rating || "4.5"}</span>
                  </div>

                  <p className="distance-text">
                    📍 {res.location || "Premium dining location"}
                  </p>

                  {isExpanded && (
                    <div
                      className="briefing-section"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <hr className="divider" />

                      <h4>Exclusive Seating</h4>

                      {Array.isArray(res.interiorImages) &&
                        res.interiorImages.length > 0 && (
                          <div className="interior-gallery">
                            {res.interiorImages.map((img, index) => (
                              <img
                                key={index}
                                src={img}
                                alt="interior"
                                className="gallery-img"
                                loading="lazy"
                              />
                            ))}
                          </div>
                        )}

                      <p className="review-box">
                        "{res.reviews || "A refined dining experience with elegant ambiance."}"
                      </p>

                      <div className="action-area">
                        <button
                          type="button"
                          className="menu-toggle-btn"
                          onClick={(e) => handleMenuToggle(e, id)}
                        >
                          {isMenuOpen ? "Hide Menu" : "View Full Menu"}
                        </button>

                        {isMenuOpen &&
                          Array.isArray(res.menu) &&
                          res.menu.length > 0 && (
                            <ul className="menu-list">
                              {res.menu.map((item, i) => (
                                <li key={i}>
                                  {typeof item === "string"
                                    ? item
                                    : `${item.name}${item.price ? ` - ₹${item.price}` : ""}`}
                                </li>
                              ))}
                            </ul>
                          )}

                        {isMenuOpen &&
                          (!Array.isArray(res.menu) || res.menu.length === 0) && (
                            <p className="no-results">Menu not available yet.</p>
                          )}

                        <button
                          type="button"
                          className="book-btn"
                          onClick={(e) => handleBookNow(e, res)}
                        >
                          Confirm Reservation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredRestaurants.length === 0 && (
            <p className="no-results">No restaurants found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Restaurants;