import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./History.css";

const API_URL = "https://ai-music-mood-classifier-copy.onrender.com";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/history`);
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Unable to load history.");
      }
      setHistory(Array.isArray(data.predictions) ? data.predictions : []);
    } catch (err) {
      console.error("History loading error:", err);
      setError("History load झाली नाही. Backend तपासा आणि Retry करा.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getSongName = (item) =>
    item.filename || item.song_name || item.song || item.file_name || item.audio_file || "Unknown Song";

  const getDate = (item) => {
    const value = item.date || item.created_at || item.timestamp || item.datetime;
    return value ? String(value).split(/[ T]/)[0] : "Date unavailable";
  };

  const getIntensity = (item) => item.intensity || item.mood || "Unknown";

  const deleteRecord = async (item) => {
    if (item.id == null) {
      alert("This record has no ID and cannot be deleted individually.");
      return;
    }
    if (!window.confirm("Delete this history record?")) return;
    try {
      const response = await fetch(`${API_URL}/history/${item.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Delete failed.");
      }
      await loadHistory();
    } catch (err) {
      alert(err.message || "Unable to delete record.");
    }
  };

  const clearAll = async () => {
    if (!history.length || !window.confirm("Clear all prediction history?")) return;
    setClearing(true);
    try {
      const response = await fetch(`${API_URL}/history`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Clear history failed.");
      }
      setHistory([]);
    } catch (err) {
      alert(err.message || "Unable to clear history.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="history-page">
      <div className="history-container">
        <Link to="/dashboard" className="history-back">← Back to Dashboard</Link>

        <div className="history-header">
          <div className="history-icon">📜</div>
          <div className="history-title-content">
            <p className="history-eyebrow">MUSIC ANALYTICS</p>
            <h1>Prediction History</h1>
            <p className="history-description">
              View and manage your previously analyzed music and AI mood predictions.
            </p>
          </div>
        </div>

        <div className="history-toolbar">
          <div>
            <h2>Your Predictions</h2>
            <p>{history.length} prediction{history.length === 1 ? "" : "s"} found</p>
          </div>
          <button
            className="clear-all-button"
            onClick={clearAll}
            disabled={clearing || loading || history.length === 0}
          >
            {clearing ? "Clearing..." : "🗑️ Clear All"}
          </button>
        </div>

        {error && (
          <div className="history-error">
            <p>{error}</p>
            <button onClick={loadHistory}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="history-table-card">
            <p className="history-message">Loading prediction history...</p>
          </div>
        ) : (
          <>
            <div className="history-table-card">
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>SONG NAME</th>
                      <th>MOOD / INTENSITY</th>
                      <th>DATE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="history-empty">
                          No prediction history found.<br />
                          <Link to="/upload">Analyze a song to get started</Link>
                        </td>
                      </tr>
                    ) : (
                      history.map((item, index) => (
                        <tr key={item.id ?? `${getSongName(item)}-${index}`}>
                          <td className="history-song">🎵 {getSongName(item)}</td>
                          <td><span className="intensity-badge">{getIntensity(item)}</span></td>
                          <td>{getDate(item)}</td>
                          <td>
                            <button className="delete-button" onClick={() => deleteRecord(item)}>
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="history-bottom">
              <button className="refresh-button" onClick={loadHistory} disabled={loading}>
                ↻ Refresh History
              </button>
              <Link to="/dashboard" className="dashboard-button">← Dashboard</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default History;