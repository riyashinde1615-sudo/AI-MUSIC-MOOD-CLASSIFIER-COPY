import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MoodTimeline.css";

function MoodTimeline() {
  const [songName, setSongName] = useState("Uploaded Song");
  const [timeline, setTimeline] = useState([]);
  const [moodChanges, setMoodChanges] = useState([]);

  useEffect(() => {
    setSongName(
      localStorage.getItem("uploadedSongName") ||
      localStorage.getItem("songName") ||
      "Uploaded Song"
    );

    try {
      const savedTimeline =
        localStorage.getItem("moodTimelineData") ||
        localStorage.getItem("moodTransitionData");

      if (!savedTimeline) return;

      const data = JSON.parse(savedTimeline);

      const sections = Array.isArray(data)
        ? data
        : data.transitions ||
          data.timeline ||
          data.sections ||
          [];

      setTimeline(sections);

      const changes = Array.isArray(data.mood_changes)
        ? data.mood_changes
        : [];

      setMoodChanges(changes);
    } catch (error) {
      console.error("Timeline loading error:", error);
    }
  }, []);

  const getMood = (item) =>
    String(item.mood || item.predicted_mood || "Unknown");

  const getTime = (seconds) => {
    const value = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(value / 60);
    const remainingSeconds = Math.floor(value % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const uniqueMoods = [
    ...new Set(
      timeline
        .map((item) => getMood(item))
        .filter((mood) => mood !== "Unknown")
    ),
  ];

  const moodCount = uniqueMoods.length;

  const getEmoji = (mood) => {
    const value = mood.toLowerCase();

    if (value.includes("happy")) return "😊";
    if (value.includes("sad")) return "😢";
    if (value.includes("calm") || value.includes("relaxed")) {
      return "😌";
    }
    if (value.includes("energetic")) return "⚡";
    if (value.includes("romantic")) return "❤️";
    if (value.includes("angry") || value.includes("aggressive")) {
      return "🔥";
    }
    if (value.includes("fear")) return "😨";

    return "🎵";
  };

  return (
    <div className="timeline-page">
      <div className="timeline-container">
        <Link to="/mood-result" className="back-link">
          ← Back to Mood Result
        </Link>

        <header className="timeline-header">
          <div className="timeline-icon">🎼</div>
          <h1>Mood Timeline</h1>
          <p>Explore how moods change throughout your song.</p>
        </header>

        <section className="timeline-song-card">
          <span>🎵 YOUR UPLOADED SONG</span>
          <h2>{songName}</h2>
        </section>

        {timeline.length > 0 ? (
          <>
            <section className="timeline-summary">
              <h2>🎭 Song Mood Summary</h2>
              <div className="timeline-summary-number">
                {moodCount}
              </div>
              <p>Unique moods detected in this song</p>

              <div className="timeline-mood-list">
                {uniqueMoods.map((mood) => (
                  <span className="keyword-tag" key={mood}>
                    {getEmoji(mood)} {mood}
                  </span>
                ))}
              </div>
            </section>

            <section className="timeline-card">
              <h2>📍 Mood Timeline Sections</h2>

              <div className="timeline-list">
                {timeline.map((item, index) => (
                  <article
                    className="timeline-item"
                    key={`${item.start ?? index}-${index}`}
                  >
                    <div className="timeline-item-icon">
                      {getEmoji(getMood(item))}
                    </div>

                    <div className="timeline-item-content">
                      <h3>{getMood(item)}</h3>

                      <p>
                        {getTime(item.start)} –{" "}
                        {getTime(item.end)}
                      </p>

                      {item.confidence != null && (
                        <p>
                          Confidence: {item.confidence}
                          {Number(item.confidence) <= 1 ? "%" : ""}
                        </p>
                      )}

                      {item.tempo != null && (
                        <p>Tempo: {item.tempo} BPM</p>
                      )}

                      {item.rms != null && (
                        <p>Energy (RMS): {Number(item.rms).toFixed(3)}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="timeline-card">
              <h2>🔄 Mood Changes</h2>

              {moodChanges.length > 0 ? (
                <div className="timeline-list">
                  {moodChanges.map((change, index) => (
                    <article
                      className="timeline-item"
                      key={`${change.at ?? index}-${index}`}
                    >
                      <div className="timeline-item-icon">🔀</div>

                      <div className="timeline-item-content">
                        <h3>
                          {getEmoji(change.from)} {change.from}
                          {" → "}
                          {getEmoji(change.to)} {change.to}
                        </h3>

                        <p>
                          Mood changed at {getTime(change.at)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No mood changes were returned for this song.</p>
              )}
            </section>
          </>
        ) : (
          <section className="timeline-card">
            <h2>Timeline not available</h2>
            <p>
              Please upload a song and analyze it first.
              Then open Mood Timeline again.
            </p>
          </section>
        )}

        <div className="timeline-actions">
          <Link to="/mood-transition" className="timeline-button">
            View Mood Transition →
          </Link>

          <Link to="/mood-result" className="timeline-button">
            ← Back to Mood Result
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MoodTimeline;