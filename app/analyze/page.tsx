"use client";

import Link from "next/link";
import React, { useState } from "react";

// Types
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
  severity: number;
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

    // MOCK FOR DEMO – backend will replace this.
    setTimeout(() => {
      setResult({
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
          "High severity due to fear emotion, rapid speech, and violent keywords.",
      });
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

  const severityLabel = (v: number) =>
    v >= 80 ? "Critical" : v >= 50 ? "Elevated" : "Low";

  const severityColor = (v: number) =>
    v >= 80
      ? "text-red-500"
      : v >= 50
      ? "text-amber-300"
      : "text-emerald-300";

  const emotionOrder: EmotionKey[] = [
    "calm",
    "happy",
    "sad",
    "angry",
    "fearful",
    "surprised",
    "disgust",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-slate-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">

        {/* HEADER */}
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">
            Rutgers University • CS439
          </p>

          <h1 className="text-3xl font-bold">Audio Analysis</h1>

          <p className="text-sm text-slate-300 max-w-2xl">
            Upload a 911 call snippet to see severity scoring, emotion breakdown, 
            key triggers, and transcript details. Backend will connect Whisper 
            + our ML distress model here.
          </p>

          {/* NEW BUTTON → Calls Database */}
          <Link
            href="/calls"
            className="inline-block w-fit px-5 py-2 rounded-full bg-slate-800 text-white text-sm font-semibold shadow-md hover:bg-slate-700 transition"
          >
            View Processed Calls Database
          </Link>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-5">

          {/* LEFT PANEL */}
          <section className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">

            {/* UPLOAD */}
            <div className="border border-dashed border-slate-700 rounded-xl p-5 flex flex-col items-center bg-slate-900/70">
              <p className="text-sm text-slate-200 mb-3">
                Drag & drop audio here or click to browse
              </p>

              <label className="px-5 py-2 bg-red-600 rounded-full text-white cursor-pointer font-semibold hover:bg-red-500 transition">
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

            {/* AUDIO PREVIEW */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-slate-300 mb-1">
                Audio Preview
              </h3>

              <div className="h-16 bg-slate-800 rounded-lg animate-pulse" />

              {/* ACTION BUTTONS */}
              <div className="flex justify-between mt-3 text-xs">
                <button
                  disabled={!file}
                  className={`px-3 py-1 rounded-full font-semibold ${
                    file
                      ? "bg-slate-100 text-black"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  ▶ Play (UI only)
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className={`px-4 py-1 rounded-full font-semibold ${
                    file && !isAnalyzing
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isAnalyzing ? "Analyzing…" : "Analyze Audio"}
                </button>
              </div>
            </div>

            {/* SEVERITY */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-slate-300 mb-1">
                Overall Severity
              </h3>

              <p className={`text-2xl font-bold ${result ? severityColor(result.severity) : "text-slate-500"}`}>
                {result ? result.severity : "--"}
              </p>

              <p className="text-sm">{result ? severityLabel(result.severity) : "N/A"}</p>

              <div className="h-3 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500"
                  style={{ width: `${result ? result.severity : 0}%` }}
                />
              </div>
            </div>

          </section>

          {/* RIGHT PANEL */}
          <section className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">

            {/* EMOTION BREAKDOWN */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
                Emotion Breakdown
              </h3>

              {!result ? (
                <p className="text-xs text-slate-300">No analysis yet.</p>
              ) : (
                emotionOrder.map((emo) => {
                  const val = result.emotions[emo];
                  if (!val) return null;

                  return (
                    <div key={emo} className="flex items-center gap-2 text-xs mb-1">
                      <span className="w-20 capitalize">{emo}</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-400">{val}%</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* TRANSCRIPT */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
                Transcript (Whisper)
              </h3>

              <p className="text-sm text-slate-100">
                {result ? result.transcript : "Transcript will appear here after analysis."}
              </p>
            </div>

            {/* KEYWORDS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
                Key Triggers
              </h3>

              {!result ? (
                <p className="text-xs text-slate-300">No keywords found yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-1 bg-slate-800 rounded-full border border-slate-600 text-xs"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* MODEL NOTES */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
                Model Notes
              </h3>

              <p className="text-sm text-slate-100">
                {result ? result.modelNotes : "Model notes will appear here after analysis."}
              </p>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}
