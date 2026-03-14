import numpy as np
from typing import List, Literal, Tuple
from app.models.schemas import HistoryPoint

def check_burnout(history: List[dict], current_prob: float) -> tuple[bool, str]:
    """
    Checks if fatigue has been high for consecutive recent samples.
    Returns (is_burnout_alert, recommended_break_duration).
    """
    if not history:
        # Require at least some history for a burnout alert, though we evaluate the current frame
        return current_prob > 0.8, "5 minute manual break" if current_prob > 0.8 else "None"

    # In a real app, this would be based on timestamp duration (e.g., > 10 mins)
    # Here we look at the recent sequence of prob scores.
    # We define 'high fatigue' as probability > 0.65
    recent = history[-10:] # Last 10 windows
    high_fatigue_count = sum(1 for h in recent if h.get("prob", 0) > 0.65)
    
    # If the current prob is also high
    if current_prob > 0.65:
        high_fatigue_count += 1
        
    is_burnout = False
    break_rec = "None"
    
    if high_fatigue_count >= 5: # Half of the recent window is fatigued
        is_burnout = True
        break_rec = "10 minute recovery break"
    elif current_prob > 0.75:
        # Acute spike
        is_burnout = True
        break_rec = "5 minute breather"
        
    return is_burnout, break_rec

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
