"use client";

import React, { useState } from "react";

// Types so backend can mirror this shape easily
type EmotionKey =
  | "calm"
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "surprised"
  | "disgust";

interface EmotionScores {
  [key: string]: number;
}

interface AnalysisResult {
  severity: number; // 0–100
  transcript: string;
  emotions: EmotionScores;
  keywords: string[];
  modelNotes: string;
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);

    // TODO (backend): replace this with real API call
    setTimeout(() => {
      const mock: AnalysisResult = {
        severity: 87,
        transcript:
          "There were several gunshots outside my apartment, people are screaming and someone is on the ground. Please send help quickly.",
        emotions: {
          calm: 5,
          happy: 0,
          sad: 25,
          angry: 10,
          fearful: 70,
          surprised: 40,
          disgust: 15,
        },
        keywords: ["gunshots", "screaming", "on the ground", "send help"],
        modelNotes:
          "High severity driven by strong fear signal, rapid speech segments, and violent keywords like 'gunshots'.",
      };

      setResult(mock);
      setIsAnalyzing(false);
    }, 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const severityColor = (value: number) => {
    if (value >= 80) return "text-red-500";
    if (value >= 50) return "text-amber-300";
    return "text-emerald-400";
  };

  const severityLabel = (value: number) => {
    if (value >= 80) return "Critical";
    if (value >= 50) return "Elevated";
    return "Low";
  };

  const emotionLabelOrder: EmotionKey[] = [
    "calm",
    "happy",
    "sad",
    "angry",
    "fearful",
    "surprised",
    "disgust",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-slate-50 flex items-stretch justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-red-400 mb-1">
              Rutgers University • CS 439
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50">
              Audio Analysis &amp; Distress Scoring
            </h1>
            <p className="text-sm sm:text-base text-slate-200 mt-2 max-w-2xl leading-relaxed">
              Upload a 911 call snippet to see the model&apos;s estimated
              severity, emotion breakdown, transcript, and key trigger words.
              This interface will later connect to Whisper and your distress
              scoring model.
            </p>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-5">
          {/* LEFT: Upload + Severity */}
          <section className="bg-slate-950/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            {/* Upload box */}
            <div className="border border-dashed border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center bg-slate-900/70">
              <p className="text-sm text-slate-200 mb-3">
                Drag &amp; drop an audio file here, or click to browse
              </p>

              <label className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-full bg-red-600 text-white cursor-pointer hover:bg-red-500 transition">
                Choose file
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <p className="mt-3 text-xs text-slate-200">
                  Selected: <span className="font-semibold">{file.name}</span>
                </p>
              )}
            </div>

            {/* Audio preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-[0.16em]">
                  Audio Preview
                </span>
                <span className="text-[0.7rem] text-slate-400">
                  {file ? "00:42 (example)" : "No file selected"}
                </span>
              </div>

              {/* waveform placeholder */}
              <div className="h-16 rounded-lg bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-slate-900/40 animate-pulse" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  disabled={!file || isAnalyzing}
                  className={`px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 transition ${
                    file && !isAnalyzing
                      ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    // Placeholder: backend can attach an HTMLAudioElement here later.
                  }}
                >
                  ▶ Play (UI only)
                </button>

                <button
                  disabled={!file || isAnalyzing}
                  onClick={handleAnalyze}
                  className={`px-4 py-1.5 rounded-full font-semibold flex items-center gap-2 shadow-lg transition ${
                    file && !isAnalyzing
                      ? "bg-red-600 text-white hover:bg-red-500 hover:-translate-y-[1px]"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="h-3 w-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    "Analyze Audio"
                  )}
                </button>
              </div>
            </div>

            {/* Severity gauge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-[0.16em]">
                  Overall Severity
                </span>
                <span className="text-[0.7rem] text-slate-400">
                  0 = low, 100 = critical
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-300">
                  {result ? severityLabel(result.severity) : "N/A"}
                </span>
                <span
                  className={`text-2xl font-bold ${
                    result ? severityColor(result.severity) : "text-slate-500"
                  }`}
                >
                  {result ? result.severity : "--"}
                </span>
              </div>

              {/* bar */}
              <div className="mt-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500 transition-all"
                  style={{ width: `${result ? result.severity : 0}%` }}
                />
              </div>
            </div>
          </section>

          {/* RIGHT: Emotions + transcript + keywords */}
          <section className="bg-slate-950/95 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 text-sm overflow-y-auto">
            {/* Emotion breakdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xs font-semibold mb-2 text-red-400 uppercase tracking-[0.18em]">
                Emotion Breakdown
              </h2>
              {result ? (
                <div className="space-y-2">
                  {emotionLabelOrder.map((key) => {
                    const val = result.emotions[key] ?? 0;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-20 capitalize text-slate-100">
                          {key}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-slate-300">
                          {val}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  No analysis yet. Upload audio and click{" "}
                  <span className="font-semibold">Analyze Audio</span>.
                </p>
              )}
            </div>

            {/* Transcript */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xs font-semibold mb-2 text-red-400 uppercase tracking-[0.18em]">
                Transcript (Whisper)
              </h2>
              <p className="text-xs sm:text-[0.82rem] text-slate-100 leading-relaxed whitespace-pre-wrap">
                {result
                  ? result.transcript
                  : "Transcript will appear here after analysis. Backend can plug in Whisper output directly into this field."}
              </p>
            </div>

            {/* Keywords */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xs font-semibold mb-2 text-red-400 uppercase tracking-[0.18em]">
                Key Triggers
              </h2>
              {result && result.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((kw, i) => {
                    const isDanger = /gun|blood|bleeding|shoot|knife|unconscious|fire|explosion/i.test(
                      kw
                    );
                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center rounded-full border px-3 py-[3px] text-xs ${
                          isDanger
                            ? "border-red-500 text-red-300 bg-red-500/10"
                            : "border-slate-700 text-slate-100 bg-slate-800"
                        }`}
                      >
                        {kw}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  Detected keywords and phrases will appear here.
                </p>
              )}
            </div>

            {/* Model notes */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xs font-semibold mb-2 text-red-400 uppercase tracking-[0.18em]">
                Model Notes
              </h2>
              <p className="text-xs sm:text-[0.82rem] text-slate-100 leading-relaxed">
                {result
                  ? result.modelNotes
                  : "Once backend is wired, this section can summarize why the model assigned a given severity score (for example, high fear probability combined with critical keywords and short time span)."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
