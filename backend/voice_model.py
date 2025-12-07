import pandas as pd
import numpy as np
from pathlib import Path
import librosa 
from tqdm import tqdm
import os

DATA_DIR = Path("backend/1")
modality_map = {
    "01": "full-AV",
    "02": "video-only",
    "03": "audio-only"
}




emotion_map = {
 "01": "neutral",
 "02": "calm",
 "03": "happy",
 "04": "sad",
 "05": "angry",
 "06": "fearful",
 "07": "disgust",
 "08": "surprised",   
}

intensity_map = {
    "01": "normal",
    "02": "strong"
}


statement_map = {
    "01": "Kids are talking by the door",
    "02": "Dogs are sitting by the door"
}

def gender_from_actor(actor_id: str) -> str:
    return "male" if int(actor_id) % 2 == 1 else "female"

rows = []

for wav_path in DATA_DIR.rglob("*.wav"):
    parts = wav_path.stem.split("-")
    if len(parts) != 7:
        print("Unexpected filename", wav_path.name)
        continue

    modality, channel, emotion_id, intensity_id, statement_id, repetition_id, actor_id = parts

    rows.append({
      "path": str(wav_path),
      "modality": modality_map[modality],
      "channel": channel,
      "emotion_id": emotion_id,
      "emotion": emotion_map[emotion_id],
      "intensity_id": intensity_id,
      "intensity": intensity_map[intensity_id],
      "statement_id": statement_id,
      "statement": statement_map[statement_id],
      "repetition": repetition_id,
      "actor_id": actor_id,
      "gender": gender_from_actor(actor_id),  
    })

df = pd.DataFrame(rows)
df['audio_category'] = (df['emotion'] + "_" + df["gender"]).astype("category")
print(df["audio_category"].nunique())  # should be <= 16

print(df)


###FEATURE EXTRACTION####

def extract_features(
    file_path,
    sr=22050,
    n_mfcc=20,
    fmin=50,
    fmax=600
):
    
    y, sr = librosa.load(file_path, sr=sr)

    if len(y) < 2:
        raise ValueError(f"Audio too short: {file_path}")
    features = {}

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    mfcc_mean = mfcc.mean(axis=1)
    mfcc_std = mfcc.std(axis=1)

    for i in range(n_mfcc):
        features[f"mfcc_mean_{i+1}"] = float(mfcc_mean[i])
        features[f"mfcc_std_{i+1}"] = float(mfcc_std[i])


    rms = librosa.feature.rms(y=y)[0]
    features["rms_mean"] = float(rms.mean())
    features["rms_std"] = float(rms.std())
    features["rms_max"] = float(rms.max())
    features["rms_range"] = float(rms.max() - rms.min())

    f0 = librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr)
    # YIN returns np.nan for unvoiced frames
    voiced = ~np.isnan(f0)
    voiced_f0 = f0[voiced]

    if voiced_f0.size > 0:
        features["pitch_mean"] = float(voiced_f0.mean())
        features["pitch_std"] = float(voiced_f0.std())
        features["pitch_min"] = float(voiced_f0.min())
        features["pitch_max"] = float(voiced_f0.max())
        features["pitch_25"] = float(np.percentile(voiced_f0, 25))
        features["pitch_75"] = float(np.percentile(voiced_f0, 75))
        features["pitch_range"] = float(voiced_f0.max() - voiced_f0.min())
        features["pitch_voiced_ratio"] = float(voiced_f0.size / f0.size)
    else:
        # If no voiced frames detected, set to 0 or some sentinel
        features["pitch_mean"] = 0.0
        features["pitch_std"] = 0.0
        features["pitch_min"] = 0.0
        features["pitch_max"] = 0.0
        features["pitch_25"] = 0.0
        features["pitch_75"] = 0.0
        features["pitch_range"] = 0.0
        features["pitch_voiced_ratio"] = 0.0

    spec_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spec_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
    spec_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)[0]
    spec_flatness = librosa.feature.spectral_flatness(y=y)[0]

    features["spec_centroid_mean"] = float(spec_centroid.mean())
    features["spec_centroid_std"] = float(spec_centroid.std())
    features["spec_bandwidth_mean"] = float(spec_bandwidth.mean())
    features["spec_bandwidth_std"] = float(spec_bandwidth.std())
    features["spec_rolloff_mean"] = float(spec_rolloff.mean())
    features["spec_flatness_mean"] = float(spec_flatness.mean())

    return features

DATA_DIR = Path("backend/processed")
file_paths = sorted(DATA_DIR.glob("*.wav"))
print(len(file_paths))

def parse_label_from_filename(path):
    fname = os.path.basename(str(path))
    parts = fname.split(".")[0].split("-")

    emotion_code = parts[2]
    intensity_code = parts[3]

    emotion_map = {
        "01": "neutral",
        "02": "calm",
        "03": "happy",
        "04": "sad",
        "05": "angry",
        "06": "fearful",
        "07": "disgust",
        "08": "surprised"
    }

    intensity_map = {
        "01": "normal",
        "02": "strong"
    }
    
    emotion = emotion_map[emotion_code]
    intensity = intensity_map[intensity_code]

    return f"{intensity}_{emotion}"

y_labels = [parse_label_from_filename(fp) for fp in file_paths]
rows = []

for path, y in tqdm(zip(file_paths, y_labels), total=len(file_paths)):
    feats = extract_features(path)
    feats["label"] = y
    rows.append(feats)

df = pd.DataFrame(rows)
print(df.shape)


####TRAINING THE MODEL####
X = df.drop(columns = ["label"])
y = df["label"]

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import label_binarize
from sklearn.metrics import roc_auc_score

le = LabelEncoder()
y_encoded = le.fit_transform(y)
classes = le.classes_
y_bin = label_binarize(y_encoded, classes=range(len(classes)))

rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=None,
    random_state=42,
    n_jobs=-1
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, 
    test_size = 0.2,
    random_state=42,
    stratify=y_encoded
)

kf = StratifiedKFold(n_splits = 5, shuffle = True, random_state=42)
auc_scores = []

for train_idx, val_idx in kf.split(X_train, y_train):
    X_tr, X_val= X_train.iloc[train_idx], X_train.iloc[val_idx]
    y_tr, y_val = y_train[train_idx], y_train[val_idx]

    rf.fit(X_tr, y_tr)
    y_val_prob = rf.predict_proba(X_val)

    y_val_bin = label_binarize(y_val, classes=range(len(classes)))

    auc = roc_auc_score(y_val_bin, y_val_prob, multi_class="ovo", average="macro")
    auc_scores.append(auc)

print("AUC scores per fold:", auc_scores)
print("Mean AUC:", np.mean(auc_scores))
print("Std AUC:", np.std(auc_scores))

rf.fit(X_train, y_train)
y_test_prob = rf.predict_proba(X_test)

y_test_bin = label_binarize(y_test, classes=range(len(classes)))
test_auc = roc_auc_score(y_test_bin, y_test_prob, multi_class="ovo", average="macro")
print("Final Test AUC:", test_auc)


import joblib
bundle = {
    "model": rf,
    "label_encoder": le,
    "feature_columns": X.columns.tolist()
}

joblib.dump(bundle, "backend/emotion_model.pkl")
print("Saved model → emotion_model.pkl")