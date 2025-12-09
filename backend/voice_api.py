from fastapi import APIRouter, UploadFile, File, HTTPException
import joblib
import numpy as np
import tempfile
from pathlib import Path

from voice_features import extract_features, emotion_to_score


router = APIRouter(
    prefix= "/predict_audio",
    tags = ["predict"]
)


MODEL_PATH = Path(__file__).resolve().parent / "emotion_model.pkl"

bundle = joblib.load(MODEL_PATH)
rf_model = bundle["model"]
label_encoder = bundle["label_encoder"]
feature_cols = bundle["feature_columns"]



@router.post("/")
async def predict_audio(file: UploadFile = File(...)):
    if file.content_type not in ("audio/wav", "audio/x-wav", "audio/wave"):
        raise HTTPException(status_code=400, detail="Please upload a WAV file")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    
    feats = extract_features(tmp_path)

    x =  np.array([[feats[col] for col in feature_cols]])
    
    probs = rf_model.predict_proba(x)[0]
    pred_idx = int(np.argmax(probs))
    pred_label = label_encoder.inverse_transform([pred_idx])[0]

    score = emotion_to_score(pred_label)

    return {
        "predicted_label": pred_label,
        "class_probabilities": probs.tolist(),
        "score": score
    }
