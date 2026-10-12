import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MoodTransition.css";

function MoodTransition() {
  const [songName, setSongName] = useState("Uploaded Song");
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setSongName(
        localStorage.getItem("uploadedSongName") ||
        localStorage.getItem("songName") ||
        "Uploaded Song"
      );

      const data = JSON.parse(
        localStorage.getItem("moodTransitionData") || "null"
      );

      const items = Array.isArray(data)
        ? data
        : data?.transitions || [];

      const changes = [];

      for (let i = 1; i < items.length; i++) {
        const from = items[i - 1].mood;
        const to = items[i].mood;

        if (
          from &&
          to &&
          from.toLowerCase() !== to.toLowerCase()
        ) {
          changes.push({ from, to });
        }
      }

      const backendChanges = Array.isArray(data?.mood_changes)
        ? data.mood_changes
            .filter(
              (item) =>
                item.from &&
                item.to &&
                item.from.toLowerCase() !==
                  item.to.toLowerCase()
            )
            .map((item) => ({
              from: item.from,
              to: item.to,
            }))
        : [];

      setTransitions(
        backendChanges.length ? backendChanges : changes
      );
    } catch (error) {
      console.error("Transition error:", error);
      setTransitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEmoji = (mood) => {
    const value = String(mood || "").toLowerCase();

    if (value.includes("happy")) return "😊";
    if (value.includes("sad")) return "😢";
    if (value.includes("calm") || value.includes("relaxed"))
      return "😌";
    if (value.includes("energetic")) return "⚡";
    if (value.includes("romantic")) return "❤️";
    if (value.includes("aggressive")) return "🔥";

    return "🎵";
  };

  return (
    <div className="mood-transition-page">
      <div className="mood-transition-container">
        <Link to="/mood-result" className="mood-transition-back">
          ← Back to Mood Result
        </Link>

        <header className="mood-transition-header">
          <div className="mood-transition-icon">🔄</div>
          <h1>Mood Transition</h1>
          <p>See how the mood changes throughout your song.</p>
        </header>

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
            Loading mood changes...
          </div>
        ) : (
          <>
            <div className="transition-empty-card">
              <h2>Total Mood Changes</h2>
              <h1>{transitions.length}</h1>
            </div>

            {transitions.length > 0 ? (
              <div className="transition-list">
                {transitions.map((item, index) => (
                  <div className="transition-card" key={index}>
                    <h3>Mood Change {index + 1}</h3>

                    <div className="transition-moods">
                      <span className="mood-badge">
                        {getEmoji(item.from)} {item.from}
                      </span>

                      <span> → </span>

                      <span className="mood-badge">
                        {getEmoji(item.to)} {item.to}
                      </span>
                    </div>

                    <p className="transition-description">
                      Mood changed from {item.from} to {item.to}.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="transition-empty-card">
                <h3>No Mood Changes Detected</h3>
                <p>
                  Upload and analyze a song to see its mood changes.
                </p>
                <Link
                  to="/upload"
                  className="timeline-upload-button"
                >
                  Upload Music →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MoodTransition;