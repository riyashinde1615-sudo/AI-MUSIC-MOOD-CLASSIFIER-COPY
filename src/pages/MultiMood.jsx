import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Read mood label from different API formats
function getMood(item) {
  if (typeof item === "string") return item.trim();

  if (!item || typeof item !== "object") return "";

  const value =
    item.mood ??
    item.predicted_mood ??
    item.predictedMood ??
    item.detected_mood ??
    item.detectedMood ??
    item.dominant_mood ??
    item.dominantMood ??
    item.emotion ??
    item.label ??
    item.prediction;

  return typeof value === "string" ? value.trim() : "";
}

// Find chronological sections in API data
function findSections(root) {
  const preferredKeys = [
    "sections",
    "segments",
    "timeline",
    "mood_timeline",
    "moodTimeline",
    "results",
  ];

  const visited = new Set();

  function search(value, depth = 0) {
    if (
      !value ||
      typeof value !== "object" ||
      depth > 6 ||
      visited.has(value)
    ) {
      return null;
    }

    visited.add(value);

    if (Array.isArray(value)) {
      const moods = value.map(getMood);

      if (
        value.length >= 2 &&
        moods.every((mood) => mood.length > 0)
      ) {
        return value;
      }

      for (const item of value) {
        const found = search(item, depth + 1);
        if (found) return found;
      }

      return null;
    }

    for (const key of preferredKeys) {
      if (key in value) {
        const found = search(value[key], depth + 1);
        if (found) return found;
      }
    }

    for (const child of Object.values(value)) {
      const found = search(child, depth + 1);
      if (found) return found;
    }

    return null;
  }

  return search(root);
}

// Count chronological mood changes
function countMoodChanges(sections) {
  if (!Array.isArray(sections) || sections.length < 2) {
    return null;
  }

  const moods = sections.map(getMood);

  if (moods.some((mood) => !mood)) {
    return null;
  }

  let changes = 0;

  for (let i = 1; i < moods.length; i++) {
    if (
      moods[i].toLowerCase() !==
      moods[i - 1].toLowerCase()
    ) {
      changes++;
    }
  }

  return changes;
}

// Safely read localStorage JSON
function readStoredJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error);
    return null;
  }
}

// Find explicit mood-change count in API data
function findExplicitChangeCount(data, depth = 0) {
  if (
    !data ||
    typeof data !== "object" ||
    depth > 5
  ) {
    return null;
  }

  const countKeys = [
    "mood_changes",
    "moodChanges",
    "total_mood_changes",
    "totalMoodChanges",
    "change_count",
    "changeCount",
  ];

  for (const key of countKeys) {
    const value = data[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isInteger(Number(value)) &&
      Number(value) >= 0
    ) {
      return Number(value);
    }
  }

  for (const key of ["data", "result", "analysis"]) {
    const found = findExplicitChangeCount(
      data[key],
      depth + 1
    );

    if (found !== null) return found;
  }

  return null;
}

// Normalize mood scores to percentages
function normalizeScore(rawScore) {
  let score = Number(rawScore);

  if (!Number.isFinite(score)) return 0;

  // A decimal score such as 0.85 is treated as 85%.
  if (score > 0 && score <= 1) {
    score *= 100;
  }

  return Math.max(0, Math.min(100, score));
}

// Multi-Mood Page
function MultiMood() {
  const [songName, setSongName] = useState("Uploaded Song");
  const [moods, setMoods] = useState([]);
  const [dominantMood, setDominantMood] = useState("");
  const [moodChanges, setMoodChanges] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSong = localStorage.getItem("uploadedSongName");

      if (savedSong) {
        setSongName(savedSong);
      }

      // 1. Read multi-mood scores
      const multiMoodData = readStoredJSON("multiMoodData");

      console.log("MULTI-MOOD DATA:", multiMoodData);

      if (multiMoodData) {
        const scores =
          multiMoodData.scores ??
          multiMoodData.moods ??
          multiMoodData.mood_scores;

        if (
          scores &&
          typeof scores === "object" &&
          !Array.isArray(scores)
        ) {
          const moodArray = Object.entries(scores)
            .map(([mood, rawScore]) => ({
              mood,
              percentage: normalizeScore(rawScore),
            }))
            .sort((a, b) => b.percentage - a.percentage);

          setMoods(moodArray);

          const apiDominantMood =
            multiMoodData.dominant_mood ??
            multiMoodData.dominantMood;

          setDominantMood(
            typeof apiDominantMood === "string" &&
              apiDominantMood.trim()
              ? apiDominantMood.trim()
              : moodArray[0]?.mood ?? ""
          );
        } else if (Array.isArray(scores)) {
          const moodArray = scores
            .map((item) => {
              const mood = getMood(item);

              const rawScore =
                item?.percentage ??
                item?.score ??
                item?.confidence ??
                item?.probability;

              return {
                mood,
                percentage: normalizeScore(rawScore),
              };
            })
            .filter((item) => item.mood)
            .sort((a, b) => b.percentage - a.percentage);

          setMoods(moodArray);

          const apiDominantMood =
            multiMoodData.dominant_mood ??
            multiMoodData.dominantMood;

          setDominantMood(
            typeof apiDominantMood === "string" &&
              apiDominantMood.trim()
              ? apiDominantMood.trim()
              : moodArray[0]?.mood ?? ""
          );
        }
      }

      // 2. Read chronological timeline/transition data
      const dataSources = [
        {
          key: "moodTransitionData",
          data: readStoredJSON("moodTransitionData"),
        },
        {
          key: "moodTimelineData",
          data: readStoredJSON("moodTimelineData"),
        },
      ].filter((item) => item.data);

      let calculatedChanges = null;

      console.log("CHRONOLOGICAL DATA:", dataSources);

      // Prefer chronological section data
      for (const source of dataSources) {
        const sections = findSections(source.data);

        if (sections) {
          const count = countMoodChanges(sections);

          if (count !== null) {
            calculatedChanges = count;
            console.log(
              "Calculated mood changes:",
              source.key,
              count
            );
            break;
          }
        }
      }

      // 3. Fallback to explicit API count
      if (calculatedChanges === null) {
        for (const source of dataSources) {
          const count = findExplicitChangeCount(source.data);

          if (count !== null) {
            calculatedChanges = count;
            break;
          }
        }
      }

      // 4. Fallback to explicit transition pairs
      if (calculatedChanges === null) {
        const source = dataSources.find(
          (item) => item.key === "moodTransitionData"
        );

        const data = source?.data;

        const transitions = [
          data?.transitions,
          data?.mood_transitions,
          data?.moodTransitions,
          data?.data?.transitions,
        ].find(
          (value) => Array.isArray(value) && value.length > 0
        );

        if (transitions) {
          const pairs = transitions
            .map((item) => {
              if (!item || typeof item !== "object") {
                return null;
              }

              const from =
                item.from_mood ??
                item.fromMood ??
                item.from ??
                item.previous_mood ??
                item.previousMood;

              const to =
                item.to_mood ??
                item.toMood ??
                item.to ??
                item.next_mood ??
                item.nextMood ??
                item.current_mood ??
                item.currentMood;

              if (
                typeof from !== "string" ||
                typeof to !== "string"
              ) {
                return null;
              }

              return {
                from: from.trim(),
                to: to.trim(),
              };
            })
            .filter(Boolean);

          if (pairs.length > 0) {
            calculatedChanges = pairs.filter(
              (pair) =>
                pair.from.toLowerCase() !==
                pair.to.toLowerCase()
            ).length;
          }
        }
      }

      setMoodChanges(calculatedChanges);
    } catch (error) {
      console.error("Multi-Mood parsing error:", error);
      setMoodChanges(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mood emoji
  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: "😊",
      sad: "😢",
      relaxed: "😌",
      calm: "😌",
      energetic: "⚡",
      aggressive: "🔥",
      romantic: "❤️",
      dramatic: "🎭",
      neutral: "😐",
    };

    return emojis[String(mood || "").toLowerCase()] || "🎵";
  };

  // Mood description
  const getMoodDescription = (mood) => {
    const descriptions = {
      happy: "Positive and cheerful feeling",
      sad: "Emotional and low-energy feeling",
      relaxed: "Calm and peaceful feeling",
      calm: "Calm and peaceful feeling",
      energetic: "High-energy and active feeling",
      aggressive: "Strong and intense emotional feeling",
      romantic: "Warm and affectionate emotional feeling",
      dramatic: "Intense and expressive emotional feeling",
      neutral: "Balanced or neutral emotional feeling",
    };

    return (
      descriptions[String(mood || "").toLowerCase()] ||
      "Detected emotional mood"
    );
  };

  const strongestMoods = moods.slice(0, 2);

  return (
    <div className="mood-result-page">
      <div className="mood-result-container">
        <Link to="/dashboard" className="result-back">
          ← Back to Dashboard
        </Link>

        <div className="result-header">
          <div className="result-main-icon">🎭</div>
          <h1>Multi-Mood Detection</h1>
          <p>
            Detect multiple emotional moods present throughout
            your uploaded song.
          </p>
        </div>

        <div className="song-result-card">
          <div className="song-icon">🎵</div>
          <div>
            <span>ANALYZED SONG</span>
            <h3>{songName}</h3>
          </div>
        </div>

        {loading ? (
          <div className="analysis-card">
            <h2>⏳ Loading Analysis...</h2>
            <p>Please wait while the result is loaded.</p>
          </div>
        ) : moods.length === 0 ? (
          <div className="analysis-card">
            <h2>🎭 No Multi-Mood Data</h2>
            <p>
              Please upload and analyze a music file first.
            </p>

            <Link
              to="/upload"
              className="result-action-btn"
              style={{
                display: "inline-flex",
                marginTop: "20px",
              }}
            >
              🎵 <span>Upload Music</span>
            </Link>
          </div>
        ) : (
          <>
            {/* DOMINANT MOOD */}
            <div className="analysis-card">
              <h2>👑 Dominant Mood</h2>

              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                <div style={{ fontSize: "55px" }}>
                  {getMoodEmoji(dominantMood)}
                </div>

                <h2 style={{ marginTop: "10px" }}>
                  {dominantMood || "Unknown"}
                </h2>

                <p>
                  This is the strongest emotional mood detected
                  in the song.
                </p>
              </div>
            </div>

            {/* DETECTED MOODS */}
            <div className="analysis-card">
              <h2>🎭 Detected Moods</h2>

              <p>
                The AI detected multiple emotional moods in the
                uploaded song.
              </p>

              <div className="multi-mood-list">
                {moods.map((item) => (
                  <div
                    className="multi-mood-item"
                    key={item.mood}
                  >
                    <div className="multi-mood-icon">
                      {getMoodEmoji(item.mood)}
                    </div>

                    <div className="multi-mood-info">
                      <div className="multi-mood-title">
                        <strong>{item.mood}</strong>
                        <span>
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>

                      <div className="multi-mood-bar">
                        <div
                          className="multi-mood-progress"
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>

                      <small>
                        {getMoodDescription(item.mood)}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ANALYSIS SUMMARY */}
            <div className="analysis-card">
              <h2>📊 Analysis Summary</h2>

              <div style={summaryGridStyle}>
                <div style={summaryCardStyle}>
                  <strong style={summaryValueStyle}>
                    {moods.length}
                  </strong>
                  <span>Detected Moods</span>
                </div>

                <div style={summaryCardStyle}>
                  <strong style={summaryValueStyle}>
                    {moodChanges ?? "—"}
                  </strong>
                  <span>Mood Changes</span>
                </div>

                <div style={summaryCardStyle}>
                  <strong
                    style={{
                      ...summaryValueStyle,
                      fontSize: "20px",
                    }}
                  >
                    {dominantMood || "—"}
                  </strong>
                  <span>Dominant Mood</span>
                </div>
              </div>

              {moodChanges === null && (
                <p style={{ marginTop: "14px" }}>
                  Chronological mood-change data is unavailable.
                  Open Mood Timeline or Mood Transition to inspect
                  the song's chronological results.
                </p>
              )}
            </div>

            {/* EMOTIONAL PROFILE */}
            <div className="analysis-card">
              <h2>🧠 Emotional Profile</h2>

              <p>
                These are the strongest moods according to their
                multi-mood scores. They are not chronological
                transitions.
              </p>

              <div style={profileGridStyle}>
                {strongestMoods.map((item) => (
                  <div
                    key={item.mood}
                    style={profileCardStyle}
                  >
                    <div style={{ fontSize: "28px" }}>
                      {getMoodEmoji(item.mood)}
                    </div>

                    <div>{item.mood}</div>

                    <div
                      style={{
                        color: "#667eea",
                        marginTop: "4px",
                      }}
                    >
                      {item.percentage.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "14px", marginTop: "18px" }}>
                To see when a mood changes during the song, open
                Mood Timeline or Mood Transition.
              </p>
            </div>
          </>
        )}

        {/* NAVIGATION */}
        <div className="result-actions">
          <Link to="/mood-result" className="result-action-btn">
            😊 <span>Mood Result</span>
          </Link>

          <Link
            to="/mood-timeline"
            className="result-action-btn"
          >
            📈 <span>Mood Timeline</span>
          </Link>

          <Link
            to="/mood-transition"
            className="result-action-btn"
          >
            🔄 <span>Mood Transition</span>
          </Link>

          <Link to="/feedback" className="result-feature-btn">
            💬 <span>Give Feedback</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "15px",
  marginTop: "20px",
};

const summaryCardStyle = {
  padding: "18px",
  background: "#f8f8ff",
  borderRadius: "15px",
  textAlign: "center",
};

const summaryValueStyle = {
  display: "block",
  fontSize: "25px",
  color: "#667eea",
  marginBottom: "5px",
};

const profileGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "center",
  gap: "12px",
  marginTop: "20px",
};

const profileCardStyle = {
  padding: "12px 18px",
  background: "#f8f8ff",
  borderRadius: "12px",
  textAlign: "center",
  fontWeight: "600",
};

export default MultiMood;