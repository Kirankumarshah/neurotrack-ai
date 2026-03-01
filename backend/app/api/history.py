from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas import HistoryEntry

router = APIRouter()

@router.get("/history")
async def get_history(db: Session = Depends(get_db)):
    entries = db.query(HistoryEntry).order_by(HistoryEntry.timestamp.desc()).limit(30).all()
    return [
        {
            "time": e.timestamp.strftime("%H:%M:%S"),
            "score": e.focus_score,
            "risk": e.risk_level
        } for e in reversed(entries)
    ]
