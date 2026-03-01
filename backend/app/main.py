from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analyze, history
from app.core.database import Base, engine

# Initialize DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NeuroTrack AI - Production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History"])

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "NeuroTrack AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
