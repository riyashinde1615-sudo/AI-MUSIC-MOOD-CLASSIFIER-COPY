
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Upload.css";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

function Upload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setError("");
    setFile(null);

    if (!selectedFile) return;

    const allowed = ["mp3", "wav", "ogg", "m4a", "flac"];
    const ext = selectedFile.name.split(".").pop().toLowerCase();

    if (!allowed.includes(ext)) {
      setError("Please upload MP3, WAV, OGG, M4A, or FLAC.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("File size must be less than 25 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const analyzeFile = async (endpoint) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}${endpoint}`,
      formData,
      { timeout: 180000 }
    );

    if (response.data?.success === false) {
      throw new Error("Analysis failed.");
    }

    return response.data;
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a music file first.");
      return;
    }

    setLoading(true);
    setError("");

    [
      "moodData",
      "multiMoodData",
      "moodTransitionData",
      "moodTimelineData",
    ].forEach((key) => localStorage.removeItem(key));

    try {
      // 1. Main mood prediction
      const result = await analyzeFile("/mood");

      if (!result?.mood) {
        throw new Error("Mood prediction was not returned.");
      }

      localStorage.setItem("moodData", JSON.stringify(result));
      localStorage.setItem("uploadedSongName", file.name);
      localStorage.setItem(
        "uploadedAudioUrl",
        URL.createObjectURL(file)
      );

      // 2. Prediction history
      try {
        const history = JSON.parse(
          localStorage.getItem("predictionHistory") || "[]"
        );

        history.unshift({
          filename: file.name,
          mood: result.mood,
          confidence: result.confidence,
          date: new Date().toLocaleString(),
        });

        localStorage.setItem(
          "predictionHistory",
          JSON.stringify(history.slice(0, 20))
        );
      } catch (e) {
        console.warn("History could not be saved:", e);
      }

      // 3. Multi-mood analysis
      try {
        const multi = await analyzeFile("/multi-mood");
        localStorage.setItem("multiMoodData", JSON.stringify(multi));
      } catch (e) {
        console.warn("Multi-mood analysis failed:", e);
      }

      // 4. Mood transition and timeline
      try {
        const transition = await analyzeFile("/mood-transition");

        localStorage.setItem(
          "moodTransitionData",
          JSON.stringify(transition)
        );
        localStorage.setItem(
          "moodTimelineData",
          JSON.stringify(transition)
        );
      } catch (e) {
        console.warn("Mood transition analysis failed:", e);
      }

      navigate("/mood-result");
    } catch (e) {
      console.error("Upload error:", e);

      setError(
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        "Unable to analyze music. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-box">
          <h2>🎵 Upload Your Music</h2>

          <p>
            Upload an audio file to discover its musical mood.
          </p>

          <form onSubmit={handleUpload}>
            <input
              className="file-input"
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.flac,audio/*"
              onChange={handleFileChange}
              disabled={loading}
            />

            {file && (
              <div className="selected-file">
                <p>🎧 <strong>{file.name}</strong></p>
                <p>
                  Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}

            {error && (
              <p className="error-message" role="alert">
                ⚠️ {error}
              </p>
            )}

            {loading && (
              <p className="loading-message" role="status">
                🎶 Analyzing your music... Please wait.
              </p>
            )}

            <button
              className="upload-button"
              type="submit"
              disabled={loading || !file}
            >
              {loading ? "Analyzing..." : "✨ Analyze Song"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Upload;
