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