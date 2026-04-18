import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [isLoginView, setIsLoginView] = useState(true);
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  const redirectByRole = (userRole) => {
    if (userRole === "customer") navigate("/customer");
    else if (userRole === "staff") navigate("/staff");
    else if (userRole === "admin") navigate("/admin");
    else navigate("/");
  };

  useEffect(() => {
    if (isLoginView || role !== "staff") return;

    const controller = new AbortController();

    const fetchRestaurants = async () => {
      try {
        setLoadingRestaurants(true);

        const res = await fetch("http://localhost:5000/api/restaurants", {
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load restaurants");
        }

        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);

        if (list.length > 0) {
          setRestaurantId(list[0]._id);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Restaurant fetch error:", error);
          setRestaurants([]);
          setRestaurantId("");
        }
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();

    return () => controller.abort();
  }, [isLoginView, role]);

  useEffect(() => {
    if (role !== "staff") {
      setRestaurantId("");
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isLoginView
      ? "http://localhost:5000/api/auth/login"
      : "http://localhost:5000/api/auth/register";

    const payload = isLoginView
      ? { email, password }
      : {
          email,
          password,
          role,
          ...(role === "staff" ? { restaurantId } : {}),
        };

    if (!isLoginView && role === "staff" && !restaurantId) {
      alert("Please select a restaurant");
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      let data = {};

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        alert("Unexpected server response");
        return;
      }

      if (!res.ok) {
        alert(
          data.message || (isLoginView ? "Login failed" : "Registration failed")
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("email", data.user.email);

      if (data.user.restaurantId) {
        localStorage.setItem("restaurantId", data.user.restaurantId);
      } else {
        localStorage.removeItem("restaurantId");
      }

      if (data.user.restaurantName) {
        localStorage.setItem("restaurantName", data.user.restaurantName);
      } else {
        localStorage.removeItem("restaurantName");
      }

      redirectByRole(data.user.role);
    } catch (error) {
      console.error("Frontend fetch error:", error);
      alert(error.message || "Server error");
    }
  };

  const toggleView = () => setIsLoginView((prev) => !prev);

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-left">
          <h1 className="brand">
            Dine<span>Smart</span>
          </h1>
          <h2 className="tagline">
            Discover.
            <br />
            Book.
            <br />
            Enjoy.
          </h2>
          <p className="desc">
            Exclusive dining reservations for hotel guests.
          </p>
        </div>

        <div className="login-right">
          <div className="login-box">
            <h2>{isLoginView ? "Welcome" : "Create Account"}</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {!isLoginView && (
                <div className="input-group">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Hotel Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              {!isLoginView && role === "staff" && (
                <div className="input-group">
                  <select
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value)}
                    required
                    disabled={loadingRestaurants || restaurants.length === 0}
                  >
                    {loadingRestaurants ? (
                      <option value="">Loading restaurants...</option>
                    ) : restaurants.length === 0 ? (
                      <option value="">No restaurants available</option>
                    ) : (
                      restaurants.map((restaurant) => (
                        <option key={restaurant._id} value={restaurant._id}>
                          {restaurant.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div className="input-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">
                {isLoginView ? "SIGN IN" : "REGISTER"}
              </button>
            </form>

            <button type="button" className="toggle-btn" onClick={toggleView}>
              {isLoginView
                ? "Create an account instead"
                : "Already have an account?"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;