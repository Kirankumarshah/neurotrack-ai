import os
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FEATURE_NAMES = [
    "typing_speed",
    "typing_variance",
    "error_rate",
    "idle_time",
    "reaction_delay",
    "speed_drop_rate",
    "error_acceleration",
    "idle_spike_score",
    "focus_stability_index",
]


def _clip(values: np.ndarray, low: float, high: float) -> np.ndarray:
    return np.clip(values, low, high)


def generate_synthetic_data(num_samples: int = 2400) -> pd.DataFrame:
    """Generate synthetic behavioral windows with base and engineered features."""
    rng = np.random.default_rng(42)

    typing_speed = _clip(rng.normal(52, 14, num_samples), 8, 130)
    typing_variance = _clip(rng.normal(12, 6, num_samples), 0, 60)
    error_rate = _clip(rng.normal(0.06, 0.035, num_samples), 0, 0.35)
    idle_time = _clip(rng.normal(24, 14, num_samples), 0, 100)
    reaction_delay = _clip(rng.normal(0.7, 0.35, num_samples), 0.1, 4.0)

    speed_drop_rate = _clip(((58 - typing_speed) / 60) + rng.normal(0.10, 0.12, num_samples), 0, 1)
    error_acceleration = _clip((error_rate * 2.5) + (typing_variance / 100) + rng.normal(0.02, 0.07, num_samples), 0, 1)
    idle_spike_score = _clip((idle_time / 100) + ((reaction_delay - 0.6) / 3.5) + rng.normal(0.0, 0.08, num_samples), 0, 1)
    focus_stability_index = _clip(
        1 - ((typing_variance / 70) + (idle_spike_score * 0.6) + (error_rate * 0.7)) + rng.normal(0.0, 0.08, num_samples),
        0,
        1,
    )

    z = (
        -0.045 * typing_speed
        + 0.07 * typing_variance
        + 8.2 * error_rate
        + 0.038 * idle_time
        + 1.2 * reaction_delay
        + 1.8 * speed_drop_rate
        + 1.4 * error_acceleration
        + 1.6 * idle_spike_score
        - 2.1 * focus_stability_index
        - 1.25
    )

    fatigue_probability = 1 / (1 + np.exp(-z))
    fatigue = (fatigue_probability >= 0.5).astype(int)

    return pd.DataFrame(
        {
            "typing_speed": typing_speed,
            "typing_variance": typing_variance,
            "error_rate": error_rate,
            "idle_time": idle_time,
            "reaction_delay": reaction_delay,
            "speed_drop_rate": speed_drop_rate,
            "error_acceleration": error_acceleration,
            "idle_spike_score": idle_spike_score,
            "focus_stability_index": focus_stability_index,
            "fatigue": fatigue,
        }
    )


def train_model() -> str:
    print("Generating synthetic training data...")
    data = generate_synthetic_data()

    X = data[FEATURE_NAMES]
    y = data["fatigue"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(max_iter=2500, random_state=42)),
        ]
    )

    print("Training fatigue model (StandardScaler + LogisticRegression)...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    print(f"Model accuracy: {accuracy:.3f}")
    print(f"Model ROC-AUC: {auc:.3f}")

    model_bundle = {
        "pipeline": pipeline,
        "feature_names": FEATURE_NAMES,
        "accuracy": float(accuracy),
        "roc_auc": float(auc),
        "trained_at": datetime.utcnow().isoformat(),
    }

    model_path = os.path.join(os.path.dirname(__file__), "fatigue_model.joblib")
    joblib.dump(model_bundle, model_path)
    print(f"Model bundle saved to {model_path}")
    return model_path


if __name__ == "__main__":
    train_model()
