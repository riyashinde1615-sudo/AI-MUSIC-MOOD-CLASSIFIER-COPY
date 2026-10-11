import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ExplainableAI() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [mood, setMood] = useState("Happy");
  const [confidence, setConfidence] = useState(87);
  const [intensity, setIntensity] = useState("High");
  const [features, setFeatures] = useState({
    rms: null,
    tempo: null,
    zcr: null,
    spectral_centroid: null,
  });

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
        data.confidenceScore;

      if (
        rawConfidence !== undefined &&
        rawConfidence !== null &&
        Number.isFinite(Number(rawConfidence))
      ) {
        let value = Number(rawConfidence);

        if (value > 0 && value <= 1) {
          value *= 100;
        }

        setConfidence(Math.max(0, Math.min(100, value)));
      }

      const rawIntensity =
        data.intensity ??
        data.mood_intensity ??
        data.moodIntensity;

      if (rawIntensity !== undefined && rawIntensity !== null) {
        setIntensity(String(rawIntensity));
      }

      const audio = data.features ?? data.audio_features ?? {};

      setFeatures({
        rms: audio.rms ?? audio.rms_energy ?? null,
        tempo: audio.tempo ?? null,
        zcr:
          audio.zcr ??
          audio.zero_crossing_rate ??
          audio.zeroCrossingRate ??
          null,
        spectral_centroid:
          audio.spectral_centroid ??
          audio.spectralCentroid ??
          null,
      });
    } catch (error) {
      console.error("Explainable AI data error:", error);
    }
  }, []);

  const formatFeature = (value, decimals = 2) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      !Number.isFinite(Number(value))
    ) {
      return "N/A";
    }

    return Number(value).toFixed(decimals);
  };

  const getMoodEmoji = () => {
    const currentMood = String(mood).toLowerCase();

    if (currentMood === "happy") return "😊";
    if (currentMood === "sad") return "😢";
    if (["relaxed", "calm"].includes(currentMood)) return "😌";
    if (currentMood === "energetic") return "⚡";
    if (currentMood === "aggressive") return "🔥";
    if (currentMood === "romantic") return "❤️";
    if (currentMood === "dramatic") return "🎭";

    return "🎵";
  };

  const getExplanation = () => {
    const currentMood = String(mood).toLowerCase();

    if (currentMood === "happy") {
      return "Higher energy and rhythmic characteristics may contribute to a Happy mood prediction.";
    }

    if (currentMood === "energetic") {
      return "Energy and tempo characteristics may contribute to an Energetic mood prediction.";
    }

    if (["relaxed", "calm"].includes(currentMood)) {
      return "The model classified this song as Calm or Relaxed based on the audio information it received.";
    }

    if (currentMood === "sad") {
      return "The model classified this song as Sad based on the audio information it received.";
    }

    if (currentMood === "aggressive") {
      return "The model classified this song as Aggressive based on the audio information it received.";
    }

    if (currentMood === "romantic") {
      return "The model classified this song as Romantic based on the audio information it received.";
    }

    if (currentMood === "dramatic") {
      return "The model classified this song as Dramatic based on the audio information it received.";
    }

    return "The model analyzed the available audio information to produce this mood prediction.";
  };

  const hasAudioFeatures = Object.values(features).some(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
  );

  return (
    <div className="explainable-page">
      <nav className="explainable-navbar">
        <Link to="/dashboard" className="explainable-brand">
          <span className="explainable-brand-icon">🎵</span>
          <span className="explainable-brand-text">
            <strong>AI Music Mood</strong>
            <small>Classifier</small>
          </span>
        </Link>

        <div className="explainable-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/upload">Upload Music</Link>
          <Link to="/history">History</Link>
          <Link to="/feedback">Feedback</Link>
        </div>
      </nav>

      <main className="explainable-main">
        <Link to="/mood-result" className="explainable-back">
          ← Back to Mood Result
        </Link>

        <section className="explainable-header">
          <span className="explainable-label">
            EXPLAINABLE ARTIFICIAL INTELLIGENCE
          </span>
          <h1>Explainable AI</h1>
          <p>Understand why the AI predicted this mood from your music.</p>
        </section>

        <section className="explainable-song-card">
          <div className="explainable-song-icon">🎶</div>
          <div className="explainable-song-info">
            <span>YOUR UPLOADED SONG</span>
            <h3>{songName}</h3>
          </div>
        </section>

        <section className="explainable-prediction">
          <span className="explainable-prediction-label">
            AI PREDICTED MOOD
          </span>

          <div className="explainable-prediction-content">
            <div className="explainable-mood">
              <div className="explainable-mood-icon">
                {getMoodEmoji()}
              </div>
              <div>
                <h2>{mood}</h2>
                <p>Primary emotional classification</p>
              </div>
            </div>

            <div className="explainable-prediction-stats">
              <div className="explainable-prediction-stat">
                <span>CONFIDENCE</span>
                <strong>{confidence.toFixed(1)}%</strong>
              </div>

              <div className="explainable-prediction-stat">
                <span>INTENSITY</span>
                <strong>{intensity}</strong>
              </div>
            </div>
          </div>
        </section>

        <div className="explainable-section-title">
          <h2>🎧 Audio Features</h2>
          <p>Musical characteristics analyzed by the AI model.</p>
        </div>

        <section className="explainable-features">
          <div className="explainable-feature-card">
            <div className="explainable-feature-icon">⚡</div>
            <span>TEMPO</span>
            <strong>{formatFeature(features.tempo, 0)}</strong>
            <small>BPM</small>
          </div>

          <div className="explainable-feature-card">
            <div className="explainable-feature-icon">🔊</div>
            <span>RMS ENERGY</span>
            <strong>{formatFeature(features.rms, 4)}</strong>
            <small>Energy level</small>
          </div>

          <div className="explainable-feature-card">
            <div className="explainable-feature-icon">📈</div>
            <span>ZERO CROSSING RATE</span>
            <strong>{formatFeature(features.zcr, 4)}</strong>
            <small>Signal variation</small>
          </div>

          <div className="explainable-feature-card">
            <div className="explainable-feature-icon">🎧</div>
            <span>SPECTRAL CENTROID</span>
            <strong>{formatFeature(features.spectral_centroid, 2)}</strong>
            <small>Hz</small>
          </div>
        </section>

        <div className="explainable-section-title">
          <h2>💡 Why did AI predict {mood}?</h2>
          <p>Explanation of the predicted mood.</p>
        </div>

        <section className="explainable-reason-card">
          <div className="explainable-reason-top">
            <div className="explainable-reason-icon">🧠</div>
            <div>
              <h3>AI Decision Reasoning</h3>
              <p>The model evaluated the available audio information.</p>
            </div>
          </div>

          <p>{getExplanation()}</p>
        </section>

        <div className="explainable-section-title">
          <h2>🔍 AI Decision Summary</h2>
          <p>Summary of the available mood classification results.</p>
        </div>

        <section className="explainable-summary">
          <div className="explainable-summary-grid">
            <div className="explainable-summary-item">
              <span>MOOD</span>
              <strong>{getMoodEmoji()} {mood}</strong>
            </div>

            <div className="explainable-summary-item">
              <span>CONFIDENCE</span>
              <strong>{confidence.toFixed(1)}%</strong>
            </div>

            <div className="explainable-summary-item">
              <span>INTENSITY</span>
              <strong>{intensity}</strong>
            </div>

            <div className="explainable-summary-item success">
              <span>AUDIO FEATURES</span>
              <strong>
                {hasAudioFeatures ? "Available ✓" : "Not available"}
              </strong>
            </div>
          </div>
        </section>

        <div className="explainable-section-title">
          <h2>Continue Analysis</h2>
          <p>Explore more insights from your music.</p>
        </div>

        <section className="explainable-actions">
          <Link to="/confidence" className="explainable-action">
            <div className="explainable-action-left">
              <div className="explainable-action-icon">🎯</div>
              <strong>Confidence Analysis</strong>
            </div>
            <span>→</span>
          </Link>

          <Link to="/mood-timeline" className="explainable-action">
            <div className="explainable-action-left">
              <div className="explainable-action-icon">📈</div>
              <strong>Mood Timeline</strong>
            </div>
            <span>→</span>
          </Link>

          <Link to="/mood-intensity" className="explainable-action">
            <div className="explainable-action-left">
              <div className="explainable-action-icon">⚡</div>
              <strong>Mood Intensity</strong>
            </div>
            <span>→</span>
          </Link>
        </section>

        <footer className="explainable-footer">
          <strong>🎵 AI Music Mood Classifier</strong>
          <span>Intelligent Music Emotion Analysis</span>
        </footer>
      </main>
    </div>
  );
}

export default ExplainableAI;