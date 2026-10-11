import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MoodTransition() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [transitionData, setTransitionData] = useState(null);
  const [moodData, setMoodData] = useState(null);

  useEffect(() => {
    try {
      const savedSongName =
        localStorage.getItem("uploadedSongName");

      const savedTransitionData =
        localStorage.getItem("moodTransitionData");

      const savedMoodData =
        localStorage.getItem("moodData");

      if (savedSongName) {
        setSongName(savedSongName);
      }

      if (savedTransitionData) {
        setTransitionData(JSON.parse(savedTransitionData));
      }

      if (savedMoodData) {
        setMoodData(JSON.parse(savedMoodData));
      }
    } catch (error) {
      console.error("Error reading saved mood data:", error);
    }
  }, []);

  const getMoodEmoji = (mood) => {
    const value = String(mood || "").toLowerCase();

    if (value.includes("happy")) return "😊";
    if (value.includes("sad")) return "😢";
    if (value.includes("calm") || value.includes("relax")) return "😌";
    if (value.includes("energetic")) return "⚡";
    if (value.includes("aggressive")) return "🔥";
    if (value.includes("romantic")) return "❤️";
    if (value.includes("dramatic")) return "🎭";

    return "🎵";
  };

  const formatTime = (value) => {
    if (typeof value === "string" && value.includes(":")) {
      return value;
    }

    const seconds = Math.max(0, Number(value) || 0);
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  const getTransitionTime = (item) => {
    const start =
      item?.start_time ??
      item?.startTime ??
      item?.start ??
      item?.from_time ??
      item?.section_start ??
      item?.timestamp ??
      0;

    const end =
      item?.end_time ??
      item?.endTime ??
      item?.end ??
      item?.to_time ??
      item?.section_end;

    if (end !== undefined && end !== null) {
      return `${formatTime(start)} – ${formatTime(end)}`;
    }

    return formatTime(start);
  };

  const getCurrentMood = (item) =>
    item?.from_mood ??
    item?.previous_mood ??
    item?.previousMood ??
    item?.current_mood ??
    item?.currentMood ??
    item?.mood ??
    item?.predicted_mood ??
    item?.predictedMood ??
    item?.dominant_mood ??
    item?.dominantMood ??
    "Unknown";

  const getNextMood = (item) =>
    item?.to_mood ??
    item?.next_mood ??
    item?.nextMood ??
    item?.new_mood ??
    item?.newMood ??
    item?.following_mood ??
    item?.followingMood ??
    null;

  const findTransitions = (data) => {
    if (!data || typeof data !== "object") return [];

    if (Array.isArray(data)) return data;

    const possibleKeys = [
      "transitions",
      "mood_transitions",
      "moodTransitions",
      "timeline",
      "sections",
      "segments",
      "results",
      "data",
    ];

    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }

    return [];
  };

  const transitions = findTransitions(transitionData);

  const confidenceValue =
    transitionData?.confidence ??
    transitionData?.overall_confidence ??
    transitionData?.overallConfidence ??
    moodData?.confidence ??
    moodData?.confidence_score ??
    moodData?.confidenceScore ??
    null;

  const confidence = (() => {
    if (confidenceValue == null) return null;

    const value = Number(confidenceValue);
    if (!Number.isFinite(value)) return null;

    return value > 0 && value <= 1 ? value * 100 : value;
  })();

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
            <h3>No Mood Transition Data Available</h3>
            <p>
              Transition data was not found for this song.
              Analyze the song again if needed, or check whether
              the backend provides mood transition results.
            </p>
            <Link to="/upload" className="timeline-upload-button">
              Upload Music →
            </Link>
          </div>
        ) : (
          <div className="transition-list">
            {transitions.map((item, index) => {
              const currentMood = getCurrentMood(item);
              const nextMood = getNextMood(item);

              const itemConfidenceValue =
                item?.confidence ??
                item?.transition_confidence ??
                item?.transitionConfidence ??
                null;

              const itemConfidence = (() => {
                if (itemConfidenceValue == null) return null;

                const value = Number(itemConfidenceValue);
                if (!Number.isFinite(value)) return null;

                return value > 0 && value <= 1
                  ? value * 100
                  : value;
              })();

              return (
                <div className="transition-card" key={index}>
                  <div className="transition-time">
                    ⏱️ {getTransitionTime(item)}
                  </div>

                  <div className="transition-moods">
                    <span className="mood-badge">
                      {getMoodEmoji(currentMood)} {currentMood}
                    </span>

                    {nextMood && (
                      <>
                        <span className="transition-arrow">→</span>
                        <span className="mood-badge">
                          {getMoodEmoji(nextMood)} {nextMood}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="transition-description">
                    {nextMood &&
                    String(currentMood).toLowerCase() !==
                      String(nextMood).toLowerCase()
                      ? "💡 A mood change is recorded for this section."
                      : "💡 Mood information is available for this section."}
                  </p>

                  {itemConfidence !== null && (
                    <div className="transition-confidence">
                      🎯 Transition Confidence:{" "}
                      <strong>
                        {itemConfidence.toFixed(0)}%
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {confidence !== null && (
          <div className="overall-transition-confidence">
            <span>🎯 Overall Analysis Confidence</span>
            <strong>{confidence.toFixed(0)}%</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodTransition;