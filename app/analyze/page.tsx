"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [contextSev, setContextSev] = useState<number | null>(null);
  const [emotionSev, setEmotionSev] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [keyDetails, setKeyDetails] = useState<KeyDetails | null>(null);
  const [emotions, setEmotions] = useState<string | null>(null);

  interface KeyDetails {
    event: string;
    injuries: string;
    ongoing_threat: string;
    victims: number;
    weapon: string;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setAudioPath(URL.createObjectURL(selected));
    }
  };

  async function analyze() {
    if (!file) {
      console.log("No file given.")
    }
    else {
      setProcessing(true);
      const audioForm = new FormData();
      audioForm.append('audio', file);
      // CONFLICT SEVERITY
      console.log(process.env.NEXT_PUBLIC_API_URL + "/agent/generate_json");
      const resConSev = await fetch(process.env.NEXT_PUBLIC_API_URL + "/agent/generate_json", {
        method: 'POST',
        body: audioForm
      })
      const conSevJSON = await resConSev.json();
      console.log(conSevJSON);
      setContextSev(conSevJSON.severity_score);
      setTranscript(conSevJSON.transcript);
      setKeyDetails(conSevJSON.triage_data);
      // EMOTIONAL SEVERITY
      const resEmoSev = await fetch(process.env.NEXT_PUBLIC_API_URL + "/predict_audio", {
        method: 'POST',
        body: audioForm
      })
      const emoSevJSON = await resEmoSev.json();
      setEmotionSev(emoSevJSON.score);
      setEmotions(emoSevJSON.predicted_label);
      console.log(emoSevJSON);
      // PUSH RECORD TO DATABASE
      const record = {
        emotional_sev: emoSevJSON.score,
        context_sev: conSevJSON.severity_score,
        transcript: conSevJSON.transcript,
        key_details: conSevJSON.triage_data,
        is_active: true,
        emotions: emoSevJSON.predicted_label,
      }
      const resSB = await fetch(process.env.NEXT_PUBLIC_API_URL + "/supabase", {
        method: 'POST',
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify(record),
      })
      console.log(resSB);
      // console.log(contextSev, emotionSev, transcript, keyDetails, emotions);
      setProcessing(false);
    }
  }

  React.useEffect(() => {
    return () => {
      if (audioPath)
        URL.revokeObjectURL(audioPath);
    };
  }, [audioPath]);

  console.log("ENV TEST:", process.env.NEXT_PUBLIC_API_URL);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-slate-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">

        {/* HEADER */}
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">
            Rutgers University • CS439
          </p>
          <div>
            Public: {process.env.NEXT_PUBLIC_API_URL}
          </div>
          <h1 className="text-3xl font-bold">Audio Analysis</h1>

          <p className="text-sm text-slate-300 max-w-2xl">
            Upload a call snippet to see emotional and context severity, a transcript and key information about the call.
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
                  name="uploadAudio"
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

              <div className="h-16 flex items-center justify-center">
                {audioPath ? (
                  <audio
                    className="w-full"
                    key={audioPath}
                    src={audioPath}
                    controls
                  >
                    Invalid audio file.
                  </audio>
                ) : (
                  <p className="text-sm text-slate-500">
                    Select an audio file to view player.
                  </p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-center mt-3 text-xs">

                <button
                  onClick={analyze}
                  disabled={!file || processing}
                  className={`px-4 py-1 rounded-full font-semibold ${file && !processing
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "bg-slate-800 text-slate-500"
                    }`}
                >
                  {processing ? "Analyzing…" : "Analyze Audio"}
                </button>
              </div>
            </div>

            {/* SEVERITY */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-slate-300 mb-1">
                Overall Severity (Out of 10)
              </h3>
              <p className="text-9xl font-bold">
                {contextSev !== null && emotionSev !== null ? contextSev + emotionSev : "_____"}
              </p>
              <div className="h-3 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500"
                />
              </div>
            </div>

          </section>

          {/* CONTEXT SEVERITY */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
              Context Severity (Out of 5)
            </h3>
            <p className="text-9xl font-bold">
              {contextSev !== null ? contextSev : "_____"}
            </p>
          </div>

          {/* EMOTIONS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
              Predicted Emotion
            </h3>
            <p className="text-9xl font-bold">
              {emotions !== null ? emotions : "_____"}
            </p>
          </div>

          {/* EMOTIONAL SEVERITY */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
              Audible Emotional Severity (Out of 5)
            </h3>
            <p className="text-9xl font-bold">
              {emotionSev !== null ? emotionSev : "_____"}
            </p>
          </div>

          {/* TRANSCRIPT */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
              Transcript
            </h3>
            <p className="text-9xl font-bold">
              {transcript !== null ? transcript : "_____"}
            </p>
            <p className="text-sm text-slate-100">
            </p>
          </div>

          {/* KEYWORDS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-[0.16em] text-red-400 mb-2">
              Key Information
            </h3>
            {keyDetails ? (
              <div className="flex flex-row justify-around">
                <div className="flex flex-col">
                  <h1>EVENT</h1>
                  <p>{keyDetails.event}</p>
                </div>
                <div className="flex flex-col">
                  <h1>INJURIES</h1>
                  <p>{keyDetails.injuries}</p>
                </div>
                <div className="flex flex-col">
                  <h1>ONGOING?</h1>
                  <p>{keyDetails.ongoing_threat}</p>
                </div>
                <div className="flex flex-col">
                  <h1>VICTIMS</h1>
                  <p>{keyDetails.victims}</p>
                </div>
                <div className="flex flex-col">
                  <h1>WEAPONS</h1>
                  <p>{keyDetails.weapon}</p>
                </div>
              </div>) : (<p className="text-9xl font-bold">_____</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
