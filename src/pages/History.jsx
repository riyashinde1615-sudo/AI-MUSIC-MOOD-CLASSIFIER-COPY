
import React, { useEffect, useState } from "react";
import "./History.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const datePart = String(value).trim().split(/[ T]/)[0];
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  return match
    ? `${match[1]}-${match[2]}-${match[3]}`
    : datePart;
};

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/history`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const records = Array.isArray(data.predictions)
        ? data.predictions
        : Array.isArray(data.history)
        ? data.history
        : Array.isArray(data)
        ? data
        : null;

      if (!records) {
        throw new Error("Invalid history response");
      }

      setHistory(records);
    } catch (err) {
      console.error("History API error:", err);
      setError(`History load failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // This removes the record from the current screen only.
  // Permanent deletion needs a backend DELETE endpoint.
  const removeFromScreen = (index) => {
    if (window.confirm("हा record स्क्रीनवरून काढायचा आहे का?")) {
      setHistory((previous) =>
        previous.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-heading">
          <div>
            <p className="history-eyebrow">ANALYSIS RECORDS</p>
            <h1>Your Predictions</h1>
          </div>

          <span className="history-count">
            {history.length} Records
          </span>
        </div>

        {loading && (
          <p className="history-message">Loading history...</p>
        )}

        {!loading && error && (
          <div className="history-error">
            <p>{error}</p>
            <button
              className="history-refresh"
              onClick={fetchHistory}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>SONG NAME</th>
                  <th>INTENSITY</th>
                  <th>DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      No prediction history found.
                    </td>
                  </tr>
                ) : (
                  history.map((item, index) => {
                    const songName =
                      item.song_name ||
                      item.song ||
                      item.filename ||
                      item.file_name ||
                      item.audio_file ||
                      "Unknown Song";

                    const intensity =
                      item.intensity || "Not available";

                    const dateValue =
                      item.date ||
                      item.created_at ||
                      item.timestamp ||
                      item.datetime;

                    return (
                      <tr
                        key={item.id ?? `${songName}-${index}`}
                      >
                        <td className="history-song-name">
                          🎵 {songName}
                        </td>

                        <td>
                          <span className="intensity-badge">
                            {intensity}
                          </span>
                        </td>

                        <td>
                          📅 {formatDate(dateValue)}
                        </td>

                        <td>
                          <button
                            className="delete-button"
                            onClick={() => removeFromScreen(index)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <button
            className="history-refresh"
            onClick={fetchHistory}
          >
            Refresh History
          </button>
        )}
      </div>
    </div>
  );
}

export default History;
