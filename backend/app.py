data.get("helpfulness")
        rating = data.get("rating")

        if not isinstance(helpfulness, str) or not helpfulness.strip():
            return error_response("Please select a feedback option.", 400)

        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return error_response(
                "Rating must be a number from 1 to 5.",
                400,
            )

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
            "Could not save feedback. Please try again.",
            500,
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
        f"Audio file is too large. Maximum size is {MAX_UPLOAD_MB} MB.",
        413,
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

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
    )