from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from pydantic import BaseModel
from typing import List, Literal, Optional
from app.core.database import Base

# SQLAlchemy Model
class HistoryEntry(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    focus_score = Column(Float)
    risk_level = Column(String)

# Pydantic Schemas (DTOs)
class BehavioralEvent(BaseModel):
    type: Literal["keydown", "mousemove"]
    timestamp: float
    key: Optional[str] = None

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

class XAIContributor(BaseModel):
    feature: str
    impact: str # "High", "Medium", "Low"
    reason: str

class AnalyzeRequest(BaseModel):
    events: List[BehavioralEvent]
    durationMs: float
    startTime: float

class AIReport(BaseModel):
    focus_score: float
    fatigue_risk: str
    typing_stability: str
    recommended_break: str

class AnalyzeResponse(BaseModel):
    fatigue_probability: float
    focus_score: float
    neuro_score: float
    burnout_risk_level: str
    burnout_trend: Literal["Improving", "Declining", "Stable"]
    burnout_alert: bool
    recommendation: str
    metrics: DashboardMetrics
    history: List[HistoryPoint]
    forecast: Forecast
    contributors: List[XAIContributor] # New XAI field
    ai_focus_report: AIReport
