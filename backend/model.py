import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
import joblib
import os

def generate_synthetic_data(num_samples=1000):
    """
    Generates synthetic behavioral data for fatigue detection.
    
    Features:
    - typing_speed: Words per minute (higher = less fatigue)
    - typing_variance: Consistency in typing speed (higher = more fatigue)
    - error_rate: Frequency of backspaces (higher = more fatigue)
    - idle_time: Percentage of time inactive (higher = more fatigue)
    - reaction_delay: Time to respond to prompts (higher = more fatigue)
    """
    np.random.seed(42)
    
    # Generate random features
    typing_speed = np.random.normal(50, 15, num_samples)
    typing_variance = np.random.normal(10, 5, num_samples)
    error_rate = np.random.normal(0.05, 0.03, num_samples)
    idle_time = np.random.normal(20, 10, num_samples)
    reaction_delay = np.random.normal(0.5, 0.2, num_samples)
    
    # Clip values to realistic ranges
    typing_speed = np.clip(typing_speed, 10, 120)
    typing_variance = np.clip(typing_variance, 0, 50)
    error_rate = np.clip(error_rate, 0, 0.3)
    idle_time = np.clip(idle_time, 0, 100)
    reaction_delay = np.clip(reaction_delay, 0.1, 2.0)
    
    # Create target (fatigue: 0 or 1) based on a linear combination + noise
    # Fatigue is higher when speed is low, variance is high, errors are high, idle is high, delay is high.
    z = (
        -0.05 * typing_speed + 
        0.1 * typing_variance + 
        10.0 * error_rate + 
        0.05 * idle_time + 
        2.0 * reaction_delay - 
        1.5 # bias adjusted for balanced output
    )
    
    prob = 1 / (1 + np.exp(-z))
    fatigue = (prob > 0.5).astype(int)
    
    data = pd.DataFrame({
        'typing_speed': typing_speed,
        'typing_variance': typing_variance,
        'error_rate': error_rate,
        'idle_time': idle_time,
        'reaction_delay': reaction_delay,
        'fatigue': fatigue
    })
    
    return data

def train_model():
    print("Generating synthetic data...")
    data = generate_synthetic_data()
    
    X = data.drop('fatigue', axis=1)
    y = data['fatigue']
    
    print("Training Logistic Regression model...")
    model = LogisticRegression()
    model.fit(X, y)
    
    model_path = os.path.join(os.path.dirname(__file__), 'fatigue_model.joblib')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
