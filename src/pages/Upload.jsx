import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

const ALLOWED_EXTENSIONS = /\.(mp3|wav|ogg|m4a|flac)$/i;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

function Upload() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccess("");
    setFile(null);

    if (!selectedFile) return;

    if (!ALLOWED_EXTENSIONS.test(selectedFile.name)) {
      setError(
        "Please select an MP3, WAV, OGG, M4A or FLAC audio file."
      );
      event.target.value = "";
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected file is empty. Please choose another song.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than or equal to 25 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a song first.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/mood`,
        formData,
        {
          timeout: 180000,
        }
      );

      const moodData = response.data;

      if (
        !moodData ||
        moodData.success === false ||
        moodData.error ||
        !moodData.mood
      ) {
        throw new Error(
          moodData?.error || "Mood prediction failed."
        );
      }

      // Save prediction result.
      localStorage.setItem("moodData", JSON.stringify(moodData));
      localStorage.setItem("uploadedSongName", file.name);

      // Save a temporary audio URL for playback in this browser session.
      const previousAudioUrl =
        localStorage.getItem("uploadedAudioUrl");

      if (previousAudioUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previousAudioUrl);
        } catch {
          // Ignore an invalid or expired object URL.
        }
      }

      const audioUrl = URL.createObjectURL(file);
      localStorage.setItem("uploadedAudioUrl", audioUrl);

      // Save prediction history locally.
      let history = [];

      try {
        const savedHistory = JSON.parse(
          localStorage.getItem("predictionHistory") || "[]"
        );

        if (Array.isArray(savedHistory)) {
          history = savedHistory;
        }
      } catch {
        history = [];
      }

      const prediction = {
        song: file.name,
        mood: moodData.mood,
        confidence: moodData.confidence ?? 0,
        intensity: moodData.intensity ?? "Unknown",
        date: new Date().toISOString(),
      };

      localStorage.setItem(
        "predictionHistory",
        JSON.stringify([prediction, ...history].slice(0, 100))
      );

      setSuccess("Song analyzed successfully!");

      navigate("/mood-result");
    } catch (err) {
      console.error("Song analysis error:", err);

      if (err.response) {
        setError(
          err.response.data?.error ||
            err.response.data?.detail ||
            `Backend error: ${err.response.status}`
        );
      } else if (
        err.code === "ECONNABORTED" ||
        err.code === "ETIMEDOUT"
      ) {
        setError(
          "Analysis timed out. Please try again."
        );
      } else if (err.request) {
        setError(
          "Cannot connect to the backend. Please try again later."
        );
      } else {
        setError(
          err.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1>🎵 Upload Music</h1>

        <p>
          Upload your song and discover its musical mood using AI.
        </p>

        <form onSubmit={handleUpload}>
          <div className="upload-box">
            <label htmlFor="song-file">
              <span style={{ fontSize: "42px" }}>🎧</span>
              <h3>Select Your Song</h3>
              <p>
                Supported formats: MP3, WAV, OGG, M4A, FLAC
              </p>
            </label>

            <input
              id="song-file"
              className="file-input"
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.flac"
              onChange={handleFileChange}
              disabled={analyzing}
            />

            {file && (
              <p className="selected-file">
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          {error && (
            <div
              className="error-message"
              role="alert"
              style={{
                background: "#fee2e2",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <p className="loading-message" role="status">
              {success}
            </p>
          )}

          <button
            className="upload-button"
            type="submit"
            disabled={!file || analyzing}
          >
            {analyzing
              ? "Analyzing Song..."
              : "Analyze Song 🎶"}
          </button>

          {analyzing && (
            <p className="loading-message" role="status">
              Please wait while AI analyzes your song.
            </p>
          )}
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default Upload;