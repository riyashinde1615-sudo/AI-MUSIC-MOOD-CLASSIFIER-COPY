
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./History.css";

const API_URL = "https://ai-music-mood-classifier-copy.onrender.com";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/history`);
      if (!response.ok) throw new Error("Unable to load history");

      const data = await response.json();
      setHistory(
        Array.isArray(data.predictions) ? data.predictions : []
      );
    } catch (err) {
      console.error(err);
      setError("History load failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearAll = async () => {
    if (!window.confirm("Delete all prediction history?")) return;

    try {
      setClearing(true);
      const response = await fetch(`${API_URL}/history`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error("Unable to clear history");
      }

      setHistory([]);
      alert("All history cleared successfully.");
    } catch (err) {
      console.error(err);
      setError("Could not clear history. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const deleteRecord = async (item) => {
    if (item.id == null) {
      alert("Record ID is missing.");
      return;
    }

    if (!window.confirm("Delete this record?")) return;

    try {
      const response = await fetch(
        `${API_URL}/history/${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error("Delete failed");
      }

      setHistory((previous) =>
        previous.filter((record) => record.id !== item.id)
      );
    } catch (err) {
      console.error(err);
      setError("Could not delete this record.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : "N/A";
  };

  return (
    <div className="history-page">
      <main className="history-container">
        <Link to="/dashboard" className="history-back">
          ← Back to Dashboard
        </Link>

        <header className="history-header">
          <div className="history-icon">📜</div>
          <div>
            <p className="history-eyebrow">MUSIC ANALYTICS</p>
            <h1>Prediction History</h1>
            <p className="history-description">
              View and manage your previously analyzed music
              and AI mood predictions.
            </p>
          </div>
        </header>

        <section className="history-toolbar">
          <div>
            <h2>Your Predictions</h2>
            <p>{history.length} Records</p>
          </div>

          <button
            className="clear-all-button"
            onClick={clearAll}
            disabled={clearing || loading || history.length === 0}
          >
            {clearing ? "Clearing..." : "🗑️ Clear All"}
          </button>
        </section>

        {loading && <p className="history-message">Loading history...</p>}

        {error && (
          <div className="history-error">
            <p>{error}</p>
            <button onClick={fetchHistory}>Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <section className="history-table-card">
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>SONG NAME</th>
                    <th>MOOD</th>
                    <th>INTENSITY</th>
                    <th>DATE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="history-empty">
                        🎵 No prediction history found.
                        <br />
                        <Link to="/upload">Upload Music →</Link>
                      </td>
                    </tr>
                  ) : (
                    history.map((item, index) => {
                      const song =
                        item.song_name ||
                        item.song ||
                        item.filename ||
                        item.file_name ||
                        "Unknown Song";

                      return (
                        <tr key={item.id ?? `${song}-${index}`}>
                          <td className="history-song">🎵 {song}</td>
                          <td>{item.mood || "N/A"}</td>
                          <td>
                            <span className="intensity-badge">
                              {item.intensity || "N/A"}
                            </span>
                          </td>
                          <td>📅 {formatDate(item.date || item.created_at)}</td>
                          <td>
                            <button
                              className="delete-button"
                              onClick={() => deleteRecord(item)}
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
          </section>
        )}

        <div className="history-bottom">
          <button
            className="refresh-button"
            onClick={fetchHistory}
            disabled={loading || clearing}
          >
            ↻ Refresh History
          </button>

          <Link to="/dashboard" className="dashboard-button">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

export default History;
