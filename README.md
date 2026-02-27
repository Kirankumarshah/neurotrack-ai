# NeuroTrack AI – Behavioral Cognitive Monitoring System

NeuroTrack AI is an AI-powered system that detects cognitive fatigue and focus degradation using behavioral interaction data such as typing patterns and mouse activity.

## Core Features
- **Behavioral Tracking**: Real-time monitoring of typing speed, variance, error rates, and idle time.
- **Cognitive ML Model**: Logistic Regression model trained to predict fatigue probability.
- **Premium Dashboard**: Real-time focus meter, burnout risk indicator, and focus trend visualization.
- **Smart Recommendations**: Context-aware break suggestions based on cognitive load.

## Tech Stack
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Recharts, Axios.
- **Backend**: Python, FastAPI, Scikit-learn, Uvicorn.
- **ML**: Logistic Regression.

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn scikit-learn pandas joblib numpy
   ```
3. Run the backend server:
   ```bash
   python main.py
   # The server will run on http://localhost:8001
   ```
   *The model will be automatically trained and saved as `fatigue_model.joblib` on the first run.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # The dashboard will be available at http://localhost:3000
   ```

## Usage
- Open the dashboard in your browser.
- Start typing or interacting with the page.
- Behavioral metrics are collected every 10 seconds and sent to the backend for analysis.
- View your real-time Focus Score and Burnout Risk Level.
