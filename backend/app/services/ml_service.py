import os
import joblib
import numpy as np
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "fatigue_model.joblib")
FEATURE_ORDER = [
    "typing_speed", "typing_variance", "error_rate", "idle_time", "reaction_delay",
    "speed_drop_rate", "error_acceleration", "idle_spike_score", "focus_stability_index"
]

class MLService:
    def __init__(self):
        self.pipeline = None
        self.meta = {}
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            loaded = joblib.load(MODEL_PATH)
            self.pipeline = loaded["pipeline"]
            self.meta = {
                "accuracy": loaded.get("accuracy"),
                "trained_at": loaded.get("trained_at")
            }
        else:
            print("Model missing. Consider training.")

    def predict(self, features: dict) -> float:
        if not self.pipeline: return 0.5
        vec = [[features[name] for name in FEATURE_ORDER]]
        probs = self.pipeline.predict_proba(vec)
        return float(probs[0][1])

ml_service = MLService()
