import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  "https://ai-music-mood-classifier-copy.onrender.com";

function Lyrics() {
  const [lyrics, setLyrics] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  const songName =
    localStorage.getItem("uploadedSongName") ||
    localStorage.getItem("songName") ||
    "Uploaded Song";

  const handleAnalyze = async () => {
    if (!lyrics.trim()) {
      alert("Please enter song lyrics.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/lyrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lyrics: lyrics.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Lyrics analysis failed.");
      }

      setAnalysisResult(data);
      setAnalyzed(true);

      localStorage.setItem(
        "lyricsAnalysis",
        JSON.stringify(data)
      );
    } catch (err) {
      console.error("Lyrics API Error:", err);
      setError(err.message || "Unable to analyze lyrics.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lyrics-page">
      <div className="lyrics-container">
        <Link to="/mood-result" className="back-link">
          ← Back to Mood Result
        </Link>

        <div className="lyrics-header">
          <div className="lyrics-icon">📝</div>
          <h1>Lyrics Analysis</h1>
          <p>
            Analyze song lyrics to understand their emotional meaning.
          </p>
        </div>

        <div className="lyrics-song-card">
          <div className="lyrics-song-icon">🎵</div>
          <div>
            <span>YOUR UPLOADED SONG</span>
            <h2>{songName}</h2>
          </div>
        </div>

        <div className="lyrics-card">
          <h2>📝 Enter Song Lyrics</h2>

          <textarea
            className="lyrics-textarea"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Enter or paste your song lyrics here..."
            rows={10}
          />

          <button
            className="analyze-lyrics-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing Lyrics..." : "Analyze Lyrics"}
          </button>

          {error && (
            <div className="lyrics-error">
              {error}
            </div>
          )}
        </div>

        {analyzed && analysisResult && (
          <div className="lyrics-result-card">
            <h2>AI Lyrics Analysis</h2>

            <h3>
              Detected Mood: {analysisResult.mood || "Unknown"}
            </h3>

            <p>
              Confidence: {analysisResult.confidence ?? "N/A"}
              {analysisResult.confidence != null ? "%" : ""}
            </p>

            <h3>Emotional Meaning</h3>
            <p>
              {analysisResult.emotional_meaning ||
                "No emotional explanation was returned."}
            </p>

            <h3>Emotional Keywords</h3>
            <p>
              {Array.isArray(analysisResult.keywords)
                ? analysisResult.keywords.join(", ")
                : "No specific keywords found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lyrics;