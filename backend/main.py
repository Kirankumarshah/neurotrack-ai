import os
from datetime import datetime
from typing import List, Literal, Optional

import joblib
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils import get_burnout_risk, get_recommendation

app = FastAPI(title="NeuroTrack AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "fatigue_model.joblib")
FEATURE_ORDER = [
    "typing_speed",
    "typing_variance",
    "error_rate",
    "idle_time",
    "reaction_delay",
    "speed_drop_rate",
    "error_acceleration",
    "idle_spike_score",
    "focus_stability_index",
]

model_pipeline = None
model_meta = {}
MAX_HISTORY = 120
session_history: List[dict] = []


class BehavioralEvent(BaseModel):
    type: Literal["keydown", "mousemove"]
    timestamp: float
    key: Optional[str] = None


class AnalyzeRequest(BaseModel):
    events: List[BehavioralEvent]
    durationMs: float
    startTime: float


class DashboardMetrics(BaseModel):
    typing_speed: float
    typing_variance: float
    error_rate: float
    idle_time: float
    reaction_delay: float
    speed_drop_rate: float
    error_acceleration: float
    idle_spike_score: float
    focus_stability_index: float


class HistoryPoint(BaseModel):
    time: str
    score: float


class Forecast(BaseModel):
    next_scores: List[float]
    risk_direction: Literal["up", "down", "stable"]
    message: str


class AnalyzeResponse(BaseModel):
    fatigue_probability: float
    focus_score: float
    burnout_risk_level: str
    burnout_trend: Literal["Improving", "Declining", "Stable"]
    recommendation: str
    metrics: DashboardMetrics
    history: List[HistoryPoint]
    forecast: Forecast


def _clip(value: float, low: float, high: float) -> float:
    return float(max(low, min(high, value)))


def _window_rate(count: int, duration_ms: float) -> float:
    if duration_ms <= 0:
        return 0.0
    return (count / 5.0) / (duration_ms / 60000.0)


def _to_time_label(ts_ms: float) -> str:
    return datetime.fromtimestamp(ts_ms / 1000.0).strftime("%H:%M:%S")


def engineer_features(events: List[BehavioralEvent], duration_ms: float) -> dict:
    if duration_ms <= 0:
        duration_ms = 1.0

    sorted_events = sorted(events, key=lambda e: e.timestamp)
    key_events = [e for e in sorted_events if e.type == "keydown"]
    mouse_events = [e for e in sorted_events if e.type == "mousemove"]
    interaction_count = len(key_events) + len(mouse_events)

    backspaces = sum(1 for e in key_events if e.key == "Backspace")
    key_intervals = [
        key_events[i].timestamp - key_events[i - 1].timestamp
        for i in range(1, len(key_events))
        if key_events[i].timestamp - key_events[i - 1].timestamp < 2500
    ]

    typing_speed = _window_rate(len(key_events), duration_ms)
    typing_variance = float(np.std(key_intervals)) if len(key_intervals) > 1 else 0.0
    error_rate = (backspaces / len(key_events)) if key_events else 0.0

    interaction_gaps = [
        sorted_events[i].timestamp - sorted_events[i - 1].timestamp
        for i in range(1, len(sorted_events))
    ]
    idle_threshold_ms = 1500
    long_idle_threshold_ms = 5000

    idle_time_ms = sum(g for g in interaction_gaps if g > idle_threshold_ms)
    idle_time = (idle_time_ms / duration_ms) * 100.0

    reaction_candidates = [g / 1000.0 for g in interaction_gaps if g > idle_threshold_ms]
    reaction_delay = float(np.mean(reaction_candidates)) if reaction_candidates else 0.45

    midpoint = (sorted_events[0].timestamp + sorted_events[-1].timestamp) / 2 if sorted_events else 0.0
    early_keys = [e for e in key_events if e.timestamp <= midpoint]
    late_keys = [e for e in key_events if e.timestamp > midpoint]

    early_wpm = _window_rate(len(early_keys), duration_ms / 2.0)
    late_wpm = _window_rate(len(late_keys), duration_ms / 2.0)
    if early_wpm <= 1:
        speed_drop_rate = 0.0
    else:
        speed_drop_rate = _clip((early_wpm - late_wpm) / max(early_wpm, 1.0), 0.0, 1.0)

    early_errors = sum(1 for e in early_keys if e.key == "Backspace")
    late_errors = sum(1 for e in late_keys if e.key == "Backspace")
    early_error_rate = (early_errors / len(early_keys)) if early_keys else 0.0
    late_error_rate = (late_errors / len(late_keys)) if late_keys else 0.0
    error_acceleration = _clip((late_error_rate - early_error_rate + 1.0) / 2.0, 0.0, 1.0)

    if not interaction_gaps:
        idle_spike_score = 0.0
    else:
        spikes = sum(1 for g in interaction_gaps if g > long_idle_threshold_ms)
        idle_spike_score = _clip(spikes / max(len(interaction_gaps), 1), 0.0, 1.0)

    normalized_variance = _clip(typing_variance / 1200.0, 0.0, 1.0)
    normalized_error = _clip(error_rate / 0.35, 0.0, 1.0)
    normalized_idle = _clip(idle_time / 100.0, 0.0, 1.0)
    focus_stability_index = _clip(
        1.0 - (0.4 * normalized_variance + 0.3 * normalized_idle + 0.2 * idle_spike_score + 0.1 * normalized_error),
        0.0,
        1.0,
    )

    if interaction_count == 0:
        idle_time = 100.0
        reaction_delay = 2.5

    return {
        "typing_speed": float(typing_speed),
        "typing_variance": float(typing_variance),
        "error_rate": float(error_rate),
        "idle_time": float(_clip(idle_time, 0.0, 100.0)),
        "reaction_delay": float(_clip(reaction_delay, 0.1, 10.0)),
        "speed_drop_rate": float(speed_drop_rate),
        "error_acceleration": float(error_acceleration),
        "idle_spike_score": float(idle_spike_score),
        "focus_stability_index": float(focus_stability_index),
    }


def get_trend() -> Literal["Improving", "Declining", "Stable"]:
    if len(session_history) < 5:
        return "Stable"
    recent_scores = [point["score"] for point in session_history[-5:]]
    delta = recent_scores[-1] - recent_scores[0]
    if delta >= 4.0:
        return "Improving"
    if delta <= -4.0:
        return "Declining"
    return "Stable"


def forecast_next_scores() -> dict:
    if not session_history:
        return {
            "next_scores": [100.0, 100.0, 100.0],
            "risk_direction": "stable",
            "message": "Need more session data before forecasting.",
        }

    scores = [point["score"] for point in session_history[-8:]]
    if len(scores) < 3:
        current = round(scores[-1], 2)
        return {
            "next_scores": [current, current, current],
            "risk_direction": "stable",
            "message": "Collecting baseline for short-term prediction.",
        }

    slope = (scores[-1] - scores[0]) / max(len(scores) - 1, 1)
    moving_avg = float(np.mean(scores[-3:]))

    next_1 = _clip(moving_avg + slope, 0.0, 100.0)
    next_2 = _clip(next_1 + slope * 0.8, 0.0, 100.0)
    next_3 = _clip(next_2 + slope * 0.6, 0.0, 100.0)
    next_scores = [round(next_1, 2), round(next_2, 2), round(next_3, 2)]

    current = scores[-1]
    if next_3 < current - 3:
        message = "Fatigue likely to increase in upcoming windows. Consider a break in the next 15 minutes."
        risk_direction = "up"
    elif next_3 > current + 3:
        message = "Focus is forecasted to improve if current behavior continues."
        risk_direction = "down"
    else:
        message = "Focus is expected to remain stable over the next few windows."
        risk_direction = "stable"

    return {
        "next_scores": next_scores,
        "risk_direction": risk_direction,
        "message": message,
    }


from sqlalchemy import create_engine, Column, Float, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

# SQLite setup
DB_PATH = os.path.join(os.path.dirname(__file__), 'history.db')
engine = create_engine(f'sqlite:///{DB_PATH}')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class HistoryEntry(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    focus_score = Column(Float)
    risk_level = Column(String)

Base.metadata.create_all(bind=engine)

@app.on_event("startup")
async def startup_event() -> None:
    global model_pipeline, model_meta

    if not os.path.exists(MODEL_PATH):
        print("Model not found. Training model...")
        import model

        model.train_model()

    loaded = joblib.load(MODEL_PATH)

    # Upgrade older model files transparently.
    if not isinstance(loaded, dict) or "pipeline" not in loaded or "feature_names" not in loaded:
        print("Legacy model format detected. Retraining upgraded model...")
        import model

        model.train_model()
        loaded = joblib.load(MODEL_PATH)

    loaded_features = loaded.get("feature_names", [])
    if loaded_features != FEATURE_ORDER:
        print("Feature mismatch detected. Retraining model with expected feature set...")
        import model

        model.train_model()
        loaded = joblib.load(MODEL_PATH)

    model_pipeline = loaded["pipeline"]
    model_meta = {
        "accuracy": loaded.get("accuracy"),
        "roc_auc": loaded.get("roc_auc"),
        "trained_at": loaded.get("trained_at"),
    }

    print(
        "Model loaded successfully.",
        f"Accuracy={model_meta.get('accuracy')}",
        f"ROC-AUC={model_meta.get('roc_auc')}",
        f"TrainedAt={model_meta.get('trained_at')}",
    )


@app.get("/")
def read_root() -> dict:
    return {
        "message": "NeuroTrack AI API is running.",
        "model": model_meta,
        "history_points": len(session_history),
    }


@app.post("/session/reset")
def reset_session() -> dict:
    session_history.clear()
    return {"message": "Session history reset."}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_behavior(data: AnalyzeRequest) -> AnalyzeResponse:
    if model_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        features_dict = engineer_features(data.events, data.durationMs)
        feature_vector = [[features_dict[name] for name in FEATURE_ORDER]]

        probs = model_pipeline.predict_proba(feature_vector)
        fatigue_probability = float(probs[0][1])

        focus_score = round(100.0 - (fatigue_probability * 100.0), 2)
        burnout_risk = get_burnout_risk(fatigue_probability)

        now_ms = data.startTime + data.durationMs
        session_history.append(
            {
                "time": _to_time_label(now_ms),
                "score": focus_score,
                "fatigue_probability": round(fatigue_probability, 4),
            }
        )
        if len(session_history) > MAX_HISTORY:
            del session_history[: len(session_history) - MAX_HISTORY]

        trend = get_trend()
        forecast = forecast_next_scores()
        recommendation = get_recommendation(fatigue_probability)
        if trend == "Declining":
            recommendation = "Short-term decline detected. " + recommendation

        history_payload = [
            HistoryPoint(time=point["time"], score=round(point["score"], 2))
            for point in session_history[-30:]
        ]

        # Save to SQLite
        db = SessionLocal()
        try:
            db_entry = HistoryEntry(
                focus_score=focus_score,
                risk_level=burnout_risk
            )
            db.add(db_entry)
            db.commit()
        except:
            db.rollback()
        finally:
            db.close()

        return AnalyzeResponse(
            fatigue_probability=round(fatigue_probability, 4),
            focus_score=focus_score,
            burnout_risk_level=burnout_risk,
            burnout_trend=trend,
            recommendation=recommendation,
            metrics=DashboardMetrics(
                typing_speed=round(features_dict["typing_speed"], 1),
                typing_variance=round(features_dict["typing_variance"], 1),
                error_rate=round(features_dict["error_rate"], 4),
                idle_time=round(features_dict["idle_time"], 1),
                reaction_delay=round(features_dict["reaction_delay"], 2),
                speed_drop_rate=round(features_dict["speed_drop_rate"], 3),
                error_acceleration=round(features_dict["error_acceleration"], 3),
                idle_spike_score=round(features_dict["idle_spike_score"], 3),
                focus_stability_index=round(features_dict["focus_stability_index"], 3),
            ),
            history=history_payload,
            forecast=Forecast(
                next_scores=forecast["next_scores"],
                risk_direction=forecast["risk_direction"],
                message=forecast["message"],
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/history")
async def get_db_history():
    db = SessionLocal()
    try:
        entries = db.query(HistoryEntry).order_by(HistoryEntry.timestamp.desc()).limit(50).all()
        return [
            {
                "time": e.timestamp.strftime("%H:%M:%S"),
                "score": e.focus_score,
                "risk": e.risk_level
            } for e in reversed(entries)
        ]
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
