from fastapi import APIRouter, Depends, HTTPException
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import utils
from app.core.database import get_db
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, HistoryPoint, Forecast, DashboardMetrics, HistoryEntry
from app.services import feature_service, ml_service, analytics_service

router = APIRouter()

# In-memory session history for trend (survives app life, db survives forever)
session_history = []

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_behavior(data: AnalyzeRequest, db: Session = Depends(get_db)):
    try:
        # 1. Feature Engineering
        features = feature_service.engineer_features(data.events, data.durationMs)
        
        # 2. XAI logic
        contributors = feature_service.get_cognitive_contributors(features)
        
        # 3. Predict
        prob = ml_service.ml_service.predict(features)
        score = round(100.0 - (prob * 100.0), 2)
        risk = utils.get_burnout_risk(prob)
        
        # 4. Save to DB
        db_entry = HistoryEntry(focus_score=score, risk_level=risk)
        db.add(db_entry)
        db.commit()
        
        # 5. Session Analytics
        forecast = analytics_service.forecast_next_scores([]) # Session history logic would go here
        trend = analytics_service.get_trend([])
        recommendation = utils.get_recommendation(prob)
        
        return AnalyzeResponse(
            fatigue_probability=round(prob, 4),
            focus_score=score,
            burnout_risk_level=risk,
            burnout_trend=trend,
            recommendation=recommendation,
            metrics=DashboardMetrics(**{k: round(v, 2) for k, v in features.items()}),
            history=[], 
            forecast=forecast,
            contributors=contributors
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
