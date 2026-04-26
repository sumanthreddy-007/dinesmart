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

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;

  return children;
};

function App() {
  const hasToken = Boolean(localStorage.getItem("token"));

  return (
    <Router>
      {hasToken && <Navbar />}

      <Routes>
        <Route path="/" element={<Login />} />

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

        <Route
          path="/staff"
          element={
            <ProtectedRoute role="staff">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;