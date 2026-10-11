
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Upload.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

function Upload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    setError("");
    setFile(null);

    if (!selected) return;

    const extension = selected.name
      .split(".")
      .pop()
      .toLowerCase();

    const allowed = ["mp3", "wav", "ogg", "m4a", "flac"];

    if (!allowed.includes(extension)) {
      setError("Please select MP3, WAV, OGG, M4A or FLAC.");
      event.target.value = "";
      return;
    }

    if (selected.size > 25 * 1024 * 1024) {
      setError("File size must be less than 25 MB.");
      event.target.value = "";
      return;
    }

    setFile(selected);
  };

  const sendFile = async (endpoint) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}${endpoint}`,
      formData,
      { timeout: 180000 }
    );

    return response.data;
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please choose a music file first.");
      return;
    }

    setLoading(true);
    setError("");

    [
      "moodData",
      "moodTransitionData",
      "moodTimelineData",
      "multiMoodData",
    ].forEach((key) => localStorage.removeItem(key));

    try {
      const result = await sendFile("/mood");

      if (!result || result.success === false || !result.mood) {
        throw new Error(
          result?.error || "Mood analysis failed."
        );
      }

      localStorage.setItem("moodData", JSON.stringify(result));
      localStorage.setItem("uploadedSongName", file.name);

      const audioUrl = URL.createObjectURL(file);
      localStorage.setItem("uploadedAudioUrl", audioUrl);

      let history = [];

      try {
        history = JSON.parse(
          localStorage.getItem("predictionHistory") || "[]"
        );
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }

      history.unshift({
        filename: file.name,
        mood: result.mood,
        confidence: result.confidence,
        date: new Date().toLocaleString(),
      });

      localStorage.setItem(
        "predictionHistory",
        JSON.stringify(history.slice(0, 50))
      );

      // Extra analyses are optional. Their errors won't cancel
      // the successful main mood prediction.
      try {
        const multi = await sendFile("/multi-mood");

        if (multi && multi.success !== false) {
          localStorage.setItem(
            "multiMoodData",
            JSON.stringify(multi)
          );
        }
      } catch (err) {
        console.warn("Multi-mood analysis unavailable:", err);
      }

      try {
        const transition = await sendFile("/mood-transition");

        if (
          transition &&
          transition.success !== false &&
          Array.isArray(transition.transitions)
        ) {
          localStorage.setItem(
            "moodTransitionData",
            JSON.stringify(transition)
          );
          localStorage.setItem(
            "moodTimelineData",
            JSON.stringify(transition)
          );
        }
      } catch (err) {
        console.warn("Timeline analysis unavailable:", err);
      }

      navigate("/mood-result");
    } catch (err) {
      console.error("Upload analysis error:", err);

      if (err.response) {
        setError(
          err.response.data?.error ||
            `Server error: ${err.response.status}`
        );
      } else if (err.code === "ECONNABORTED") {
        setError("Analysis timed out. Please try again.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Network Error. Please check the backend connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <main className="upload-container">
        <h1>🎵 Upload Music</h1>
        <p className="upload-subtitle">
          Upload your song and discover its musical mood using AI.
        </p>

        <form onSubmit={handleAnalyze}>
          <section className="upload-box">
            <div className="upload-headphone" aria-hidden="true">
              🎧
            </div>

            <h2>Select Your Song</h2>
            <p className="upload-formats">
              Supported formats: MP3, WAV, OGG, M4A, FLAC
            </p>

            <input
              className="file-input"
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.flac,audio/*"
              onChange={handleFileChange}
              disabled={loading}
            />

            {file && (
              <div className="selected-file">
                <span>Selected:</span>
                <strong>{file.name}</strong>
                <small>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </small>
              </div>
            )}
          </section>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-message" role="status">
              <span className="upload-spinner"></span>
              Analyzing your song... Please wait.
            </div>
          )}

          <button
            className="upload-button"
            type="submit"
            disabled={!file || loading}
          >
            {loading ? "Analyzing Song..." : "Analyze Song 🎶"}
          </button>
        </form>

        <div className="upload-back">
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      </main>
    </div>
  );
}

export default Upload;
