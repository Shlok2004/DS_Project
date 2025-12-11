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

# RESAMPLING (CONSISTENT SAMPLE RATES)
def resample(audio: torch.Tensor, samp_rate: int, new_samp_rate: int=16000):
    resampler = torchaudio.transforms.Resample(samp_rate, new_samp_rate)
    return resampler(audio)

# STEREO TO MONO
def stereo_to_mono(audio: torch.Tensor):
    return torch.mean(audio, dim = 0, keepdim = True)

# ROOT MEAN SQUARE VOLUME NORMALIZATION (CONSISTENT LOUDNESS)
def normalize(audio: torch.Tensor, target_rms: float = 0.1):
    rms = torch.sqrt(torch.mean(audio**2, dim = 1, keepdim= True))
    return audio * (target_rms/(rms + 1e-8))
    

# TRIM LEADING/TRAILING SILENCE
def trim_silence(audio: torch.Tensor, threshold: float = 0.01):
    val_mask = (audio.abs() > threshold).any(dim = 0)
    if val_mask.any():
        start_sound = val_mask.nonzero(as_tuple=True)[0][0]
        end_sound = val_mask.nonzero(as_tuple=True)[0][-1] + 1
        trimmed_audio = audio[:,start_sound:end_sound]
    else:
        trimmed_audio = audio
    return trimmed_audio

# NOISE REDUCTION
def noise_reduce(audio: torch.Tensor, rate: int):
    reduced_noise = nr.reduce_noise(y = audio.numpy(), sr = rate, n_std_thresh_stationary = 1,stationary = True)
    return torch.from_numpy(reduced_noise)

# PREEMPHASIS FILTERING (MAKE QUIET SOUNDS LOUDER)
def preemphasis(audio: torch.Tensor, alpha:float = 0.97):
    emphasize = torchaudio.transforms.Preemphasis(coeff = alpha)
    return emphasize(audio)

# FREQUENCY FILTERING
def frequency_filter(audio: torch.Tensor, rate: int):
    highpassed = torchaudio.functional.highpass_biquad(audio, sample_rate=rate, cutoff_freq = 80.0)
    return torchaudio.functional.lowpass_biquad(highpassed, sample_rate=rate, cutoff_freq = 8000.0)

# RUN PIPELINE
def pipeline(audio_path, target_samp_rate: int=16000):
    # LOAD AUDIO
    audio_lib, samp_rate = librosa.load(audio_path, sr = None, mono = False)
    audio = torch.from_numpy(audio_lib)
    audio = unsqueeze_audio(audio)
    print(audio_path, audio.shape)

    resampled = resample(audio, samp_rate, target_samp_rate)
    # print(resampled.shape)
    mono_audio = stereo_to_mono(resampled)
    # print(mono_audio.shape)
    normalized_audio = normalize(mono_audio)
    # print(normalized_audio.shape)
    trimmed_audio = trim_silence(normalized_audio)
    # print(trimmed_audio.shape)
    noise_reduced_audio = noise_reduce(trimmed_audio, target_samp_rate)
    # print(noise_reduced_audio.shape)
    preemph_audio = preemphasis(noise_reduced_audio)
    # print(preemph_audio.shape)
    filtered_audio = frequency_filter(preemph_audio, target_samp_rate)
    print(audio_path, filtered_audio.shape)

    return filtered_audio