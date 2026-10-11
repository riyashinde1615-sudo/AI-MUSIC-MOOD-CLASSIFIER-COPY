import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Confidence() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [mood, setMood] = useState("Unknown");
  const [confidence, setConfidence] = useState(0);
  const [intensity, setIntensity] = useState("Unknown");
  const [features, setFeatures] = useState(null);

  useEffect(() => {
    const savedSongName = localStorage.getItem("uploadedSongName");

    if (savedSongName) {
      setSongName(savedSongName);
    }

    const savedMoodData = localStorage.getItem("moodData");

    if (!savedMoodData) return;

    try {
      const data = JSON.parse(savedMoodData);

      const predictedMood =
        data.mood ??
        data.predicted_mood ??
        data.predictedMood ??
        data.dominant_mood ??
        data.emotion;

      if (predictedMood) {
        setMood(String(predictedMood));
      }

      const rawConfidence =
        data.confidence ??
        data.confidence_score ??
        data.confidenceScore ??
        0;

      let score = Number(rawConfidence);

      if (Number.isFinite(score)) {
        // Convert decimal scores such as 0.85 to 85%.
        if (score > 0 && score <= 1) {
          score *= 100;
        }

        setConfidence(Math.max(0, Math.min(100, score)));
      }

      setIntensity(
        data.intensity ??
          data.mood_intensity ??
          data.moodIntensity ??
          "Unknown"
      );

      const audioFeatures =
        data.features ??
        data.audio_features ??
        data.audioFeatures ??
        null;

      setFeatures(
        audioFeatures && typeof audioFeatures === "object"
          ? audioFeatures
          : null
      );
    } catch (error) {
      console.error("Confidence data error:", error);
    }
  }, []);

  const getMoodEmoji = () => {
    const currentMood = String(mood).toLowerCase();

    if (currentMood.includes("happy")) return "😊";
    if (currentMood.includes("sad")) return "😔";
    if (
      currentMood.includes("relaxed") ||
      currentMood.includes("calm")
    ) {
      return "😌";
    }
    if (currentMood.includes("energetic")) return "⚡";
    if (currentMood.includes("aggressive")) return "🔥";
    if (currentMood.includes("romantic")) return "❤️";
    if (currentMood.includes("dramatic")) return "🎭";
    if (currentMood.includes("neutral")) return "😐";

    return "🎵";
  };

  const formatFeature = (value) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toFixed(2)
      : String(value);
  };

  const rms =
    features?.rms ??
    features?.rms_energy ??
    features?.rmsEnergy;

  const tempo = features?.tempo;

  const zcr =
    features?.zcr ??
    features?.zero_crossing_rate ??
    features?.zeroCrossingRate;

  const spectralCentroid =
    features?.spectral_centroid ??
    features?.spectralCentroid;

  return (
    <div className="confidence-page">
      <div className="confidence-container">
        <Link to="/mood-result" className="back-link">
          ← Back to Mood Result
        </Link>

        {/* HEADER */}
        <div className="confidence-header">
          <div className="confidence-icon">🎯</div>

          <h1>Confidence Score</h1>

          <p>
            AI confidence level for the predicted music mood.
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="confidence-card">
          <h2>🎵 Your Uploaded Song</h2>

          <div className="confidence-song">
            <span>🎶</span>
            <strong>{songName}</strong>
          </div>

          {/* RESULT */}
          <div className="confidence-result">
            <div
              className="confidence-circle"
              style={{
                background: `conic-gradient(
                  #667eea ${confidence * 3.6}deg,
                  #e8e5f5 ${confidence * 3.6}deg
                )`,
              }}
            >
              <div className="confidence-circle-inner">
                <span>{confidence.toFixed(0)}%</span>
                <small>Confidence</small>
              </div>
            </div>

            <div className="confidence-mood">
              <div className="confidence-mood-emoji">
                {getMoodEmoji()}
              </div>

              <h2>{mood}</h2>

              <p>Predicted Music Mood</p>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="confidence-progress-section">
            <div className="confidence-progress-header">
              <span>AI Confidence</span>
              <strong>{confidence.toFixed(0)}%</strong>
            </div>

            <div className="confidence-bar-container">
              <div
                className="confidence-bar"
                style={{
                  width: `${confidence}%`,
                }}
              />
            </div>
          </div>

          {/* STATS */}
          <div className="confidence-stats">
            <div className="confidence-stat">
              <span>🎭 Mood</span>
              <strong>{mood}</strong>
            </div>

            <div className="confidence-stat">
              <span>🎚️ Intensity</span>
              <strong>{intensity}</strong>
            </div>

            <div className="confidence-stat">
              <span>🎯 Confidence</span>
              <strong>{confidence.toFixed(0)}%</strong>
            </div>
          </div>

          {/* AUDIO FEATURES */}
          {features && (
            <div className="confidence-features">
              <h3>🎵 Audio Features Used</h3>

              <div className="confidence-feature-grid">
                <div>
                  <span>🔊 RMS Energy</span>
                  <strong>{formatFeature(rms)}</strong>
                </div>

                <div>
                  <span>🎵 Tempo</span>
                  <strong>
                    {formatFeature(tempo)}
                    {tempo !== null &&
                    tempo !== undefined &&
                    tempo !== ""
                      ? " BPM"
                      : ""}
                  </strong>
                </div>

                <div>
                  <span>📊 ZCR</span>
                  <strong>{formatFeature(zcr)}</strong>
                </div>

                <div>
                  <span>🌊 Spectral Centroid</span>
                  <strong>
                    {formatFeature(spectralCentroid)}
                    {spectralCentroid !== null &&
                    spectralCentroid !== undefined &&
                    spectralCentroid !== ""
                      ? " Hz"
                      : ""}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {!features && (
            <div className="confidence-features">
              <h3>🎵 Audio Features</h3>
              <p>
                Audio feature details are not available for this
                prediction.
              </p>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="result-actions">
            <Link to="/mood-result" className="result-action-btn">
              😊 <span>Mood Result</span>
            </Link>

            <Link to="/mood-timeline" className="result-action-btn">
              📈 <span>Mood Timeline</span>
            </Link>

            <Link to="/multi-mood" className="result-action-btn">
              🎭 <span>Multi-Mood Detection</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Confidence;