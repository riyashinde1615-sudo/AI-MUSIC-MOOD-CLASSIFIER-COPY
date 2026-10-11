import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MoodTransition() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [transitionData, setTransitionData] = useState(null);

  useEffect(() => {
    const savedSongName =
      localStorage.getItem("uploadedSongName");
    const savedTransitionData =
      localStorage.getItem("moodTransitionData");
    const savedMoodData =
      localStorage.getItem("moodData");

    if (savedSongName) setSongName(savedSongName);

    if (savedTransitionData) {
      try {
        setTransitionData(JSON.parse(savedTransitionData));
      } catch (error) {
        console.error("Error reading transition data:", error);
      }
    } else if (savedMoodData) {
      try {
        const moodData = JSON.parse(savedMoodData);
        setTransitionData({
          success: true,
          transitions: [],
          confidence: moodData.confidence || 0,
        });
      } catch (error) {
        console.error("Error reading mood data:", error);
      }
    }
  }, []);

  const getMoodEmoji = (mood) => {
    const value = String(mood || "").toLowerCase();

    if (value.includes("happy")) return "😊";
    if (value.includes("sad")) return "😢";
    if (value.includes("relaxed") || value.includes("calm")) return "😌";
    if (value.includes("energetic")) return "⚡";
    if (value.includes("aggressive")) return "🔥";
    if (value.includes("romantic")) return "❤️";
    if (value.includes("dramatic")) return "🎭";

    return "🎵";
  };

  const formatTime = (seconds) => {
    const total = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(total / 60);
    const remaining = Math.floor(total % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  const getTransitionTime = (item) => {
    const start =
      item?.start ??
      item?.start_time ??
      item?.startTime ??
      item?.from_time ??
      item?.section_start ??
      0;

    const end =
      item?.end ??
      item?.end_time ??
      item?.endTime ??
      item?.to_time ??
      item?.section_end;

    return end !== undefined && end !== null
      ? `${formatTime(start)} – ${formatTime(end)}`
      : `${formatTime(start)} – ${formatTime(Number(start) + 10)}`;
  };

  const getMood = (item) =>
    item?.mood ||
    item?.current_mood ||
    item?.currentMood ||
    "Unknown";

  const transitions = Array.isArray(transitionData?.transitions)
    ? transitionData.transitions
    : [];

  let confidence = transitionData?.confidence;

  if (confidence == null) {
    try {
      const moodData = JSON.parse(
        localStorage.getItem("moodData") || "{}"
      );
      confidence = moodData?.confidence || 0;
    } catch {
      confidence = 0;
    }
  }

  return (
    <div className="mood-transition-page">
      <div className="mood-transition-container">
        <Link to="/mood-result" className="mood-transition-back">
          ← Back to Mood Result
        </Link>

        <div className="mood-transition-header">
          <div className="mood-transition-icon">🔄</div>
          <h1>Mood Transition</h1>
          <p>
            Detect how the emotional mood changes throughout the song.
          </p>
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

        {transitions.length === 0 ? (
          <div className="transition-empty-card">
            <div className="empty-icon">🎵</div>
            <h3>No Major Mood Transition Detected</h3>
            <p>
              No transition records are available. Please analyze a song
              to generate mood transition data.
            </p>
            <Link to="/upload" className="timeline-upload-button">
              Upload Music →
            </Link>
          </div>
        ) : (
          <div className="transition-list">
            {transitions.map((item, index) => {
              const currentMood = getMood(item);
              const nextMood = transitions[index + 1]
                ? getMood(transitions[index + 1])
                : currentMood;

              const itemConfidence =
                item?.confidence != null
                  ? Number(item.confidence)
                  : Number(confidence) || 0;

              const hasMoodChange =
                index < transitions.length - 1 &&
                currentMood.toLowerCase() !== nextMood.toLowerCase();

              return (
                <div className="transition-card" key={index}>
                  <div className="transition-time">
                    ⏱️ {getTransitionTime(item)}
                  </div>

                  <div className="transition-moods">
                    <span className="mood-badge">
                      {getMoodEmoji(currentMood)} {currentMood}
                    </span>

                    <span className="transition-arrow">→</span>

                    <span className="mood-badge">
                      {getMoodEmoji(nextMood)} {nextMood}
                    </span>
                  </div>

                  <p className="transition-description">
                    {hasMoodChange
                      ? "💡 Emotional mood changed between these analyzed sections."
                      : "💡 Emotional features were analyzed during this section."}
                  </p>

                  <div className="transition-confidence">
                    🎯 Transition Confidence:{" "}
                    <strong>{itemConfidence.toFixed(0)}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="overall-transition-confidence">
          <span>🎯 Overall Analysis Confidence</span>
          <strong>{Number(confidence || 0).toFixed(0)}%</strong>
        </div>
      </div>
    </div>
  );
}

export default MoodTransition;