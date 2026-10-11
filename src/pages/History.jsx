
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "https://ai-music-mood-classifier-copy.onrender.com";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/history`);

      if (response.data.success) {
        setHistory(response.data.predictions || []);
      } else {
        setError("Unable to load prediction history.");
      }
    } catch (err) {
      console.error("History Error:", err);
      setError("Backend connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: "😊",
      sad: "😢",
      relaxed: "😌",
      energetic: "⚡",
      aggressive: "🔥",
      romantic: "❤️",
      dramatic: "🎭",
    };

    return emojis[String(mood || "").toLowerCase()] || "🎵";
  };

  const getIntensityClass = (intensity) => {
    const value = String(intensity || "low").toLowerCase();

    if (value === "high") return "history-intensity-high";
    if (value === "medium") return "history-intensity-medium";

    return "history-intensity-low";
  };

  const deleteHistoryItem = async (id) => {
    if (!window.confirm("Delete this prediction?")) return;

    try {
      const response = await axios.delete(`${API_URL}/history/${id}`);

      if (response.data.success) {
        setHistory((previous) =>
          previous.filter((item) => item.id !== id)
        );
      } else {
        alert("Could not delete prediction.");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete prediction.");
    }
  };

  const clearAllHistory = async () => {
    if (history.length === 0) {
      alert("There is no history to clear.");
      return;
    }

    if (!window.confirm("Clear all prediction history?")) return;

    try {
      const response = await axios.delete(`${API_URL}/history`);

      if (response.data.success) {
        setHistory([]);
      } else {
        alert("Could not clear history.");
      }
    } catch (err) {
      console.error("Clear History Error:", err);
      alert("Failed to clear history.");
    }
  };

  return (
    <div className="pro-history-page">
      <nav className="history-navbar">
        <Link to="/dashboard" className="history-brand">
          <span className="history-brand-icon">🎵</span>
          <span className="history-brand-text">
            <strong>AI Music Mood</strong>
            <small>Classifier</small>
          </span>
        </Link>

        <div className="history-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/upload">Upload Music</Link>
          <Link to="/history" className="active">History</Link>
          <Link to="/feedback">Feedback</Link>
        </div>
      </nav>

      <main className="history-main">
        <Link to="/dashboard" className="history-back-link">
          ← Back to Dashboard
        </Link>

        <section className="history-page-header">
          <div className="history-title-area">
            <div className="history-title-icon">📜</div>
            <div>
              <span className="history-section-label">MUSIC ANALYTICS</span>
              <h1>Prediction History</h1>
              <p>
                View and manage your previously analyzed music and AI mood predictions.
              </p>
            </div>
          </div>

          <button
            className="history-clear-btn"
            onClick={clearAllHistory}
            disabled={history.length === 0}
          >
            🗑️ Clear All
          </button>
        </section>

        <section className="history-stats">
          <div className="history-stat-card">
            <div className="history-stat-icon purple">📊</div>
            <div>
              <span>Total Predictions</span>
              <strong>{history.length}</strong>
            </div>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-icon blue">🎵</div>
            <div>
              <span>Music Analyses</span>
              <strong>{history.length}</strong>
            </div>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-icon green">🤖</div>
            <div>
              <span>AI Analysis</span>
              <strong>Ready</strong>
            </div>
          </div>
        </section>

        {loading && (
          <div className="history-status-card">
            <div className="history-loading-icon">⏳</div>
            <h3>Loading Prediction History</h3>
            <p>Please wait while we retrieve your previous AI analyses.</p>
          </div>
        )}

        {!loading && error && (
          <div className="history-error-card">
            <div className="history-error-icon">⚠️</div>
            <div>
              <h3>Unable to Load History</h3>
              <p>{error}</p>
              <button className="history-retry-btn" onClick={fetchHistory}>
                🔄 Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <section className="history-empty-card">
            <div className="history-empty-icon">🎵</div>
            <span className="history-empty-label">NO ANALYSIS FOUND</span>
            <h2>No Prediction History</h2>
            <p>
              Your analyzed songs and AI mood predictions will appear here.
            </p>
            <Link to="/upload" className="history-upload-btn">
              🎵 Upload Music →
            </Link>
          </section>
        )}

        {!loading && !error && history.length > 0 && (
          <section className="history-data-section">
            <div className="history-data-header">
              <div>
                <span>ANALYSIS RECORDS</span>
                <h2>Your Predictions</h2>
              </div>
              <div className="history-record-count">
                {history.length} Records
              </div>
            </div>

            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Music</th>
                    <th>Detected Mood</th>
                    <th>Confidence</th>
                    <th>Intensity</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="history-song-cell">
                          <div className="history-song-icon">🎵</div>
                          <div>
                            <strong>{item.song}</strong>
                            <span>AI Music Analysis</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="history-mood-badge">
                          {getMoodEmoji(item.mood)} {item.mood}
                        </span>
                      </td>

                      <td>
                        <div className="history-confidence">
                          <strong>
                            {String(item.confidence ?? 0).replace("%", "")}%
                          </strong>
                          <div className="history-confidence-bar">
                            <span
                              style={{
                                width: `${Math.min(
                                  Number(String(item.confidence ?? 0).replace("%", "")) || 0,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`history-intensity-badge ${getIntensityClass(item.intensity)}`}>
                          {item.intensity || "Low"}
                        </span>
                      </td>

                      <td>
                        <span className="history-date">📅 {item.date}</span>
                      </td>

                      <td>
                        <button
                          className="history-delete-btn"
                          onClick={() => deleteHistoryItem(item.id)}
                          title="Delete prediction"
                        >
                          🗑️ <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className="history-footer">
          <strong>🎵 AI Music Mood Classifier</strong>
          <span>Intelligent Music Emotion Analysis</span>
        </footer>
      </main>
    </div>
  );
}

export default History;
