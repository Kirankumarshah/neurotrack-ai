# NeuroTrack AI: Hackathon Pitch Assets 🎤

This document contains everything you need to crush your 3-minute pitch to the judges.

---

## 📝 150-Word Elevator Pitch
**"Burnout is an epidemic, but it’s completely invisible until it’s too late. What if your computer could tell you were exhausted before you even realized it?** 

Meet **NeuroTrack AI**. We’ve built an invisible, real-time cognitive monitor that analyzes your micro-behaviors—how fast you type, the variance between your keystrokes, and your micro-pauses. Our proprietary Machine Learning model calculates your real-time **NeuroScore** and uses Explainable AI to tell you exactly *why* your focus is dropping. 

If you sustain high fatigue, our Burnout Predictor steps in and forces a dynamic break recommendation. We’re taking subjective health data and replacing it with objective, continuous behavioral intelligence. NeuroTrack AI is the future of digital wellness, protecting the world's most valuable asset: human focus."

---

## 🎬 2-Minute Demo Script

**(0:00 - 0:30) The Hook & The Dashboard**
> "Hi judges. Today we are presenting NeuroTrack AI. What you’re looking at is the NeuroScore Dashboard, a real-time monitor of my cognitive state. Right now, my NeuroScore is high, meaning I am focused. But watch what happens as I begin to get fatigued."

**(0:30 - 1:00) The Telemetry & XAI**
> "As my typing slows down, and my error rate increases, the AI instantly detects the anomaly. The NeuroScore begins to drop. But here is the magic—look at the **Focus Contributors** panel. This is Explainable AI. The system isn't a black box; it explicitly tells me that my score dropped because it detected an *Error Rate Spike* and *High Typing Variance*."

**(1:00 - 1:30) Burnout Prediction Alert**
> "Now, what happens if I force myself to keep working while exhausted? Our Analytics Engine tracks a rolling window of my history. *(Wait for or simulate the Red Banner to pop up)*. Boom. There it is. The system has detected sustained cognitive fatigue and has triggered a **Burnout Risk Alert**, overriding the dashboard and prescribing a 10-minute recovery break."

**(1:30 - 2:00) The Close**
> "We pulled this off using a clean architecture FastAPI backend serving a Next.js frontend, entirely containerized and ready for production. We aren't just tracking keystrokes; we are saving careers from burnout. Thank you."

---

## 📊 The Dataset & Simulation Explanation (For Technical Judges)
If a judge asks: *"How did you train the model or get user data during a hackathon?"*

**Your Answer:**
> "Getting labeled psychological data (like fatigue levels) paired with raw keystrokes is incredibly difficult due to privacy and the lack of open-source datasets. 
> To solve this, we built a **behavioral telemetry simulator**. We generate streams of typing events `(keydown)` and mouse movements, and we programmatically inject 'fatigue anomalies'—such as sudden drops in typing speed or spikes in error cadence. We then fed this mathematically robust simulated data into our Machine Learning pipeline (Feature Engineering -> Scaler -> Logistic Regression/Random Forest) to train the model. The architecture is entirely data-agnostic, meaning the moment we collect real human data, it plugs right into the existing pipeline without changing a single line of inference code."
