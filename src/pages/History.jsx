
import React, { useEffect, useState } from "react";
import "./History.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

const formatDateTime = (dateString) => {
  if (!dateString) return "Time unavailable";

  // Backend timestamp should contain Z or a timezone offset.
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/history`);

        if (!response.ok) {
          throw new Error("Unable to load history.");
        }

        const data = await response.json();

        // Supports either an array or { history: [...] }
        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.history)
          ? data.history
          : [];

        setHistory(records);
      } catch (err) {
        setError(
          "History load होत नाही. Backend सुरू आहे का ते तपासा."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="history-page">
      <div className="history-container">
        <h1>Prediction History</h1>
        <p className="history-subtitle">
          Your previous music mood predictions
        </p>

        {loading && (
          <p className="history-message">Loading history...</p>
        )}

        {!loading && error && (
          <p className="history-error">{error}</p>
        )}

        {!loading && !error && history.length === 0 && (
          <p className="history-message">
            No prediction history found.
          </p>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="history-list">
            {history.map((item, index) => {
              const songName =
                item.song_name ||
                item.filename ||
                item.file_name ||
                "Unknown Song";

              const mood =
                item.mood ||
                item.predicted_mood ||
                "Unknown";

              const timestamp =
                item.created_at ||
                item.timestamp ||
                item.date ||
                item.datetime;

              return (
                <div
                  className="history-card"
                  key={item.id ?? `${songName}-${index}`}
                >
                  <div className="history-card-top">
                    <div>
                      <h3>{songName}</h3>
                      <p className="history-mood">
                        Mood: <strong>{mood}</strong>
                      </p>
                    </div>
                  </div>

                  <p className="history-time">
                    <span>📅</span>{" "}
                    {formatDateTime(timestamp)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <button
          className="history-refresh"
          onClick={() => window.location.reload()}
        >
          Refresh History
        </button>
      </div>
    </div>
  );
}

export default History;
