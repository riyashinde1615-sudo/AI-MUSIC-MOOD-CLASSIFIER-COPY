import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://ai-music-mood-backend.onrender.com";

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

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedExtensions = /\.(mp3|wav|ogg|m4a|flac)$/i;

    if (!allowedExtensions.test(selectedFile.name)) {
      setFile(null);
      setError(
        "Please select an MP3, WAV, OGG, M4A or FLAC audio file."
      );
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

      const moodResponse = await axios.post(
        `${API_URL}/mood`,
        formData,
        {
          timeout: 180000,
        }
      );

      const moodData = moodResponse.data;

      if (
        moodData?.success === false ||
        moodData?.error ||
        moodData?.mood == null
      ) {
        throw new Error(
          moodData?.error || "Mood prediction failed."
        );
      }

      localStorage.setItem(
        "moodData",
        JSON.stringify(moodData)
      );

      localStorage.setItem(
        "uploadedSongName",
        file.name
      );

      const localAudioUrl = URL.createObjectURL(file);

      localStorage.setItem(
        "uploadedAudioUrl",
        localAudioUrl
      );

      let existingHistory = [];

      try {
        const savedHistory = JSON.parse(
          localStorage.getItem("predictionHistory") || "[]"
        );

        if (Array.isArray(savedHistory)) {
          existingHistory = savedHistory;
        }
      } catch (historyError) {
        console.warn(
          "Could not read previous history:",
          historyError
        );
      }

      const prediction = {
        song: file.name,
        mood: moodData.mood,
        confidence: moodData.confidence ?? 0,
        intensity: moodData.intensity ?? "Unknown",
        date: new Date().toISOString(),
      };

      const updatedHistory = [
        prediction,
        ...existingHistory,
      ];

      localStorage.setItem(
        "predictionHistory",
        JSON.stringify(updatedHistory)
      );

      setSuccess("Song analyzed successfully!");
      navigate("/mood-result");
    } catch (err) {
      console.error("Song analysis error:", err);

      if (err.response) {
        setError(
          err.response.data?.error ||
            `Backend error: ${err.response.status}`
        );
      } else if (err.code === "ECONNABORTED") {
        setError(
          "Analysis timed out. Please try again in a moment."
        );
      } else {
        setError(
          err.message ||
            "Cannot connect to the backend. Please try again."
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
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.flac,audio/*"
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
              role="alert"
              style={{
                color: "#b91c1c",
                background: "#fee2e2",
                padding: "12px",
                borderRadius: "8px",
                marginTop: "16px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <p role="status" style={{ color: "green" }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || analyzing}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "20px",
              border: "none",
              borderRadius: "8px",
              background: analyzing ? "#999" : "#667eea",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                analyzing || !file
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {analyzing
              ? "Analyzing Song..."
              : "Analyze Song 🎶"}
          </button>

          {analyzing && (
            <p
              role="status"
              style={{ textAlign: "center" }}
            >
              Please wait while AI analyzes your song.
            </p>
          )}
        </form>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          <Link to="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Upload;