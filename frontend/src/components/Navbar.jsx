import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const linksRef = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    transform: "translateX(0px)",
    opacity: 0,
  });

  const role = localStorage.getItem("role");

  const pages = useMemo(() => {
    if (role === "customer") {
      return [
        { name: "Home", path: "/customer" },
        { name: "Restaurants", path: "/restaurants" },
        { name: "Waitlist", path: "/waitlist" },
      ];
    }

    if (role === "staff") {
      return [{ name: "Dashboard", path: "/staff" }];
    }

    if (role === "admin") {
      return [{ name: "Admin Panel", path: "/admin" }];
    }

    return [];
  }, [role]);

  useEffect(() => {
    const index = pages.findIndex((p) => p.path === location.pathname);
    const el = linksRef.current[index];

    if (el) {
      setIndicatorStyle({
        width: el.offsetWidth,
        transform: `translateX(${el.offsetLeft}px)`,
        opacity: 1,
      });
    } else {
      setIndicatorStyle({
        width: 0,
        transform: "translateX(0px)",
        opacity: 0,
      });
    }
  }, [location.pathname, pages]);

  if (location.pathname === "/") return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        Dine<span>Smart</span>
      </div>

      <ul className="nav-links">
        {pages.map((p, i) => (
          <li key={p.path}>
            <Link
              to={p.path}
              ref={(el) => (linksRef.current[i] = el)}
              className={`nav-item ${location.pathname === p.path ? "active" : ""}`}
            >
              {p.name}
            </Link>
          </li>
        ))}
        <span className="nav-indicator" style={indicatorStyle}></span>
      </ul>

      <div className="nav-right">
        <button
          type="button"
          className="profile-icon"
          onClick={() => navigate("/profile")}
          aria-label="Profile"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </button>

        <button className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;