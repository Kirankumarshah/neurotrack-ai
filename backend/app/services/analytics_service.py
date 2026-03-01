import numpy as np
from typing import List, Literal
from app.models.schemas import HistoryPoint

def get_trend(history: List[dict]) -> Literal["Improving", "Declining", "Stable"]:
    if len(history) < 5:
        return "Stable"
    recent_scores = [point["score"] for point in history[-5:]]
    delta = recent_scores[-1] - recent_scores[0]
    if delta >= 4.0: return "Improving"
    if delta <= -4.0: return "Declining"
    return "Stable"

def forecast_next_scores(history: List[dict]) -> dict:
    if not history:
        return {"next_scores": [100.0]*3, "risk_direction": "stable", "message": "Initializing..."}
    
    scores = [h["score"] for h in history[-8:]]
    current = scores[-1]
    
    if len(scores) < 3:
        return {"next_scores": [current]*3, "risk_direction": "stable", "message": "Collecting baseline."}

    slope = (scores[-1] - scores[0]) / max(len(scores) - 1, 1)
    next_3 = [max(0, min(100, current + slope * (i+1))) for i in range(3)]
    
    direction = "up" if slope < -0.5 else "down" if slope > 0.5 else "stable"
    msg = "Focus is stable."
    if direction == "up": msg = "Fatigue likely to increase soon."
    
    return {
        "next_scores": [round(s, 2) for s in next_3],
        "risk_direction": direction,
        "message": msg
    }
