import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./History.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  // Read recent records saved in this browser.
  const getLocalHistory = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("predictionHistory") || "[]"
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  };

  const getSongName = (item) =>
    item.filename ||
    item.song_name ||
    item.song ||
    item.file_name ||
    item.audio_file ||
    "Unknown Song";

  const getDate = (item) => {
    const value =
      item.date ||
      item.created_at ||
      item.timestamp ||
      item.datetime;

    if (!value) return "Date unavailable";

    return String(value).split(/[ T]/)[0];
  };

  const getIntensity = (item) =>
    item.intensity || item.mood || "Unknown";

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/history`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.error || "History request failed.");
      }

      const backendRecords = Array.isArray(data.predictions)
        ? data.predictions
        : [];

      // Combine backend and local records without duplicate IDs.
      const localRecords = getLocalHistory();
      const combined = [...backendRecords];

      localRecords.forEach((localItem) => {
        const duplicate = combined.some((serverItem) => {
          if (
            localItem.id != null &&
            serverItem.id != null
          ) {
            return String(localItem.id) === String(serverItem.id);
          }

          return (
            getSongName(localItem) === getSongName(serverItem) &&
            getDate(localItem) === getDate(serverItem) &&
            (localItem.mood || "") === (serverItem.mood || "")
          );
        });

        if (!duplicate) combined.push(localItem);
      });

      combined.sort((a, b) => {
        const dateA = new Date(
          a.date || a.created_at || a.timestamp || 0
        ).getTime();
        const dateB = new Date(
          b.date || b.created_at || b.timestamp || 0
        ).getTime();

        return dateB - dateA;
      });

      setHistory(combined);
    } catch (err) {
      console.error("History loading error:", err);

      const localRecords = getLocalHistory();
      setHistory(localRecords);

      setError(
        localRecords.length
          ? "Backend history उपलब्ध नाही. Browser मधील अलीकडील records दाखवत आहोत."
          : "History load झाली नाही. पुन्हा प्रयत्न करा."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const deleteRecord = async (item) => {
    if (!window.confirm("Delete this history record?")) return;

    try {
      if (item.id != null) {
        const response = await fetch(
          `${API_URL}/history/${item.id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Backend delete failed.");
        }

        const result = await response.json();
        if (result.success === false) {
          throw new Error(result.error || "Delete failed.");
        }
      }

      const updated = history.filter((record) => record !== item);
      setHistory(updated);

      // Keep local-only records in browser storage.
      const localRecords = getLocalHistory();
      const remainingLocal = localRecords.filter(
        (record) =>
          !(
            getSongName(record) === getSongName(item) &&
            getDate(record) === getDate(item) &&
            (record.mood || "") === (item.mood || "")
          )
      );

      localStorage.setItem(
        "predictionHistory",
        JSON.stringify(remainingLocal)
      );
    } catch (err) {
      alert(
        err.message ||
          "Record delete झाला नाही. पुन्हा प्रयत्न करा."
      );
    }
  };

  const clearAll = async () => {
    if (!history.length) return;

    if (
      !window.confirm(
        "सर्व prediction history delete करायची आहे का?"
      )
    ) {
      return;
    }

    setClearing(true);

    try {
      const response = await fetch(`${API_URL}/history`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Backend clear failed.");
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.error || "Clear failed.");
      }

      localStorage.removeItem("predictionHistory");
      setHistory([]);
      setError("");
    } catch (err) {
      alert(
        err.message ||
          "History clear झाली नाही. पुन्हा प्रयत्न करा."
      );
    } finally {
      setClearing(false);
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

        <div className="history-toolbar">
          <div>
            <h2>Your Predictions</h2>
            <p>
              {history.length} prediction
              {history.length === 1 ? "" : "s"} found
            </p>
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
            <p className="history-message">
              Loading prediction history...
            </p>
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
                          No prediction history found.
                          <br />
                          <Link to="/upload">
                            Analyze a song to get started
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      history.map((item, index) => (
                        <tr
                          key={
                            item.id ??
                            `${getSongName(item)}-${getDate(item)}-${index}`
                          }
                        >
                          <td className="history-song">
                            🎵 {getSongName(item)}
                          </td>

                          <td>
                            <span className="intensity-badge">
                              {getIntensity(item)}
                            </span>
                          </td>

                          <td>{getDate(item)}</td>

                          <td>
                            <button
                              className="delete-button"
                              onClick={() => deleteRecord(item)}
                            >
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
              <button
                className="refresh-button"
                onClick={loadHistory}
                disabled={loading}
              >
                ↻ Refresh History
              </button>

              <Link
                to="/dashboard"
                className="dashboard-button"
              >
                ← Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default History;