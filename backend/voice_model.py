import pandas as pd
import numpy as np
from pathlib import Path
import librosa 
from tqdm import tqdm
import os
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import label_binarize
from sklearn.metrics import roc_auc_score
from sklearn.metrics import roc_curve, auc

from voice_features import extract_features, emotion_to_score


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



if __name__ == "__main__":
    print(">> TRAINING VOICE MODEL.... ")
    DATA_DIR = Path("backend/processed")
    file_paths = sorted(DATA_DIR.glob("*.wav"))

    y_labels = [parse_label_from_filename(fp) for fp in file_paths]
    rows = []

    for path, y in tqdm(zip(file_paths, y_labels), total=len(file_paths)):
        feats = extract_features(path)
        feats["label"] = y
        rows.append(feats)

    df = pd.DataFrame(rows)
    X = df.drop(columns = ["label"])
    y = df["label"]


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

        fold_auc = roc_auc_score(y_val_bin, y_val_prob, multi_class="ovo", average="macro")
        auc_scores.append(fold_auc)

    print("AUC scores per fold:", auc_scores)
    print("Mean AUC:", np.mean(auc_scores))
    print("Standard Deviation of AUC:", np.std(auc_scores))

    rf.fit(X_train, y_train)
    y_test_prob = rf.predict_proba(X_test)
    import seaborn as sns

    # Convert probabilities to a DataFrame for easier plotting
    prob_df = pd.DataFrame(y_test_prob, columns=classes)

    plt.figure(figsize=(12, 6))
    sns.heatmap(prob_df.iloc[:50], cmap="viridis", annot=False)
    plt.title("Heatmap of Predicted Probabilities (First 50 Samples)")
    plt.xlabel("Emotion Class")
    plt.ylabel("Sample Index")
    plt.tight_layout()
    plt.show()  

    y_test_bin = label_binarize(y_test, classes=range(len(classes)))
    test_auc = roc_auc_score(y_test_bin, y_test_prob, multi_class="ovo", average="macro")
    print("Final Test AUC:", test_auc)

    fpr = {}
    tpr = {}
    roc_auc = {}

    n_classes = len(classes)

    for i in range(n_classes):
        fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_test_prob[:, i])
        if len(fpr[i]) == 0 or len(tpr[i]) == 0:
            print(f"Skipping class '{classes[i]}' — no positive samples in test set.")
            continue
        roc_auc[i] = auc(fpr[i], tpr[i])

    plt.figure(figsize=(10, 7))

    for i in range(n_classes):
        plt.plot(
            fpr[i],
            tpr[i],
            label=f"Class {classes[i]} (AUC = {roc_auc[i]:.3f})"
    )

    plt.plot([0, 1], [0, 1], "k--", label="Random Guess")

    plt.title("Multi-Class ROC Curve (One-vs-Rest)")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.legend(loc="lower right")
    plt.grid(True)
    plt.tight_layout()
    plt.show()

    bundle = {
        "model": rf,
        "label_encoder": le,
        "feature_columns": X.columns.tolist()
    }

    joblib.dump(bundle, "backend/emotion_model.pkl")
    print("Saved model → emotion_model.pkl")