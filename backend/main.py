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

class AnalyzeRequest(BaseModel):
    typing_speed: float
    typing_variance: float
    error_rate: float
    idle_time: float
    reaction_delay: float

class AnalyzeResponse(BaseModel):
    fatigue_probability: float
    focus_score: float
    burnout_risk_level: str
    recommendation: str

@app.get("/")
def read_root():
    return {"message": "NeuroTrack AI API is running."}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_behavior(data: AnalyzeRequest):
    if model_instance is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    try:
        # Prepare input for the model
        features = [[
            data.typing_speed,
            data.typing_variance,
            data.error_rate,
            data.idle_time,
            data.reaction_delay
        ]]
        
        # Predict fatigue probability
        probs = model_instance.predict_proba(features)
        fatigue_probability = float(probs[0][1])
        
        focus_score = 100.0 - (fatigue_probability * 100.0)
        burnout_risk = get_burnout_risk(fatigue_probability)
        recommendation = get_recommendation(fatigue_probability)
        
        return AnalyzeResponse(
            fatigue_probability=round(fatigue_probability, 4),
            focus_score=round(focus_score, 2),
            burnout_risk_level=burnout_risk,
            recommendation=recommendation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
