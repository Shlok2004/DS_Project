import os
import numpy as np
import librosa
import noisereduce as nr
import soundfile as sf
from scipy.signal import butter, filtfilt
import kagglehub

# Optional: download RAVDESS once via kagglehub
# path = kagglehub.dataset_download("uwrfkaggler/ravdess-emotional-speech-audio")
# print("Path to dataset files:", path)

TARGET_SR = 16000


# 1. LOAD + RESAMPLE + MONO
def load_audio(path: str, target_sr: int = TARGET_SR):
    """
    Load audio, convert to mono, and resample to target_sr.
    """
    # sr=None = keep original; we'll resample ourselves
    y, sr = librosa.load(path, sr=None, mono=False)

    # If stereo -> average channels to mono
    if y.ndim == 2:
        y = np.mean(y, axis=0)

    # Resample if needed
    if sr != target_sr:
        y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    return y, sr


# 2. RMS NORMALIZATION
def rms_normalize(y: np.ndarray, target_rms: float = 0.1):
    """
    Normalize signal to a target RMS level.
    """
    rms = np.sqrt(np.mean(y ** 2))
    if rms < 1e-8:
        return y
    return y * (target_rms / rms)


# 3. TRIM LEADING/TRAILING SILENCE
def trim_silence(y: np.ndarray, top_db: float = 30.0):
    """
    Trim leading and trailing silence using librosa.
    """
    trimmed, _ = librosa.effects.trim(y, top_db=top_db)
    return trimmed


# 4. NOISE REDUCTION
def noise_reduce(y: np.ndarray, sr: int):
    """
    Reduce stationary background noise.
    """
    return nr.reduce_noise(
        y=y,
        sr=sr,
        n_std_thresh_stationary=1.0,
        stationary=True
    )


# 5. PREEMPHASIS FILTERING
def preemphasis(y: np.ndarray, alpha: float = 0.97):
    """
    Apply pre-emphasis filter: y[n] - alpha * y[n-1]
    """
    # Simple difference equation
    return np.append(y[0], y[1:] - alpha * y[:-1])


# 6. FREQUENCY FILTERING (band-pass 80Hz–8000Hz)

def bandpass_filter(
    y: np.ndarray,
    sr: int,
    lowcut: float = 80.0,
    highcut: float = None,
    order: int = 4,
):
    """
    Apply a Butterworth band-pass filter.
    Ensures 0 < Wn < 1 for scipy.signal.butter.
    """
    nyq = 0.5 * sr

    # If no highcut given, pick something safely below Nyquist
    if highcut is None:
        highcut = 0.45 * sr  # e.g., 0.45 * 16000 = 7200 Hz

    # Normalize
    low = lowcut / nyq
    high = highcut / nyq

    # Clamp to (0, 1)
    low = max(low, 1e-5)
    high = min(high, 0.999)

    # Make sure low < high
    if not (0 < low < high < 1):
        raise ValueError(f"Invalid bandpass frequencies: low={low}, high={high}, sr={sr}")

    b, a = butter(order, [low, high], btype="band")
    return filtfilt(b, a, y)


# PIPELINE
def pipeline(audio_path: str, target_sr: int = TARGET_SR) -> tuple[np.ndarray, int]:
    # 1) Load + mono + resample
    y, sr = load_audio(audio_path, target_sr)

    # 2) RMS normalize
    y = rms_normalize(y)

    # 3) Trim silence
    y = trim_silence(y)

    # 4) Noise reduction
    y = noise_reduce(y, sr)

    # 5) Pre-emphasis
    y = preemphasis(y)

    # 6) Band-pass filter
    y = bandpass_filter(y, sr)

    return y, sr


def main():
    raw_dir = "backend/1"
    processed_dir = "backend/processed"
    os.makedirs(processed_dir, exist_ok=True)

    for root, dirs, files in os.walk(raw_dir):
        for file in files:
            if not file.lower().endswith(".wav"):
                continue

            in_path = os.path.join(root, file)
            print("Processing:", in_path)

            y_proc, sr = pipeline(in_path, TARGET_SR)

            # Output filename
            out_path = os.path.join(processed_dir, file)
            sf.write(out_path, y_proc, sr)
            print(f"Processed: {in_path} -> {out_path}, length: {len(y_proc)/sr:.2f}s")


if __name__ == "__main__":
    main()
