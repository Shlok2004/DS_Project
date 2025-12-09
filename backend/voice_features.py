import numpy as np
import librosa

def extract_features(
    file_path,
    sr=22050,
    n_mfcc=20,
    fmin=50,
    fmax=600,
    max_duration=5.0
):
    
    y, sr = librosa.load(file_path, sr=sr)

    max_len  = int(sr * max_duration)
    y = y[:max_len]


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

def emotion_to_score(label: str) -> float:
    intensity, emotion = label.split("_", 1)

    base_map = {
        "neutral": 1.0,
        "calm": 1.2,
        "happy": 1.5,
        "surprised": 2.0,
        "sad": 3.5,
        "fearful": 4.0,
        "angry": 4.5,
        "disgust": 4.7,
    }

    base = base_map.get(emotion, 3.0)
    mult = 1.0 if intensity == "normal" else 1.2

    return round(min(5.0, max(1.0, base * mult)), 2)