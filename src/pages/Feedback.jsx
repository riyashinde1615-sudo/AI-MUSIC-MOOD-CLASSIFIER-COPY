import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://ai-music-mood-classifier-copy.onrender.com"
).replace(/\/+$/, "");

function Feedback() {
  const [songName, setSongName] = useState("Uploaded Music");
  const [mood, setMood] = useState("Unknown");
  const [confidence, setConfidence] = useState(0);
  const [helpfulness, setHelpfulness] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedSongName = localStorage.getItem("uploadedSongName");

    if (savedSongName) {
      setSongName(savedSongName);
    }

    const savedMoodData = localStorage.getItem("moodData");

    if (savedMoodData) {
      try {
        const data = JSON.parse(savedMoodData);

        const savedMood =
          data.mood ??
          data.predicted_mood ??
          data.predictedMood ??
          data.dominant_mood ??
          data.emotion;

        if (savedMood) {
          setMood(String(savedMood));
        }

        if (data.confidence !== undefined) {
          setConfidence(Number(data.confidence) || 0);
        } else if (data.confidence_score !== undefined) {
          setConfidence(Number(data.confidence_score) || 0);
        }
      } catch (error) {
        console.error("Feedback data error:", error);
      }
    }
  }, []);

  const getMoodIcon = () => {
    const currentMood = String(mood).toLowerCase();

    if (currentMood.includes("happy")) return "😊";
    if (currentMood.includes("sad")) return "😢";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!helpfulness) {
      alert("Please select whether the prediction was helpful.");
      return;
    }

    if (rating === 0) {
      alert("Please rate the AI prediction.");
      return;
    }

    const feedbackData = {
      songName,
      mood,
      confidence,
      helpfulness,
      rating,
      feedback: feedback.trim(),
      submittedAt: new Date().toISOString(),
    };

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/feedback`,
        feedbackData,
        { timeout: 120000 }
      );

      if (response.data?.success === true) {
        localStorage.setItem(
          "userFeedback",
          JSON.stringify(feedbackData)
        );

        setSubmitted(true);
      } else {
        alert(
          response.data?.message ||
            "Feedback could not be saved. Please try again."
        );
      }
    } catch (error) {
      console.error(
        "Feedback submission error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Feedback could not be saved. Please check the backend and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-page">
        <nav className="feedback-navbar">
          <Link to="/dashboard" className="feedback-brand">
            <span className="feedback-brand-icon">🎵</span>

            <span className="feedback-brand-text">
              <strong>AI Music Mood</strong>
              <small>Classifier</small>
            </span>
          </Link>

          <div className="feedback-nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/upload">Upload Music</Link>
            <Link to="/history">History</Link>
          </div>
        </nav>

        <main className="feedback-container">
          <div className="feedback-success">
            <div className="feedback-success-icon">✓</div>

            <h2>Thank You for Your Feedback!</h2>

            <p>
              Your feedback has been saved successfully.
              It helps improve the AI Music Mood Classifier.
            </p>

            <Link
              to="/dashboard"
              className="feedback-success-button"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      {/* NAVBAR */}
      <nav className="feedback-navbar">
        <Link to="/dashboard" className="feedback-brand">
          <span className="feedback-brand-icon">🎵</span>

          <span className="feedback-brand-text">
            <strong>AI Music Mood</strong>
            <small>Classifier</small>
          </span>
        </Link>

        <div className="feedback-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/upload">Upload Music</Link>
          <Link to="/history">History</Link>
        </div>
      </nav>

      <main className="feedback-container">
        <Link to="/mood-result" className="feedback-back">
          ← Back to Mood Result
        </Link>

        {/* HEADER */}
        <section className="feedback-header">
          <div className="feedback-header-icon">💬</div>

          <span>AI PREDICTION FEEDBACK</span>

          <h1>Help Us Improve</h1>

          <p>
            Tell us how accurate the AI mood prediction was
            for your uploaded music.
          </p>
        </section>

        {/* SONG CARD */}
        <section className="feedback-song-card">
          <div className="feedback-song-icon">🎧</div>

          <div className="feedback-song-info">
            <span>YOUR UPLOADED SONG</span>
            <h3>{songName}</h3>
            <p>AI analysis completed successfully</p>
          </div>

          <div className="feedback-prediction">
            <span>AI PREDICTION</span>

            <strong>
              {getMoodIcon()} {mood}
            </strong>

            <strong>🎯 {confidence.toFixed(0)}%</strong>
          </div>
        </section>

        {/* FEEDBACK FORM */}
        <form
          className="feedback-card"
          onSubmit={handleSubmit}
        >
          {/* HELPFULNESS */}
          <div className="feedback-section">
            <span className="feedback-section-label">
              PREDICTION ACCURACY
            </span>

            <h2>Was this mood prediction helpful?</h2>

            <p>
              Select the option that best describes the AI prediction.
            </p>

            <div className="feedback-options">
              <button
                type="button"
                className={
                  helpfulness === "accurate"
                    ? "feedback-option selected"
                    : "feedback-option"
                }
                onClick={() => setHelpfulness("accurate")}
                disabled={loading}
              >
                <span className="feedback-option-icon">😊</span>
                <strong>Yes, accurate</strong>
                <small>
                  The prediction matches my opinion
                </small>
              </button>

              <button
                type="button"
                className={
                  helpfulness === "partial"
                    ? "feedback-option selected"
                    : "feedback-option"
                }
                onClick={() => setHelpfulness("partial")}
                disabled={loading}
              >
                <span className="feedback-option-icon">😐</span>
                <strong>Partially accurate</strong>
                <small>
                  The prediction is somewhat correct
                </small>
              </button>

              <button
                type="button"
                className={
                  helpfulness === "incorrect"
                    ? "feedback-option selected"
                    : "feedback-option"
                }
                onClick={() => setHelpfulness("incorrect")}
                disabled={loading}
              >
                <span className="feedback-option-icon">😕</span>
                <strong>Not accurate</strong>
                <small>
                  The prediction is incorrect
                </small>
              </button>
            </div>
          </div>

          {/* STAR RATING */}
          <div className="feedback-section">
            <span className="feedback-section-label">
              USER RATING
            </span>

            <h2>⭐ Rate the AI Prediction</h2>

            <p>
              How would you rate the quality of this AI mood prediction?
            </p>

            <div className="feedback-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={
                    star <= rating
                      ? "feedback-star active"
                      : "feedback-star"
                  }
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} out of 5`}
                  disabled={loading}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="feedback-rating-text">
              {rating === 0 && "Select your rating"}
              {rating === 1 && "Very Poor"}
              {rating === 2 && "Needs Improvement"}
              {rating === 3 && "Average"}
              {rating === 4 && "Good Prediction"}
              {rating === 5 && "Excellent Prediction"}
            </div>
          </div>

          {/* WRITTEN FEEDBACK */}
          <div className="feedback-section">
            <span className="feedback-section-label">
              ADDITIONAL FEEDBACK
            </span>

            <h2>📝 Tell us more</h2>

            <p>
              Your comments can help us improve the music mood
              prediction system.
            </p>

            <textarea
              className="feedback-textarea"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write your feedback here..."
              maxLength={5000}
              disabled={loading}
            />
          </div>

          {/* SUBMIT */}
          <div className="feedback-submit-area">
            <button
              type="submit"
              className="feedback-submit-button"
              disabled={loading}
            >
              {loading
                ? "Saving Feedback..."
                : "⭐ Submit Feedback"}
            </button>
          </div>
        </form>

        {/* INFO */}
        <div className="feedback-info-card">
          <div className="feedback-info-icon">🧠</div>

          <div>
            <strong>Why is your feedback important?</strong>

            <p>
              Your feedback helps evaluate the accuracy and quality
              of the AI Music Mood Classification system.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="feedback-footer">
          <strong>🎵 AI Music Mood Classifier</strong>
          <span>Intelligent Music Emotion Analysis</span>
        </footer>
      </main>
    </div>
  );
}

export default Feedback;