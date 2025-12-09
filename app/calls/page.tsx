"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

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

interface ProcessedCall {
  id: string;
  createdAt: string;
  severity: number; // 1–5
  dominantEmotion: EmotionKey;
  emotions: EmotionScores;
  transcriptPdfUrl: string;
  keywords: string[];
  modelNotes: string;
}

// MOCK DATA (backend will replace)
const mockCalls: ProcessedCall[] = [
  {
    id: "CALL-1024",
    createdAt: "2025-03-05 15:32",
    severity: 5,
    dominantEmotion: "fearful",
    emotions: { calm: 5, happy: 0, sad: 25, angry: 10, fearful: 70, surprised: 40, disgust: 15 },
    transcriptPdfUrl: "/pdfs/call-1024.pdf",
    keywords: ["gunshots", "screaming", "on the ground"],
    modelNotes: "High distress: strong fear signal + violent keywords.",
  },
  {
    id: "CALL-1023",
    createdAt: "2025-03-05 15:10",
    severity: 3,
    dominantEmotion: "sad",
    emotions: { calm: 20, happy: 0, sad: 55, angry: 10, fearful: 35, surprised: 10, disgust: 0 },
    transcriptPdfUrl: "/pdfs/call-1023.pdf",
    keywords: ["car accident", "bleeding"],
    modelNotes: "Moderate severity; injury reported but caller is coherent.",
  },
];

// Severity badge styles
function severityClasses(sev: number) {
  if (sev <= 2) return "bg-emerald-600/20 text-emerald-300";
  if (sev === 3) return "bg-amber-500/20 text-amber-300";
  return "bg-red-600/20 text-red-300";
}

export default function CallsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mockCalls.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q)) ||
        c.modelNotes.toLowerCase().includes(q)
    );
  }, [search]);

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
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-slate-100 px-6 py-10 flex justify-center">
      <div className="w-full max-w-6xl flex flex-col gap-6">

        {/* HEADER */}
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">
            Rutgers University • CS439
          </p>

          <h1 className="text-3xl font-bold">Processed Calls Database</h1>

          <p className="text-sm text-slate-300 max-w-2xl">
            All analyzed calls are stored here with severity rating, emotion breakdown, 
            keywords, and a downloadable transcript.
          </p>

          {/* NEW BUTTON → Go to Analyzer */}
          <Link
            href="/analyze"
            className="inline-block w-fit px-5 py-2 rounded-full bg-red-600 text-white text-sm font-semibold shadow-md hover:bg-red-500 transition"
          >
            Go to Voice Analyzer
          </Link>

          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, keywords, or notes..."
            className="w-full md:w-64 px-3 py-2 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-100"
          />
        </header>

        {/* TABLE */}
        <section className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr className="text-slate-300">
                <th className="p-3 text-left">Call ID</th>
                <th className="p-3 text-left">Date/Time</th>
                <th className="p-3 text-left">Severity</th>
                <th className="p-3 text-left">Emotion Breakdown</th>
                <th className="p-3 text-left">Transcript PDF</th>
                <th className="p-3 text-left">Keywords</th>
                <th className="p-3 text-left">Model Notes</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((call) => (
                <tr key={call.id} className="border-t border-slate-800">
                  <td className="p-3">{call.id}</td>
                  <td className="p-3">{call.createdAt}</td>

                  {/* Severity badge */}
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${severityClasses(call.severity)}`}>
                      {call.severity}/5
                    </span>
                  </td>

                  {/* Emotion bars */}
                  <td className="p-3">
                    <div className="space-y-1">
                      {emotionOrder.map((emo) => {
                        const val = call.emotions[emo];
                        if (!val) return null;
                        return (
                          <div key={emo} className="flex items-center gap-2 text-xs">
                            <span className="w-16 capitalize text-slate-300">
                              {emo}
                            </span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500"
                                style={{ width: `${val}%` }}
                              />
                            </div>
                            <span className="w-8 text-right">{val}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* PDF Link */}
                  <td className="p-3">
                    <a
                      href={call.transcriptPdfUrl}
                      target="_blank"
                      className="text-red-400 underline text-xs"
                    >
                      View PDF
                    </a>
                  </td>

                  {/* Keywords */}
                  <td className="p-3 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {call.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-1 bg-slate-800 rounded-full border border-slate-600 text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Model Notes */}
                  <td className="p-3 max-w-xs text-xs text-slate-300">
                    {call.modelNotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </div>
    </div>
  );
}
