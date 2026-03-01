def get_recommendation(fatigue_probability: float) -> str:
    """
    Returns a recommendation based on the fatigue probability.
    """
    if fatigue_probability > 0.7:
        return "High fatigue detected. Take a 7-minute break."
    elif fatigue_probability > 0.4:
        return "Focus drifting. Consider a short pause."
    else:
        return "You are performing optimally."

def get_burnout_risk(fatigue_probability: float) -> str:
    """
    Returns the burnout risk level.
    """
    percentage = fatigue_probability * 100
    if percentage > 70:
        return "High"
    elif percentage > 40:
        return "Medium"
    else:
        return "Low"
