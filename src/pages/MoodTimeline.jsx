
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MoodTimeline() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSongName = localStorage.getItem("uploadedSongName");

      if (savedSongName) {
        setSongName(savedSongName);
      }

      // Read timeline data from either saved key.
      const savedTimeline =
        localStorage.getItem("moodTransitionData") ||
        localStorage.getItem("moodTimelineData");

      if (!savedTimeline) {
        setTimeline([]);
        return;
      }

      const data = JSON.parse(savedTimeline);

      let sections = [];

      if (Array.isArray(data)) {
        sections = data;
      } else if (Array.isArray(data?.transitions)) {
        sections = data.transitions;
      } else if (Array.isArray(data?.timeline)) {
        sections = data.timeline;
      } else if (Array.isArray(data?.sections)) {
        sections = data.sections;
      }

      if (sections.length > 0) {
        setTimeline(sections);
      } else {
        console.warn("No timeline sections found in saved data:", data);
        setTimeline([]);
      }
    } catch (error) {
      console.error("Error loading mood timeline:", error);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMoodIcon = (mood) => {
    const value = String(mood || "").toLowerCase();

    if (value.includes("happy")) return "😊";
    if (value.includes("sad")) return "😢";
    if (value.includes("energetic")) return "⚡";
    if (value.includes("relaxed") || value.includes("calm")) return "😌";
    if (value.includes("romantic")) return "❤️";
    if (value.includes("aggressive")) return "🔥";
    if (value.includes("dramatic")) return "🎭";

    return "🎵";
  };

  const getValue = (section, keys, fallback = 0) => {
    if (!section) return fallback;

    for (const key of keys) {
      if (section[key] !== undefined && section[key] !== null) {
        return section[key];
      }
    }

    return fallback;
  };

  const formatTime = (value) => {
    if (value === undefined || value === null || value === "") {
      return "00:00";
    }

    const number = Number(value);

    if (Number.isFinite(number)) {
      const total = Math.max(0, Math.round(number));
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;

      return `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    }

    return String(value);
  };

  const getStartTime = (section, index) =>
    formatTime(
      getValue(
        section,
        ["start", "start_time", "startTime"],
        index * 10
      )
    );

  const getEndTime = (section, index) => {
    const end = getValue(
      section,
      ["end", "end_time", "endTime"],
      null
    );

    if (end !== null) {
      return formatTime(end);
    }

    const start = Number(
      getValue(section, ["start", "start_time", "startTime"], index * 10)
    );

    const duration = Number(getValue(section, ["duration"], 10));

    return formatTime(start + duration);
  };

  const getIntensity = (confidence, section) => {
    if (section?.intensity) return section.intensity;
    if (confidence >= 85) return "High";
    if (confidence >= 70) return "Medium";
    return "Low";
  };

  const moodChanges = timeline.reduce((count, section, index) => {
    if (index === 0) return count;

    const previous = String(
      timeline[index - 1]?.mood || ""
    ).toLowerCase();

    const current = String(section?.mood || "").toLowerCase();

    return previous !== current ? count + 1 : count;
  }, 0);

  const journey = timeline
    .map((section) => section?.mood)
    .filter(Boolean)
    .filter(
      (mood, index, array) =>
        index === 0 ||
        String(mood).toLowerCase() !==
          String(array[index - 1]).toLowerCase()
    );

  return (
    <div className="timeline-page">
      <nav className="timeline-navbar">
        <Link to="/dashboard" className="timeline-brand">
          <span className="timeline-brand-icon">🎵</span>
          <span className="timeline-brand-text">
            <strong>AI Music Mood</strong>
            <small>Classifier</small>
          </span>
        </Link>

        <div className="timeline-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/upload">Upload Music</Link>
          <Link to="/history">History</Link>
          <Link to="/feedback">Feedback</Link>
        </div>
      </nav>

      <main className="timeline-main">
        <Link to="/mood-result" className="timeline-back">
          ← Back to Mood Result
        </Link>

        <section className="timeline-header">
          <div className="timeline-title-icon">📈</div>
          <div>
            <span className="timeline-eyebrow">
              AI MUSIC ANALYSIS
            </span>
            <h1>Mood Timeline</h1>
            <p>
              Track how the emotional mood changes throughout the song.
            </p>
          </div>
        </section>

        <section className="timeline-song-card">
          <div className="timeline-song-icon">🎵</div>

          <div className="timeline-song-info">
            <span>YOUR UPLOADED SONG</span>
            <h2>{songName}</h2>
            <p>
              Explore the emotional characteristics of your music.
            </p>
          </div>

          <div className="timeline-status">
            <span></span>
            ANALYZED
          </div>
        </section>

        {loading ? (
          <section className="timeline-empty">
            <div>⏳</div>
            <h3>Loading Mood Timeline...</h3>
            <p>Please wait while your saved timeline is loaded.</p>
          </section>
        ) : (
          <>
            {timeline.length > 0 && (
              <section className="timeline-summary-grid">
                <div className="timeline-summary-card">
                  <div className="timeline-summary-icon">🎵</div>
                  <div>
                    <span>TOTAL SECTIONS</span>
                    <strong>{timeline.length}</strong>
                    <p>Audio sections analyzed</p>
                  </div>
                </div>

                <div className="timeline-summary-card">
                  <div className="timeline-summary-icon">🔄</div>
                  <div>
                    <span>MOOD CHANGES</span>
                    <strong>{moodChanges}</strong>
                    <p>Emotional transitions detected</p>
                  </div>
                </div>

                <div className="timeline-summary-card">
                  <div className="timeline-summary-icon">🧠</div>
                  <div>
                    <span>ANALYSIS METHOD</span>
                    <strong>Audio Analysis</strong>
                    <p>Segment-based mood estimation</p>
                  </div>
                </div>
              </section>
            )}

            <section className="timeline-section">
              <div className="timeline-section-heading">
                <span className="timeline-eyebrow">
                  EMOTIONAL JOURNEY
                </span>
                <h2>Song Mood Timeline</h2>
                <p>
                  Each section represents a segment of the analyzed audio.
                </p>
              </div>

              {timeline.length > 0 ? (
                <div className="timeline-list">
                  {timeline.map((section, index) => {
                    const startTime = getStartTime(section, index);
                    const endTime = getEndTime(section, index);
                    const mood = section?.mood || "Unknown";

                    const confidence = Number(
                      getValue(
                        section,
                        ["confidence", "score"],
                        0
                      )
                    );

                    const energy = Number(
                      getValue(
                        section,
                        ["energy", "rms"],
                        0
                      )
                    );

                    const tempo = Number(
                      getValue(
                        section,
                        ["tempo", "bpm"],
                        0
                      )
                    );

                    const intensity = getIntensity(
                      confidence,
                      section
                    );

                    return (
                      <div className="timeline-item" key={index}>
                        <div className="timeline-marker-area">
                          <div className="timeline-marker">
                            {getMoodIcon(mood)}
                          </div>

                          {index < timeline.length - 1 && (
                            <div className="timeline-line"></div>
                          )}
                        </div>

                        <div className="timeline-card">
                          <div className="timeline-card-top">
                            <div>
                              <span className="timeline-time">
                                {startTime} - {endTime}
                              </span>
                              <h3>
                                {getMoodIcon(mood)} {mood}
                              </h3>
                            </div>

                            <span
                              className={`timeline-intensity ${String(
                                intensity
                              ).toLowerCase()}`}
                            >
                              {intensity}
                            </span>
                          </div>

                          <div className="timeline-metrics">
                            <div className="timeline-metric">
                              <div className="metric-icon">🎯</div>
                              <div>
                                <span>CONFIDENCE</span>
                                <strong>
                                  {confidence.toFixed(0)}%
                                </strong>
                              </div>
                            </div>

                            <div className="timeline-metric">
                              <div className="metric-icon">🔊</div>
                              <div>
                                <span>ENERGY</span>
                                <strong>
                                  {energy.toFixed(4)}
                                </strong>
                              </div>
                            </div>

                            <div className="timeline-metric">
                              <div className="metric-icon">🎵</div>
                              <div>
                                <span>TEMPO</span>
                                <strong>
                                  {tempo.toFixed(2)} BPM
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="timeline-confidence">
                            <div className="timeline-confidence-top">
                              <span>AI CONFIDENCE</span>
                              <strong>
                                {confidence.toFixed(0)}%
                              </strong>
                            </div>

                            <div className="timeline-progress">
                              <div
                                className="timeline-progress-fill"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, confidence)
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="timeline-empty">
                  <div>🎵</div>
                  <h3>No Timeline Data Available</h3>
                  <p>
                    Upload and analyze a song first. The timeline
                    appears when the mood-transition analysis succeeds.
                  </p>
                  <Link
                    to="/upload"
                    className="timeline-upload-button"
                  >
                    Upload Music →
                  </Link>
                </div>
              )}
            </section>

            {timeline.length > 0 && (
              <section className="timeline-journey-card">
                <div className="journey-icon">🧠</div>
                <div className="journey-content">
                  <span>EMOTIONAL JOURNEY</span>
                  <h2>{journey.join(" → ")}</h2>
                  <p>
                    This shows the sequence of estimated moods
                    across the analyzed audio sections.
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        <footer className="timeline-footer">
          <strong>🎵 AI Music Mood Classifier</strong>
          <span>Intelligent Music Emotion Analysis</span>
        </footer>
      </main>
    </div>
  );
}

export default MoodTimeline;
