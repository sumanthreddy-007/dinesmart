import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || role !== "customer") {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="home-container">
      {/* HERO */}
      <header
        className="hero"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,10,10,0.55), rgba(10,10,10,0.7)), url('https://images.unsplash.com/photo-1544148103-0773bf10d330')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="hero-content">
          <p className="subtitle">EXCLUSIVE HOTEL DINING</p>
          <h1 className="main-title">
            Dine In <br />
            Luxury
          </h1>
          <p className="hero-desc">
            Reserve elegant dining spaces, discover premium restaurants, and
            enjoy a seamless reservation experience crafted for hotel guests.
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "24px",
            }}
          >
            
          </div>
        </div>
      </header>

      {/* ABOUT */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
              alt="Luxury restaurant interior"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "24px",
              }}
            />
          </div>

          <div className="about-text">
            <p className="subtitle">STEPS FROM YOUR SUITE</p>
            <h2 className="section-title">
              An ambiance that deserves to be <span>savored</span>
            </h2>
            <div className="divider-line"></div>
            <p className="about-desc">
              From elegant interiors to expertly crafted menus, DineSmart helps
              guests discover memorable dining without leaving the comfort of
              their hotel experience.
            </p>

            <div className="stats-list" style={{ marginTop: "20px" }}>
              <p>✓ Handpicked premium dining spaces</p>
              <p>✓ Smooth table reservation flow</p>
              <p>✓ Ideal for couples, families, and groups</p>
            </div>

            <button
              className="main-btn mt-20"
              onClick={() => navigate("/restaurants")}
            >
              EXPLORE SPACES
            </button>
          </div>
        </div>
      </section>

      {/* SIGNATURE */}
      <section className="chef-section">
        <div className="chef-content">
          <p className="subtitle">DELIGHT IN EVERY BITE</p>
          <h2 className="main-title">
            Signature <br />
            Experiences
          </h2>

          <p className="hero-desc" style={{ maxWidth: "520px", marginTop: "16px" }}>
            Whether it is a candlelight dinner, a family celebration, or a
            relaxed gourmet evening, our curated restaurant selection gives you
            the perfect atmosphere for every moment.
          </p>

          <div className="stats-list">
            <p>✓ Priority Seating for Hotel Guests</p>
            <p>✓ Premium Ambience & Interior Design</p>
            <p>✓ Curated Menus with Top Rated Dishes</p>
          </div>

          <button
            className="outline-btn mt-20"
            onClick={() => navigate("/restaurants")}
          >
            VIEW DINING OPTIONS
          </button>
        </div>

        <div className="chef-image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
            alt="Signature gourmet dish"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "999px",
            }}
          />
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section
        style={{
          padding: "80px 8%",
          background: "#111214",
        }}
      >
        <p className="subtitle" style={{ textAlign: "center" }}>
          WHY CHOOSE DINESMART
        </p>
        <h2
          className="section-title"
          style={{ textAlign: "center", marginBottom: "40px" }}
        >
          Premium dining made <span>simple</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <h3 style={{ color: "#D4AF37", marginBottom: "12px" }}>
              Curated Restaurants
            </h3>
            <p style={{ color: "#d6d0bc", lineHeight: "1.7" }}>
              Browse handpicked restaurants with rich ambience, great food, and
              premium service.
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <h3 style={{ color: "#D4AF37", marginBottom: "12px" }}>
              Easy Reservations
            </h3>
            <p style={{ color: "#d6d0bc", lineHeight: "1.7" }}>
              Select your date, time, and seating preferences in a clean,
              simple booking flow.
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <h3 style={{ color: "#D4AF37", marginBottom: "12px" }}>
              Luxury Experience
            </h3>
            <p style={{ color: "#d6d0bc", lineHeight: "1.7" }}>
              Enjoy an elevated restaurant discovery experience designed for
              premium stays and special moments.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;