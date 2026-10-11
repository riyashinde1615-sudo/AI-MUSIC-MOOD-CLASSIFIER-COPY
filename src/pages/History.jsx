
import React, { useEffect, useState } from "react";
import "./History.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  // Backend date is "2026-10-11 11:22:43"
  // Keep only the date part; do not parse or convert timezone.
  const datePart = String(value).trim().split(/[ T]/)[0];

  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return datePart;

  return `${match[1]}-${match[2]}-${match[3]}`;
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
          throw new Error("Unable to load history");
        }

        const data = await response.json();

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.predictions)
          ? data.predictions
          : Array.isArray(data.history)
          ? data.history
          : [];

        setHistory(records);
      } catch (err) {
        setError("History load होत नाही. पुन्हा प्रयत्न करा.");
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
                item.song ||
                item.song_name ||
                item.filename ||
                item.file_name ||
                "Unknown Song";

              const mood =
                item.mood ||
                item.predicted_mood ||
                "Unknown";

              const dateValue =
                item.date ||
                item.created_at ||
                item.timestamp ||
                item.datetime;

              return (
                <div
                  className="history-card"
                  key={item.id ?? `${songName}-${index}`}
                >
                  <h3>{songName}</h3>

                  <p className="history-mood">
                    Mood: <strong>{mood}</strong>
                  </p>

                  <p className="history-date">
                    📅 Date: {formatDate(dateValue)}
                  </p>

                  {item.confidence !== undefined && (
                    <p className="history-confidence">
                      Confidence: {item.confidence}%
                    </p>
                  )}

                  {item.intensity && (
                    <p className="history-intensity">
                      Intensity: {item.intensity}
                    </p>
                  )}
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
