
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MoodTransition.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

function MoodTransition() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("uploadedSongName");
    if (savedName) setSongName(savedName);

    try {
      const saved = JSON.parse(
        localStorage.getItem("moodTransitionData") || "null"
      );

      const items = Array.isArray(saved)
        ? saved
        : saved?.transitions;

      if (Array.isArray(items)) setTransitions(items);
    } catch (err) {
      console.error("Saved transition data error:", err);
    }
  }, []);

  const analyzeTransition = async () => {
    setLoading(true);
    setError("");

    try {
      const file = window.__uploadedAudioFile;

      if (!(file instanceof File)) {
        setError(
          "Please upload the song again before analyzing mood transition."
        );
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/mood-transition`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Mood transition analysis failed."
        );
      }

      const items = Array.isArray(data.transitions)
        ? data.transitions
        : [];

      setTransitions(items);

      localStorage.setItem(
        "moodTransitionData",
        JSON.stringify(data)
      );
    } catch (err) {
      console.error("Mood transition error:", err);
      setError(err.message || "Unable to analyze mood transition.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const total = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(total / 60);
    const remaining = Math.floor(total % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  const getEmoji = (mood) => {
    const value = String(mood || "").toLowerCase();

    if (value.includes("happy")) return "😊";
    if (value.includes("sad")) return "😢";
    if (value.includes("relax") || value.includes("calm")) return "😌";
    if (value.includes("energetic")) return "⚡";
    if (value.includes("aggressive")) return "🔥";

    return "🎵";
  };

  return (
    <div className="mood-transition-page">
      <div className="mood-transition-container">
        <Link to="/mood-result" className="mood-transition-back">
          ← Back to Mood Result
        </Link>

        <div className="mood-transition-header">
          <div className="mood-transition-icon">🔄</div>
          <h1>Mood Transition</h1>
          <p>Detect how the emotional mood changes throughout the song.</p>
        </div>

        <div className="transition-song-card">
          <div className="transition-song-icon">🎵</div>
          <div>
            <h3>Your Uploaded Song</h3>
            <p>
              Song: <strong>{songName}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          className="timeline-upload-button"
          onClick={analyzeTransition}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Mood Transition"}
        </button>

        {error && (
          <p className="transition-error">{error}</p>
        )}

        {!loading && !error && transitions.length === 0 && (
          <div className="transition-empty-card">
            <div className="empty-icon">🎵</div>
            <h3>No Mood Transition Data Available</h3>
            <p>Upload a song and run the analysis first.</p>
            <Link to="/upload" className="timeline-upload-button">
              Upload Music →
            </Link>
          </div>
        )}

        {transitions.map((item, index) => (
          <div className="transition-card" key={index}>
            <div className="transition-time">
              ⏱️ {formatTime(item.start)} – {formatTime(item.end)}
            </div>

            <div className="transition-moods">
              <span className="mood-badge">
                {getEmoji(item.mood)} {item.mood || "Unknown"}
              </span>
            </div>

            <p className="transition-description">
              Mood segment analysis completed.
            </p>

            {item.confidence != null && (
              <p className="transition-confidence">
                🎯 Confidence: <strong>{item.confidence}%</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MoodTransition;
