
import React, { useEffect, useState } from "react";
import "./History.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  // API example: "2026-10-11 11:22:43"
  // Extract only the date, without converting timezones.
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
    const controller = new AbortController();

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/history`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data.predictions)) {
          setHistory(data.predictions);
        } else if (Array.isArray(data.history)) {
          setHistory(data.history);
        } else if (Array.isArray(data)) {
          setHistory(data);
        } else {
          throw new Error("Unexpected history response format.");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("History error:", err);
          setError(
            "History load होत नाही. Refresh करून पुन्हा प्रयत्न करा."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => controller.abort();
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
          <div className="history-error">
            <p>{error}</p>
            <button
              className="history-refresh"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
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

        {!loading && (
          <button
            className="history-refresh"
            onClick={() => window.location.reload()}
          >
            Refresh History
          </button>
        )}
      </div>
    </div>
  );
}

export default History;
