
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MoodTransition.css";

function MoodTransition() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem("uploadedSongName");
      const savedData = JSON.parse(
        localStorage.getItem("moodTransitionData") || "null"
      );

      if (savedName) {
        setSongName(savedName);
      }

      const items = Array.isArray(savedData)
        ? savedData
        : Array.isArray(savedData?.transitions)
        ? savedData.transitions
        : [];

      setTransitions(items);
    } catch (error) {
      console.error("Unable to load transition data:", error);
      setTransitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

        {loading ? (
          <div className="transition-empty-card">
            <h3>Loading transition data...</h3>
          </div>
        ) : transitions.length === 0 ? (
          <div className="transition-empty-card">
            <div className="empty-icon">🎵</div>
            <h3>No Mood Transition Data Available</h3>
            <p>
              Upload your song and analyze it again to generate
              mood transition data.
            </p>
            <Link to="/upload" className="timeline-upload-button">
              Upload Music →
            </Link>
          </div>
        ) : (
          <div className="transition-list">
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
                  Mood analysis for this section.
                </p>

                {item.confidence != null && (
                  <p className="transition-confidence">
                    🎯 Confidence: <strong>{item.confidence}%</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodTransition;
