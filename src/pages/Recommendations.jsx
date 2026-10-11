import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function Recommendations() {
  const [songName, setSongName] = useState("Uploaded Song");
  const [mood, setMood] = useState("Happy");
  const [audioUrl, setAudioUrl] = useState("");
  const [playingIndex, setPlayingIndex] = useState(null);
  const [audioError, setAudioError] = useState("");

  const audioRef = useRef(null);

  // LOAD SONG, MOOD AND AUDIO
  useEffect(() => {
    const savedSongName = localStorage.getItem("uploadedSongName");

    if (savedSongName) {
      setSongName(savedSongName);
    }

    try {
      const savedMoodData = localStorage.getItem("moodData");

      if (savedMoodData) {
        const data = JSON.parse(savedMoodData);

        const detectedMood =
          data.mood ??
          data.predicted_mood ??
          data.predictedMood ??
          data.dominant_mood ??
          data.emotion;

        if (
          typeof detectedMood === "string" &&
          detectedMood.trim()
        ) {
          setMood(detectedMood.trim());
        }
      }
    } catch (error) {
      console.error("Mood data error:", error);
    }

    const savedAudioUrl =
      localStorage.getItem("uploadedAudioUrl");

    if (savedAudioUrl) {
      setAudioUrl(savedAudioUrl);
    }
  }, []);

  // MOOD EMOJI
  const getMoodEmoji = () => {
    const currentMood = String(mood).toLowerCase();

    if (currentMood === "happy") return "😊";
    if (currentMood === "sad") return "😢";
    if (["relaxed", "calm"].includes(currentMood)) return "😌";
    if (currentMood === "energetic") return "⚡";
    if (currentMood === "aggressive") return "🔥";
    if (currentMood === "romantic") return "❤️";
    if (currentMood === "dramatic") return "🎭";
    if (currentMood === "neutral") return "😐";

    return "🎵";
  };

  // MOOD-BASED SUGGESTIONS
  const getRecommendations = () => {
    const currentMood = String(mood).toLowerCase();

    if (currentMood === "sad") {
      return [
        {
          name: "Peaceful Moments",
          mood: "😌 Relaxed",
          description:
            "Calm and soothing music for peaceful moments.",
          icon: "😌",
        },
        {
          name: "Healing Vibes",
          mood: "🎵 Emotional",
          description:
            "Soft emotional music with a comforting feeling.",
          icon: "💙",
        },
        {
          name: "Calm Escape",
          mood: "😌 Relaxed",
          description:
            "Gentle melodies for a calm atmosphere.",
          icon: "🌙",
        },
      ];
    }

    if (["relaxed", "calm"].includes(currentMood)) {
      return [
        {
          name: "Peaceful Vibes",
          mood: "😌 Relaxed",
          description:
            "Calm and peaceful music for relaxation.",
          icon: "😌",
        },
        {
          name: "Chill Moments",
          mood: "🎵 Chill",
          description:
            "Soft and soothing music for a peaceful mood.",
          icon: "🌿",
        },
        {
          name: "Dreamy Music",
          mood: "😌 Relaxed",
          description:
            "Gentle melodies with a relaxing atmosphere.",
          icon: "🌙",
        },
      ];
    }

    if (currentMood === "energetic") {
      return [
        {
          name: "Energetic Beats",
          mood: "⚡ Energetic",
          description:
            "High-energy music to keep you active.",
          icon: "⚡",
        },
        {
          name: "Power Music",
          mood: "🔥 Powerful",
          description:
            "Dynamic music with an energetic feeling.",
          icon: "🔥",
        },
        {
          name: "Workout Vibes",
          mood: "🏃 Active",
          description:
            "Fast-paced music for an active mood.",
          icon: "🏃",
        },
      ];
    }

    if (currentMood === "aggressive") {
      return [
        {
          name: "Power Beats",
          mood: "🔥 Intense",
          description:
            "Strong rhythms for an intense listening mood.",
          icon: "🔥",
        },
        {
          name: "Energetic Beats",
          mood: "⚡ Energetic",
          description:
            "Upbeat music with energetic rhythms.",
          icon: "⚡",
        },
        {
          name: "Focus Vibes",
          mood: "🎧 Focused",
          description:
            "Rhythmic music for focused listening.",
          icon: "🎧",
        },
      ];
    }

    if (currentMood === "romantic") {
      return [
        {
          name: "Romantic Melodies",
          mood: "❤️ Romantic",
          description:
            "Gentle melodies for a romantic atmosphere.",
          icon: "❤️",
        },
        {
          name: "Dreamy Music",
          mood: "🌙 Dreamy",
          description:
            "Soft sounds and soothing melodies.",
          icon: "🌙",
        },
        {
          name: "Peaceful Moments",
          mood: "😌 Relaxed",
          description:
            "Relaxing music for quiet moments.",
          icon: "😌",
        },
      ];
    }

    if (currentMood === "dramatic") {
      return [
        {
          name: "Cinematic Vibes",
          mood: "🎭 Dramatic",
          description:
            "Expressive music with a cinematic atmosphere.",
          icon: "🎭",
        },
        {
          name: "Power Music",
          mood: "🔥 Intense",
          description:
            "Dynamic music with powerful rhythms.",
          icon: "🔥",
        },
        {
          name: "Emotional Melodies",
          mood: "🎵 Emotional",
          description:
            "Expressive melodies for emotional listening.",
          icon: "🎶",
        },
      ];
    }

    return [
      {
        name: "Happy Vibes",
        mood: "😊 Happy",
        description:
          "Positive and cheerful music suggestions.",
        icon: "😊",
      },
      {
        name: "Feel Good Music",
        mood: "🎶 Positive",
        description:
          "Light and uplifting musical suggestions.",
        icon: "🎶",
      },
      {
        name: "Energetic Beats",
        mood: "⚡ Energetic",
        description:
          "High-energy music for an active mood.",
        icon: "⚡",
      },
    ];
  };

  const recommendations = getRecommendations();

  // PLAY OR PAUSE UPLOADED AUDIO
  const handlePlay = async (index) => {
    setAudioError("");

    const audio = audioRef.current;

    if (!audio) {
      setAudioError("Audio player is not available.");
      return;
    }

    if (!audioUrl) {
      setAudioError(
        "Uploaded audio is unavailable. Please upload the song again."
      );
      return;
    }

    if (playingIndex === index && !audio.paused) {
      audio.pause();
      setPlayingIndex(null);
      return;
    }

    try {
      audio.pause();

      if (audio.src !== new URL(audioUrl, window.location.href).href) {
        audio.src = audioUrl;
      }

      audio.currentTime = 0;
      audio.load();

      await audio.play();

      setPlayingIndex(index);
    } catch (error) {
      console.error("Audio playback error:", error);
      setPlayingIndex(null);

      setAudioError(
        "Unable to play the audio. Please upload the song again and try."
      );
    }
  };

  // AUDIO EVENTS
  const handleEnded = () => {
    setPlayingIndex(null);
  };

  const handleAudioError = () => {
    setPlayingIndex(null);

    setAudioError(
      "Audio file could not be loaded. Please upload the song again."
    );
  };

  // STOP PLAYBACK WHEN LEAVING PAGE
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="recommendations-page">
      <div className="recommendations-container">

        {/* BACK */}
        <Link
          to="/mood-result"
          className="recommendations-back"
        >
          ← Back to Mood Result
        </Link>

        {/* HEADER */}
        <div className="recommendations-header">
          <div className="recommendations-icon">🎵</div>

          <h1>Song Recommendations</h1>

          <p>
            Discover music recommendations based on your
            detected mood.
          </p>
        </div>

        {/* UPLOADED SONG */}
        <div className="recommendation-source-card">
          <div className="source-icon">🎶</div>

          <div>
            <span>YOUR UPLOADED SONG</span>
            <h3>{songName}</h3>
          </div>
        </div>

        {/* DETECTED MOOD */}
        <div className="recommendation-mood-card">
          <div>
            <span>DETECTED MOOD</span>
            <h2>
              {getMoodEmoji()} {mood}
            </h2>
          </div>

          <div className="mood-status">
            🤖 Mood Result Loaded
          </div>
        </div>

        {/* RECOMMENDATIONS */}
        <div className="recommendation-list">
          <div className="recommendation-subtitle">
            <h2>🎧 Recommended Songs</h2>

            <p>
              Music suggestions matching your detected mood.
            </p>
          </div>

          <div className="recommendation-grid">
            {recommendations.map((song, index) => (
              <div
                className="recommendation-card"
                key={song.name}
              >
                <div className="recommendation-cover">
                  <span>{song.icon}</span>
                  <div className="cover-note">♪</div>
                </div>

                <div className="recommendation-info">
                  <h3>{song.name}</h3>

                  <span className="mood-tag">
                    {song.mood}
                  </span>

                  <p>{song.description}</p>

                  <button
                    type="button"
                    className="play-recommendation"
                    onClick={() => handlePlay(index)}
                  >
                    {playingIndex === index
                      ? "⏸ Pause"
                      : "▶ Play Uploaded Song"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AUDIO PLAYER */}
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          onEnded={handleEnded}
          onError={handleAudioError}
          style={{
            width: "100%",
            marginTop: "20px",
          }}
        />

        {/* ERROR MESSAGE */}
        {audioError && (
          <div
            role="alert"
            style={{
              marginTop: "15px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#fff1f1",
              color: "#c62828",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            ⚠️ {audioError}
          </div>
        )}

        {/* INFORMATION */}
        <div className="recommendation-info-box">
          <div>🧠</div>

          <div>
            <strong>Mood-Based Suggestions</strong>

            <p>
              These suggestions are selected using the mood
              detected from your uploaded music. The cards are
              suggestions, not verified tracks from a music
              streaming service.
            </p>
          </div>
        </div>

        {/* DASHBOARD */}
        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
          }}
        >
          <Link
            to="/dashboard"
            className="result-action-btn"
          >
            🏠 <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Recommendations;