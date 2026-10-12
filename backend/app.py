import os
import shutil
import subprocess
import traceback
import uuid
from datetime import datetime

import librosa
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Support both:
# 1. gunicorn backend.app:app (project root)
# 2. python app.py (backend folder)
try:
    from backend.database import (
        create_history_table,
        save_prediction,
        get_predictions,
        delete_prediction,
        clear_predictions,
        save_feedback,
    )
    from backend.model import predict_mood_from_file
    from backend.gemini_service import generate_mood_explanation
except ModuleNotFoundError as exc:
    if not (
        exc.name
        and (exc.name == "backend" or exc.name.startswith("backend."))
    ):
        raise

    from database import (
        create_history_table,
        save_prediction,
        get_predictions,
        delete_prediction,
        clear_predictions,
        save_feedback,
    )
    from model import predict_mood_from_file
    from gemini_service import generate_mood_explanation


# ==================================================
# APP CONFIGURATION
# ==================================================

app = Flask(__name__)

FRONTEND_ORIGINS = [
    "https://ai-music-mood-classifier-copy.vercel.app",
    "https://ai-music-mood-classifier-one.vercel.app",
]

CORS(
    app,
    resources={
        r"/*": {
            "origins": FRONTEND_ORIGINS,
            "methods": ["GET", "POST", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)

MAX_UPLOAD_MB = 50
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
MAX_ANALYSIS_SECONDS = 120
FEATURE_SECONDS = 30
SEGMENT_SECONDS = 10

app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {
    "mp3", "wav", "ogg", "m4a", "flac",
    "aac", "wma", "aiff", "aif", "opus", "amr",
    "mp4", "webm", "mov", "mkv", "avi",
}

# Initialize the existing history database.
create_history_table()


# ==================================================
# HELPERS
# ==================================================

def error_response(message, status=500):
    return jsonify({"success": False, "error": str(message)}), status


def allowed_file(filename):
    return (
        bool(filename)
        and "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def save_uploaded_file(file):
    """ Save the original upload and convert its audio to a temporary WAV. Returns (safe_original_filename, converted_wav_path). The caller must remove converted_wav_path after analysis. """
    if file is None or not file.filename:
        raise ValueError("No audio or video file selected.")

    if not allowed_file(file.filename):
        raise ValueError(
            "Unsupported format. Supported formats include MP3, WAV, OGG, "
            "M4A, FLAC, AAC, WMA, AIFF, OPUS, AMR, MP4, WebM, MOV, MKV and AVI."
        )

    original_name = secure_filename(file.filename)
    if not original_name:
        raise ValueError("Invalid filename.")

    extension = original_name.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}_{original_name}"
    original_path = os.path.join(app.config["UPLOAD_FOLDER"], stored_name)
    file.save(original_path)

    if not os.path.isfile(original_path) or os.path.getsize(original_path) == 0:
        try:
            os.remove(original_path)
        except OSError:
            pass
        raise ValueError("The uploaded file is empty.")

    # Store the converted file in the system temp directory.
    converted_path = None
    try:
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            converted_path = temp_file.name

        ffmpeg_path = shutil.which("ffmpeg")
        if not ffmpeg_path:
            raise RuntimeError(
                "FFmpeg is not installed or unavailable on the server."
            )

        command = [
            ffmpeg_path,
            "-nostdin",
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-i", original_path,
            "-vn",
            "-t", str(MAX_ANALYSIS_SECONDS),
            "-ac", "1",
            "-ar", "22050",
            "-c:a", "pcm_s16le",
            converted_path,
        ]

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )

        if (
            result.returncode != 0
            or not os.path.isfile(converted_path)
            or os.path.getsize(converted_path) == 0
        ):
            detail = (result.stderr or "").strip()
            app.logger.warning("FFmpeg conversion failed: %s", detail[-1500:])
            raise ValueError(
                "Could not read audio from this file. Make sure it contains "
                "playable audio and try another file."
            )

        return stored_name, converted_path

    except subprocess.TimeoutExpired:
        raise ValueError("Audio conversion took too long. Try a shorter file.")
    finally:
        # If conversion failed, do not leave a broken temporary WAV behind.
        if converted_path and (
            not os.path.isfile(converted_path)
            or os.path.getsize(converted_path) == 0
        ):
            try:
                os.remove(converted_path)
            except OSError:
                pass


def remove_temporary_audio(file_path):
    """Delete the temporary converted WAV after an endpoint finishes."""
    if file_path and os.path.isfile(file_path):
        try:
            os.remove(file_path)
        except OSError:
            app.logger.warning("Could not remove temporary audio file.")


def load_audio(file_path, duration=None):
    """Load converted mono WAV audio with a bounded duration if requested."""
    audio, sr = librosa.load(
        file_path,
        sr=None,
        mono=True,
        duration=duration,
    )
    if audio.size == 0:
        raise ValueError("The audio file is empty or unreadable.")
    return audio, sr


def estimate_tempo(rms):
    """Keep the project's existing RMS-based tempo estimate."""
    try:
        return round(80 + min(float(rms) * 500, 80), 2)
    except (TypeError, ValueError):
        return 80.0


def extract_audio_features(file_path):
    audio, sr = load_audio(file_path, duration=FEATURE_SECONDS)
    duration = librosa.get_duration(y=audio, sr=sr)
    rms = float(np.mean(librosa.feature.rms(y=audio)[0]))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=audio)[0]))
    centroid = float(
        np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr)[0])
    )

    return {
        "duration": round(float(duration), 2),
        "sample_rate": int(sr),
        "tempo": estimate_tempo(rms),
        "rms": round(rms, 4),
        "zcr": round(zcr, 4),
        "spectral_centroid": round(centroid, 2),
    }


def classify_segment(rms):
    """Existing rule-based classification used by segment endpoints."""
    tempo = estimate_tempo(rms)

    if tempo >= 130 and rms >= 0.12:
        mood, confidence = "Energetic", 87
    elif tempo >= 100 and rms >= 0.08:
        mood, confidence = "Happy", 84
    elif tempo < 80 and rms < 0.06:
        mood, confidence = "Relaxed", 82
    elif tempo < 90:
        mood, confidence = "Sad", 76
    else:
        mood, confidence = "Happy", 80

    return mood, confidence, tempo


# ==================================================
# HEALTH CHECK
# ==================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "AI Music Mood Classifier Backend Running",
        "status": "Online",
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"success": True, "status": "healthy"})


# ==================================================
# SERVE UPLOADED ORIGINAL FILES
# ==================================================

@app.route("/uploads/<path:filename>", methods=["GET"])
def uploaded_file(filename):
    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename,
        as_attachment=False,
    )


# ==================================================
# MAIN MOOD PREDICTION
# ==================================================

@app.route("/mood", methods=["POST"])
def mood_prediction():
    converted_path = None
    try:
        if "file" not in request.files:
            return error_response("No audio or video file uploaded.", 400)

        filename, converted_path = save_uploaded_file(request.files["file"])
        print("Analyzing:", filename, flush=True)

        features = extract_audio_features(converted_path)
        model_result = predict_mood_from_file(converted_path)

        mood = model_result["mood"]
        confidence = model_result["confidence"]
        intensity = model_result["intensity"]
        probabilities = model_result.get("probabilities", {})

        try:
            explanation = generate_mood_explanation(
                mood,
                confidence,
                intensity,
                features["tempo"],
                features["rms"],
                features["zcr"],
                features["spectral_centroid"],
            )
        except Exception as exc:
            print("Gemini explanation failed:", repr(exc), flush=True)
            explanation = (
                f"The model predicted {mood} mood with "
                f"{confidence}% confidence and {intensity} intensity."
            )

        save_prediction(
            filename,
            mood,
            confidence,
            intensity,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )

        return jsonify({
            "success": True,
            "filename": filename,
            "duration": features["duration"],
            "mood": mood,
            "confidence": confidence,
            "intensity": intensity,
            "gemini_explanation": explanation,
            "probabilities": probabilities,
            "features": features,
        })

    except ValueError as exc:
        return error_response(exc, 400)
    except RuntimeError as exc:
        print("ERROR IN /mood:", repr(exc), flush=True)
        return error_response(str(exc), 500)
    except Exception as exc:
        print("ERROR IN /mood:", repr(exc), flush=True)
        traceback.print_exc()
        return error_response("Mood analysis failed. Check backend logs.", 500)
    finally:
        remove_temporary_audio(converted_path)


# ==================================================
# LYRICS ANALYSIS
# ==================================================

@app.route("/lyrics", methods=["POST"])
def lyrics_analysis():
    try:
        data = request.get_json(silent=True) or {}
        lyrics = data.get("lyrics", "")

        if not isinstance(lyrics, str) or not lyrics.strip():
            return error_response("Lyrics cannot be empty.", 400)

        text = lyrics.lower()
        word_groups = {
            "Happy": [
                "happy", "love", "smile", "joy", "beautiful", "fun",
                "dance", "celebrate", "happiness", "laugh", "lovely",
                "wonderful",
            ],
            "Sad": [
                "sad", "cry", "tears", "alone", "pain", "broken",
                "miss", "lonely", "sorrow", "hurt", "lost", "goodbye",
            ],
            "Energetic": [
                "dance", "party", "fire", "power", "energy", "rock",
                "move", "crazy", "strong", "beat", "jump", "run",
            ],
            "Relaxed": [
                "calm", "peace", "relax", "quiet", "dream", "sleep",
                "slow", "peaceful", "serene", "soft", "nature",
            ],
        }

        scores = {
            mood: sum(text.count(word) for word in words)
            for mood, words in word_groups.items()
        }

        if max(scores.values()) == 0:
            mood = "Neutral"
            confidence = 50
        else:
            mood = max(scores, key=scores.get)
            total = sum(scores.values())
            confidence = round(scores[mood] / total * 100)

        keywords = list(dict.fromkeys(
            word
            for words in word_groups.values()
            for word in words
            if word in text
        ))

        meanings = {
            "Happy": (
                "The lyrics express positive emotions such as love, "
                "happiness, joy and uplifting feelings."
            ),
            "Sad": (
                "The lyrics express sadness, pain, loneliness or loss."
            ),
            "Energetic": (
                "The lyrics suggest energy, excitement, movement or power."
            ),
            "Relaxed": (
                "The lyrics suggest calm, peaceful and soothing emotions."
            ),
            "Neutral": (
                "There are not enough emotional keywords to identify "
                "a specific mood."
            ),
        }

        return jsonify({
            "success": True,
            "mood": mood,
            "confidence": confidence,
            "scores": scores,
            "lyrics": lyrics,
            "emotional_meaning": meanings[mood],
            "keywords": keywords,
            "lyrics_length": len(lyrics),
        })

    except Exception as exc:
        print("ERROR IN /lyrics:", repr(exc), flush=True)
        traceback.print_exc()
        return error_response("Lyrics analysis failed.", 500)


# ==================================================
# MOOD TRANSITION
# ==================================================

@app.route("/mood-transition", methods=["POST"])
def mood_transition():
    converted_path = None
    try:
        if "file" not in request.files:
            return error_response("No audio or video file uploaded.", 400)

        filename, converted_path = save_uploaded_file(request.files["file"])
        audio, sr = load_audio(
            converted_path, duration=MAX_ANALYSIS_SECONDS
        )
        analyzed_duration = librosa.get_duration(y=audio, sr=sr)

        transitions = []
        start_time = 0.0

        while start_time < analyzed_duration:
            end_time = min(start_time + SEGMENT_SECONDS, analyzed_duration)
            start_sample = int(start_time * sr)
            end_sample = int(end_time * sr)
            segment = audio[start_sample:end_sample]

            if segment.size == 0:
                break

            rms = float(np.mean(librosa.feature.rms(y=segment)[0]))
            mood, confidence, tempo = classify_segment(rms)

            transitions.append({
                "start": round(start_time, 2),
                "end": round(end_time, 2),
                "mood": mood,
                "confidence": confidence,
                "rms": round(rms, 4),
                "tempo": round(tempo, 2),
            })
            start_time += SEGMENT_SECONDS

        mood_changes = []
        for index in range(1, len(transitions)):
            previous = transitions[index - 1]["mood"]
            current = transitions[index]["mood"]
            if previous != current:
                mood_changes.append({
                    "from": previous,
                    "to": current,
                    "at": transitions[index]["start"],
                })

        return jsonify({
            "success": True,
            "filename": filename,
            "duration": round(analyzed_duration, 2),
            "transitions": transitions,
            "mood_changes": mood_changes,
            "truncated": analyzed_duration >= MAX_ANALYSIS_SECONDS,
        })

    except ValueError as exc:
        return error_response(exc, 400)
    except RuntimeError as exc:
        print("ERROR IN /mood-transition:", repr(exc), flush=True)
        return error_response(str(exc), 500)
    except Exception as exc:
        print("ERROR IN /mood-transition:", repr(exc), flush=True)
        traceback.print_exc()
        return error_response(
            "Mood transition analysis failed. Check backend logs.", 500
        )
    finally:
        remove_temporary_audio(converted_path)


# ==================================================
# MULTI-MOOD ANALYSIS
# ==================================================

@app.route("/multi-mood", methods=["POST"])
def multi_mood():
    converted_path = None
    try:
        if "file" not in request.files:
            return error_response("No audio or video file uploaded.", 400)

        filename, converted_path = save_uploaded_file(request.files["file"])
        audio, sr = load_audio(converted_path, duration=FEATURE_SECONDS)

        rms = float(np.mean(librosa.feature.rms(y=audio)[0]))
        tempo = estimate_tempo(rms)

        happy_score = min(100, max(0, int(
            60 + rms * 100 + (tempo - 100) * 0.2
        )))
        energetic_score = min(100, max(0, int(
            50 + rms * 150 + (tempo - 100) * 0.3
        )))
        relaxed_score = min(100, max(0, int(
            70 - rms * 120 - max(tempo - 80, 0) * 0.2
        )))
        sad_score = min(100, max(0, int(
            65 - rms * 100 - max(tempo - 70, 0) * 0.15
        )))

        scores = {
            "Happy": happy_score,
            "Energetic": energetic_score,
            "Relaxed": relaxed_score,
            "Sad": sad_score,
        }

        return jsonify({
            "success": True,
            "filename": filename,
            "duration": round(librosa.get_duration(y=audio, sr=sr), 2),
            "dominant_mood": max(scores, key=scores.get),
            "scores": scores,
            "mood_changes": 0,
            "features": {
                "tempo": round(tempo, 2),
                "rms": round(rms, 4),
            },
        })

    except ValueError as exc:
        return error_response(exc, 400)
    except RuntimeError as exc:
        print("ERROR IN /multi-mood:", repr(exc), flush=True)
        return error_response(str(exc), 500)
    except Exception as exc:
        print("ERROR IN /multi-mood:", repr(exc), flush=True)
        traceback.print_exc()
        return error_response(
            "Multi-mood analysis failed. Check backend logs.", 500
        )
    finally:
        remove_temporary_audio(converted_path)


# ==================================================
# SAVE USER FEEDBACK
# ==================================================

@app.route("/feedback", methods=["POST"])
def submit_feedback():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return error_response("Request body must be valid JSON.", 400)

        helpfulness = data.get("helpfulness")
        rating = data.get("rating")

        if not isinstance(helpfulness, str) or not helpfulness.strip():
            return error_response("Please select a feedback option.", 400)

        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return error_response("Rating must be a number from 1 to 5.", 400)

        if rating < 1 or rating > 5:
            return error_response("Rating must be between 1 and 5.", 400)

        feedback_data = {
            "songName": str(data.get("songName", "")),
            "mood": str(data.get("mood", "")),
            "confidence": str(data.get("confidence", "")),
            "helpfulness": helpfulness.strip(),
            "rating": rating,
            "feedback": str(data.get("feedback", "")),
            "submittedAt": str(
                data.get("submittedAt")
                or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ),
        }

        feedback_id = save_feedback(feedback_data)
        return jsonify({
            "success": True,
            "message": "Feedback saved successfully.",
            "feedback_id": feedback_id,
        }), 201

    except (ValueError, TypeError) as exc:
        return error_response(str(exc), 400)
    except Exception:
        app.logger.exception("Failed to save feedback.")
        return error_response(
            "Could not save feedback. Please try again.", 500
        )


# ==================================================
# HISTORY
# ==================================================

@app.route("/history", methods=["GET"])
def history():
    try:
        return jsonify({
            "success": True,
            "predictions": get_predictions(),
        })
    except Exception as exc:
        print("ERROR IN /history:", repr(exc), flush=True)
        traceback.print_exc()
        return error_response("Could not retrieve history.", 500)


@app.route("/history/<int:prediction_id>", methods=["DELETE"])
def delete_history(prediction_id):
    try:
        result = delete_prediction(prediction_id)
        return jsonify({
            "success": True,
            "message": "Prediction deleted successfully.",
            "result": result,
        })
    except Exception as exc:
        print("ERROR DELETING HISTORY ITEM:", repr(exc), flush=True)
        traceback.print_exc()
        return error_response("Could not delete this prediction.", 500)


@app.route("/history", methods=["DELETE"])
def delete_all_history():
    try:
        clear_predictions()
        return jsonify({
            "success": True,
            "message": "Prediction history cleared successfully.",
        })
    except Exception as exc:
        print("ERROR CLEARING HISTORY:", repr(exc), flush=True)
        traceback.print_exc()
        return error_response("Could not clear prediction history.", 500)


# ==================================================
# ERROR HANDLERS
# ==================================================

@app.errorhandler(413)
def file_too_large(_error):
    return error_response(
        f"File is too large. Maximum size is {MAX_UPLOAD_MB} MB.", 413
    )


@app.errorhandler(404)
def not_found(_error):
    return error_response("API endpoint not found.", 404)


@app.errorhandler(500)
def internal_server_error(_error):
    return error_response("Internal server error.", 500)


# ==================================================
# START SERVER
# ==================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    print("AI MUSIC MOOD CLASSIFIER BACKEND", flush=True)
    print(f"Starting Flask on port {port}", flush=True)

    app.run(host="0.0.0.0", port=port, debug=False)