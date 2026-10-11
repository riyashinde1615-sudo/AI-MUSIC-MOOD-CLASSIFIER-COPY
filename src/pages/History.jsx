import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./History.css";

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(
        localStorage.getItem("predictionHistory") || "[]"
      );

      if (Array.isArray(savedHistory)) {
        setHistory(savedHistory);
      }
    } catch (error) {
      console.error("Unable to load prediction history:", error);
      setHistory([]);
    }
  }, []);

  const clearAll = () => {
    if (window.confirm("Clear all prediction history?")) {
      localStorage.removeItem("predictionHistory");
      setHistory([]);
    }
  };

  return (
    <div className="history-page">
      <div className="history-container">

        <Link to="/dashboard" className="history-back">
          ← Back to Dashboard
        </Link>

        <div className="history-header">
          <div className="history-icon">📜</div>

          <div className="history-title-content">
            <p className="history-eyebrow">MUSIC ANALYTICS</p>
            <h1>Prediction History</h1>
            <p className="history-description">
              View and manage your previously analyzed music
              and AI mood predictions.
            </p>
          </div>
        </div>

        <div className="history-actions">
          <button
            className="clear-history-button"
            onClick={clearAll}
          >
            🗑️ Clear All
          </button>
        </div>

        {history.length > 0 && (
          <div className="history-records">
            {history.map((item, index) => (
              <div className="history-record" key={index}>
                <span className="history-song">
                  🎵 {item.filename || item.song_name || item.song || "Unknown Song"}
                </span>

                <span className="history-mood">
                  {item.mood || item.intensity || "Unknown"}
                </span>

                <span className="history-date">
                  📅 {String(item.date || "").split(/[ T]/)[0] || "Date unavailable"}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default History;