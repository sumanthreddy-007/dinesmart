import React, { useState } from "react";
import "../styles/Profile.css";

function Profile() {
  const [name, setName] = useState(localStorage.getItem("name") || "User");
  const [image, setImage] = useState(null);

  const handleNameChange = (e) => {
    setName(e.target.value);
    localStorage.setItem("name", e.target.value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      <div className="profile-top">
        <img
          src={image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          alt="profile"
          className="profile-pic"
        />

        <input type="file" onChange={handleImageChange} />

        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          className="name-input"
        />
      </div>

      <div className="profile-section">
        <h3>Previous Reservations</h3>
        <p>No data yet</p>
      </div>

      <div className="profile-section">
        <h3>Payment History</h3>
        <p>No data yet</p>
      </div>

      <div className="profile-section">
        <h3>Orders</h3>
        <p>No data yet</p>
      </div>
    </div>
  );
}

export default Profile;