import numpy as np
from typing import List
from app.models.schemas import BehavioralEvent, XAIContributor

def clip(value: float, low: float, high: float) -> float:
    return float(max(low, min(high, value)))

def window_rate(count: int, duration_ms: float) -> float:
    if duration_ms <= 0: return 0.0
    return (count / 5.0) / (duration_ms / 60000.0)

def engineer_features(events: List[BehavioralEvent], duration_ms: float) -> dict:
    if duration_ms <= 0: duration_ms = 1.0
    sorted_events = sorted(events, key=lambda e: e.timestamp)
    key_events = [e for e in sorted_events if e.type == "keydown"]
    
    # Typing Metrics
    backspaces = sum(1 for e in key_events if e.key == "Backspace")
    intervals = [key_events[i].timestamp - key_events[i-1].timestamp for i in range(1, len(key_events)) if 0 < key_events[i].timestamp - key_events[i-1].timestamp < 2500]
    
    typing_speed = window_rate(len(key_events), duration_ms)
    typing_variance = float(np.std(intervals)) if len(intervals) > 1 else 0.0
    error_rate = (backspaces / len(key_events)) if key_events else 0.0
    
    # Idle & Reaction
    gaps = [sorted_events[i].timestamp - sorted_events[i-1].timestamp for i in range(1, len(sorted_events))]
    idle_time_ms = sum(g for g in gaps if g > 1500)
    idle_time = (idle_time_ms / duration_ms) * 100.0
    reaction_delay = float(np.mean([g/1000 for g in gaps if g > 1500])) if any(g > 1500 for g in gaps) else 0.45

    # Trends
    mid = (sorted_events[0].timestamp + sorted_events[-1].timestamp) / 2 if sorted_events else 0
    late_keys = [e for e in key_events if e.timestamp > mid]
    late_wpm = window_rate(len(late_keys), duration_ms / 2)
    speed_drop = clip((typing_speed - late_wpm) / max(typing_speed, 1), 0, 1)

    # Stability Index
    fsi = clip(1.0 - (0.4 * (typing_variance/1200) + 0.3 * (idle_time/100) + 0.1 * (error_rate/0.35)), 0, 1)

    return {
        "typing_speed": typing_speed,
        "typing_variance": typing_variance,
        "error_rate": error_rate,
        "idle_time": clip(idle_time, 0, 100),
        "reaction_delay": clip(reaction_delay, 0.1, 10.0),
        "speed_drop_rate": speed_drop,
        "error_acceleration": clip(error_rate * 2, 0, 1), # Simplified for hackathon
        "idle_spike_score": clip(idle_time/50, 0, 1),
        "focus_stability_index": fsi
    }

def get_cognitive_contributors(features: dict) -> List[XAIContributor]:
    contributors = []
    if features["error_rate"] > 0.15:
        contributors.append(XAIContributor(feature="Accuracy", impact="High", reason="High backspace frequency detected."))
    if features["idle_time"] > 40:
        contributors.append(XAIContributor(feature="Attention", impact="Medium", reason="Increased frequency of micro-pauses."))
    if features["speed_drop_rate"] > 0.3:
        contributors.append(XAIContributor(feature="Velocity", impact="High", reason="Significant drop in typing speed detected."))
    
    if not contributors:
        contributors.append(XAIContributor(feature="Cognitive Load", impact="Low", reason="Biometric patterns are stable."))
    return contributors
