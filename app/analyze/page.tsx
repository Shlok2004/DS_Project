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

  console.log("ENV EXISTS:", process.env.NEXT_PUBLIC_API_URL);

  return (
    <div className="min-h-screen">
      <div className="w-full">

        {/* HEADER */}
        <header className="flex flex-col">
          <p>
            Rutgers University - CS439
          </p>
          <div>
            Public: {process.env.NEXT_PUBLIC_API_URL}
          </div>
          <h1 className="text-3xl">Audio Analysis</h1>
          <p>Upload a call snippet to see emotional and context severity, a transcript and key information about the call.</p>
          {/* ARCHIVED CALLS */}
          <Link
            href="/calls"
          >
            Archived Calls
          </Link>
        </header>

        {/* MAIN GRID */}
        <div>
          <section className="border">
            {/* UPLOAD */}
            <div className="flex flex-col items-center">
              <p>Select an audio file below</p>
              <label>
                Choose file
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  name="uploadAudio"
                  onChange={handleFileChange}
                />
              </label>

              {file ? (
                <p>Selected: <span>{file.name}</span></p>
              ) : (<p>Nothing Selected</p>)}
            </div>

            {/* AUDIO PREVIEW */}
            <div className="border">
              <h3>
                AUDIO PREVIEW
              </h3>

              <div className="flex justify-center">
                {audioPath ? (
                  <audio
                    className="w-full"
                    key={audioPath}
                    src={audioPath}
                    controls
                  >
                    Invalid audio.
                  </audio>
                ) : (
                  <p>
                    Select a file for analysis.
                  </p>
                )}
              </div>

              {/* ANALYZE BUTTON */}
              <div className="flex justify-center">
                <button
                  onClick={analyze}
                  disabled={!file || processing}
                >
                  {processing ? "Analyzing…" : "Analyze Audio"}
                </button>
              </div>
            </div>

            {/* SEVERITY */}
            <div>
              <h3>OVERALL SEVERITY (OUT OF 10)</h3>
              <p>{contextSev !== null && emotionSev !== null ? contextSev + emotionSev : "_____"}</p>
            </div>

          </section>

          {/* CONTEXT SEVERITY */}
          <div className="border">
            <h3>CONTEXT SEVERITY (OUT OF 5)</h3>
            <p>{contextSev !== null ? contextSev : "_____"}</p>
          </div>

          {/* EMOTIONS */}
          <div className="border">
            <h3>PREDICTED EMOTION</h3>
            <p>{emotions !== null ? emotions : "_____"}</p>
          </div>

          {/* EMOTIONAL SEVERITY */}
          <div className="border">
            <h3>AUDIBLE EMOTIONAL SEVERITY (OUT OF 5)</h3>
            <p>{emotionSev !== null ? emotionSev : "_____"}</p>
          </div>

          {/* TRANSCRIPT */}
          <div className="border">
            <h3>TRANSCRIPT</h3>
            <p>{transcript !== null ? transcript : "_____"}</p>
          </div>

          {/* KEYWORDS */}
          <div className="border">
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
              </div>) : (<p>_____</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
