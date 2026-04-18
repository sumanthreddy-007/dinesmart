import React from "react";
import "../styles/Waitlist.css";

function Waitlist() {
  const waitlist = [];

  return (
    <div className="waitlist-container">
      <h2>Waitlist</h2>

      {waitlist.length === 0 ? (
        <p>No one in waitlist</p>
      ) : (
        <ul>
          {waitlist.map((item, i) => (
            <li key={i}>
              {item.name} - {item.people} people
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Waitlist;