"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-slate-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl text-center flex flex-col items-center gap-6">

        <p className="text-xs uppercase tracking-[0.2em] text-red-400">
          Rutgers University • CS439
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Emergency Distress Detection System
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          This project analyzes 911-call audio using machine learning to detect 
          emotional intensity, identify emergency-related keywords, generate a 
          severity rating, and help responders triage calls more effectively.
        </p>

        {/* Go to Analyzer */}
        <Link
          href="/analyze"
          className="mt-2 px-6 py-3 rounded-full bg-red-600 text-white font-semibold text-base shadow-lg hover:bg-red-500 hover:-translate-y-1 transition-transform"
        >
          Go to Voice Analyzer
        </Link>

        {/* Go to Processed Calls Database */}
        <Link
          href="/calls"
          className="px-6 py-3 rounded-full bg-slate-800 text-white font-semibold text-base shadow-lg hover:bg-slate-700 hover:-translate-y-1 transition-transform"
        >
          View Processed Calls Database
        </Link>

        <div className="mt-6 text-xs text-slate-500">
          CS439 • Data Science Project • Spring 2025
        </div>
      </div>
    </main>
  );
}
