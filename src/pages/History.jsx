
import React, { useEffect, useState } from "react";
import "./History.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

const formatDate = (dateString) => {
  if (!dateString) return "Date unavailable";

  // Handles timestamps such as "2026-10-11 11:22:43"
  const normalized = dateString.includes("T")
    ? dateString
    : dateString.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return dateString.split(" ")[0];
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
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

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.predictions)
          ? data.predictions
          : [];

        setHistory(records);
      } catch (err) {
        setError(
          "History load होत नाही. कृपया पुन्हा प्रयत्न करा."
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
          <p className="history-message">
            Loading history...
          </p>
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
