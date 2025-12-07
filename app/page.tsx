//Author @Shlok Parekh

"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl text-center flex flex-col items-center gap-6">
        
        {/* TITLE */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Emergency Distress Detection System
        </h1>

        {/* DESCRIPTION */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          This project uses machine learning to analyze audio from 911 calls, 
          detecting emotional intensity, identifying key emergency-related keywords, 
          and generating a unified distress severity score. Dispatchers and emergency 
          responders can use this system to quickly prioritize the most critical calls 
          during high-volume situations.
        </p>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
          Upload any audio snippet in the Voice Analyzer to preview how the model 
          interprets emotion, tone, severity, and transcript data in real time.
        </p>

        {/* BUTTON */}
        <Link
          href="/analyze"
          className="
            mt-4 px-6 py-3 rounded-full 
            bg-orange-500 text-slate-950 
            font-semibold text-sm sm:text-base
            shadow-lg hover:-translate-y-1 hover:bg-orange-400
            transition-transform
          "
        >
          Go to Voice Analyzer
        </Link>

        {/* Footer / Subtext */}
        <div className="mt-6 text-xs text-slate-500">
          CS439 – Data Science Project • Rutgers University
        </div>
      </div>
    </main>
  );
}
