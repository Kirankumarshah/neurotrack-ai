from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
import uvicorn
from utils import get_recommendation, get_burnout_risk

app = FastAPI(title="NeuroTrack AI API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'fatigue_model.joblib')

# Global variable for model
model_instance = None

@app.on_event("startup")
async def startup_event():
    global model_instance
    if not os.path.exists(MODEL_PATH):
        print("Model not found. Training model...")
        import model
        model.train_model()
    
    model_instance = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")

import numpy as np
from typing import List, Optional
from datetime import datetime

class BehavioralEvent(BaseModel):
    type: str
    timestamp: float
    key: Optional[str] = None

class AnalyzeRequest(BaseModel):
    events: List[BehavioralEvent]
    durationMs: float
    startTime: float

class DashboardMetrics(BaseModel):
    typing_speed: float
    error_rate: float
    idle_time: float
    reaction_delay: float

class AnalyzeResponse(BaseModel):
    fatigue_probability: float
    focus_score: float
    burnout_risk_level: str
    burnout_trend: str
    recommendation: str
    metrics: DashboardMetrics

# Session history for trend analysis
session_history = []

def engineer_features(events: List[BehavioralEvent], duration_ms: float):
    # Typing Features
    kp_events = [e for e in events if e.type == 'keydown']
    typing_count = len(kp_events)
    backspace_count = len([e for e in kp_events if e.key == 'Backspace'])
    
    # WPM (approx)
    wpm = (typing_count / 5) / (duration_ms / 60000) if duration_ms > 0 else 0
    
    # Typing Variance
    intervals = []
    for i in range(1, len(kp_events)):
        diff = kp_events[i].timestamp - kp_events[i-1].timestamp
        if diff < 2000: # Only count continuous typing
            intervals.append(diff)
    
    variance = np.std(intervals) if len(intervals) > 1 else 0
    error_rate = backspace_count / typing_count if typing_count > 0 else 0
    
    # Idle & Reaction
    sorted_events = sorted(events, key=lambda x: x.timestamp)
    gaps = []
    for i in range(1, len(sorted_events)):
        gaps.append(sorted_events[i].timestamp - sorted_events[i-1].timestamp)
    
    idle_threshold = 2000 # 2 seconds
    idle_time_ms = sum([g for g in gaps if g > idle_threshold])
    idle_percentage = (idle_time_ms / duration_ms) * 100 if duration_ms > 0 else 0
    
    # Reaction Delay (gap after long idle)
    reaction_gaps = [g/1000 for g in gaps if g > idle_threshold]
    avg_reaction = np.mean(reaction_gaps) if reaction_gaps else 0.5
    
    return {
        "typing_speed": float(wpm),
        "typing_variance": float(variance),
        "error_rate": float(error_rate),
        "idle_time": float(idle_percentage),
        "reaction_delay": float(avg_reaction)
    }

def get_trend(current_score):
    if len(session_history) < 3:
        return "Stable"
    
    recent = [h['score'] for h in session_history[-5:]]
    avg_recent = np.mean(recent)
    
    if current_score < avg_recent - 5:
        return "Declining"
    if current_score > avg_recent + 5:
        return "Improving"
    return "Stable"

def predict_burnout_time():
    if len(session_history) < 5:
        return None
    
    recent_scores = [h['score'] for h in session_history[-10:]]
    if len(recent_scores) < 2:
        return None
        
    # Simple linear trend
    x = np.arange(len(recent_scores))
    y = np.array(recent_scores)
    slope, intercept = np.polyfit(x, y, 1)
    
    if slope >= 0:
        return "Stable" # Improving or stable
    
    # Predict when score hits 40 (High risk threshold)
    current_score = recent_scores[-1]
    if current_score <= 40:
        return "Critical"
        
    minutes_to_risk = (40 - current_score) / slope * (10 / 60) # 10s batches
    return f"{max(5, round(minutes_to_risk))}m"

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_behavior(data: AnalyzeRequest):
    if model_instance is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    try:
        features_dict = engineer_features(data.events, data.durationMs)
        
        # Prepare input for the model
        features = [[
            features_dict["typing_speed"],
            features_dict["typing_variance"],
            features_dict["error_rate"],
            features_dict["idle_time"],
            features_dict["reaction_delay"]
        ]]
        
        # Predict fatigue probability
        probs = model_instance.predict_proba(features)
        fatigue_probability = float(probs[0][1])
        
        focus_score = 100.0 - (fatigue_probability * 100.0)
        burnout_risk = get_burnout_risk(fatigue_probability)
        recommendation = get_recommendation(fatigue_probability)
        trend = get_trend(focus_score)
        
        # Save to history
        session_history.append({"time": datetime.now(), "score": focus_score})
        prediction = predict_burnout_time()
        
        # Slightly update recommendation if trend is bad
        if trend == "Declining":
            recommendation = "Rapid focus decline detected. " + recommendation

        return AnalyzeResponse(
            fatigue_probability=round(fatigue_probability, 4),
            focus_score=round(focus_score, 2),
            burnout_risk_level=burnout_risk,
            burnout_trend=trend,
            recommendation=recommendation,
            metrics=DashboardMetrics(
                typing_speed=round(features_dict["typing_speed"], 1),
                error_rate=round(features_dict["error_rate"], 3),
                idle_time=round(features_dict["idle_time"], 1),
                reaction_delay=round(features_dict["reaction_delay"], 2)
            )
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
