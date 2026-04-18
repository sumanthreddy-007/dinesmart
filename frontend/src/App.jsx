import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import BookTable from "./pages/BookTable";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Waitlist from "./pages/Waitlist";

// Protected Route
const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      {localStorage.getItem("token") && <Navbar />}

      <Routes>
        <Route path="/" element={<Login />} />

        {/* CUSTOMER */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute role="customer">
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurants"
          element={
            <ProtectedRoute role="customer">
              <Restaurants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book"
          element={
            <ProtectedRoute role="customer">
              <BookTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waitlist"
          element={
            <ProtectedRoute role="customer">
              <Waitlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="customer">
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* STAFF */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute role="staff">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;