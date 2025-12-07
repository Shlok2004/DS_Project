import os
import torchaudio
import torch
import noisereduce as nr
import librosa
import kagglehub

# DOWNLOAD RAVDESS DATASET FROM KAGGLE
path = kagglehub.dataset_download("uwrfkaggler/ravdess-emotional-speech-audio")
print("Path to dataset files:", path)
# Path to dataset files: C:\Users\Hessie\.cache\kagglehub\datasets\uwrfkaggler\ravdess-emotional-speech-audio\versions\1

# UNSQUEEZE FOR CORRECT DIMENSIONS
def unsqueeze_audio(audio: torch.Tensor):
    if audio.dim() == 1:
        audio = audio.unsqueeze(0)
    return audio

# 1. RESAMPLING (Unify Sample Rates)
def resample(audio: torch.Tensor, samp_rate: int, new_samp_rate: int=16000):
    resampler = torchaudio.transforms.Resample(samp_rate, new_samp_rate)
    samp_rate_16 = resampler(audio)
    return samp_rate_16

# 2. STEREO TO MONO
def stereo_to_mono(audio: torch.Tensor):
    mono_audio = torch.mean(audio, dim=0, keepdim=True)
    return mono_audio

# 3. ROOT MEAN SQUARE VOLUME NORMALIZATION (Make Loudness More Consistent)
def normalize(audio: torch.Tensor, target_rms: float=0.1):
    rms = torch.sqrt(torch.mean(audio**2, dim=1, keepdim=True))
    normalized_audio = audio * (target_rms/(rms+1e-8))
    return normalized_audio

# 4. TRIM LEADING/TRAILING SILENCE
def trim_silence(audio: torch.Tensor, threshold: float=0.01):
    val_mask = (audio.abs() > threshold).any(dim=0)
    if val_mask.any():
        start_sound = val_mask.nonzero(as_tuple=True)[0][0]
        end_sound = val_mask.nonzero(as_tuple=True)[0][-1] + 1
        trimmed_audio = audio[:,start_sound:end_sound]
    else:
        trimmed_audio = audio
    return trimmed_audio

# 5. NOISE REDUCTION (Reduce Background Noise)
def noise_reduce(audio: torch.Tensor, rate: int):
    reduced_noise = nr.reduce_noise(y = audio.numpy(), sr=rate, n_std_thresh_stationary=1,stationary=True)
    return torch.from_numpy(reduced_noise)

# 6. PREEMPHASIS FILTERING (Make Quieter Sounds Stronger)
def preemphasis(audio: torch.Tensor, alpha:float=0.97):
    emphasize = torchaudio.transforms.Preemphasis(coeff=alpha)
    preemph_audio = emphasize(audio)
    return preemph_audio

# 7. VOICE ACTIVITY DETECTION (Detect Speech, Remove Everything Else)
def voice_act_detect(audio: torch.Tensor, rate: int):
    vad = torchaudio.transforms.Vad(sample_rate=rate)
    speech_segments = vad(audio)
    return speech_segments


# 8. FREQUENCY FILTERING
def frequency_filter(audio: torch.Tensor, rate: int):
    highpassed = torchaudio.functional.highpass_biquad(audio, sample_rate=rate, cutoff_freq=80.0)
    lowpassed = torchaudio.functional.lowpass_biquad(highpassed, sample_rate=rate, cutoff_freq=8000.0)
    return lowpassed

# 9. DATA AUGMENTATION (Add Background Noise, Change Pitch, Speed, etc. to Mimic Real World Recordings)


# 10. FEATURE EXTRACTION (ex. MFCCs, Mel Spectrograms)


# RUN PIPELINE
def pipeline(audio_path, target_samp_rate: int=16000):
    # LOAD AUDIO
    audio_lib, samp_rate = librosa.load(audio_path, sr=None, mono=False)
    audio = torch.from_numpy(audio_lib)

    # UNSQUEEZE
    audio = unsqueeze_audio(audio)
    print(audio_path, audio.shape)

    # RESAMPLE
    resampled = resample(audio, samp_rate, target_samp_rate)
    # print(resampled.shape)

    # MAKE MONO
    mono_audio = stereo_to_mono(resampled)
    # print(mono_audio.shape)

    # NORMALIZE
    normalized_audio = normalize(mono_audio)
    # print(normalized_audio.shape)

    # TRIM SILENCE
    trimmed_audio = trim_silence(normalized_audio)
    # print(trimmed_audio.shape)

    # NOISE REDUCTION
    noise_reduced_audio = noise_reduce(trimmed_audio, target_samp_rate)
    # print(noise_reduced_audio.shape)

    # PREEMPHASIS
    preemph_audio = preemphasis(noise_reduced_audio)
    # print(preemph_audio.shape)

    # # VOICE ACTIVITY DETECTION
    # vad_audio = voice_act_detect(preemph_audio, target_samp_rate)
    # # print(vad_audio.shape)

    # FREQUENCY FILTERING
    filtered_audio = frequency_filter(preemph_audio, target_samp_rate)
    print(audio_path, filtered_audio.shape)

    # RETURN
    return filtered_audio

def main():
    for file in os.listdir("backend/raw"):
        target_samp_rate = 16000
        path = os.path.join("backend/raw", file)
        processed = pipeline(path, target_samp_rate)

        # SAVE
        print(processed.shape)
        torchaudio.save(os.path.join("backend/processed", file), processed, target_samp_rate)

main()