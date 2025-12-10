"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

export default function CallsPage() {
  const [active, setActive] = useState<Record[] | null>(null);
  const [inactive, setInactive] = useState<Record[] | null>(null);

  interface Record {
    id: number;
    created_at: string;
    emotional_sev: number;
    context_sev: number;
    transcript: string;
    key_details: KeyDetails;
    is_active: boolean;
    emotions: string;
  }

  interface KeyDetails {
    event: string;
    victims: number;
    ongoing_threat: string;
  }

  async function getActive() {
    const activeRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/supabase/active", { method: "GET" });
    setActive(await activeRes.json());
  }
  async function getInactive() {
    const inactiveRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/supabase/inactive", { method: "GET" });
    setInactive(await inactiveRes.json());

  }

  React.useEffect(() => {
    async function loadAll() {
      await Promise.all([getActive(), getInactive()]);
    }
    loadAll();
  }, []);

  React.useEffect(() => {
    console.log("Active:", active);
    console.log("Inactive:", inactive);
  }, [active, inactive]);


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
        </header>
        <h1>ACTIVE</h1>
        <div className="flex flex-col">
          {/* ACTIVE TABLE */}
          {active ? (
            <section className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Call ID</th>
                    <th className="p-3">Date/Time</th>
                    <th className="p-3">Emotions</th>
                    <th className="p-3">Emotional Severity</th>
                    <th className="p-3">Context Severity</th>
                    <th className="p-3">Transcript</th>
                    <th className="p-3">Key Details</th>
                    {/* <th className="p-3">Make Inactive?</th> */}
                  </tr>
                </thead>

                <tbody>
                  {active.map((call) => (
                    <tr key={call.id}>
                      <td>{call.id}</td>
                      <td>{call.created_at}</td>
                      <td>{call.emotions}</td>
                      <td>{call.emotional_sev}</td>
                      <td>{call.context_sev}</td>
                      <td>{call.transcript}</td>
                      <td>
                        <div>
                          <p>EVENT: {call.key_details.event}</p>
                          <p>NO. VICTIMS: {call.key_details.victims}</p>
                          <p>ONGOING? {call.key_details.ongoing_threat}</p>
                        </div>
                      </td>
                      {/* <td>
                        <button></button>
                      </td> */}
                    </tr>

                  ))
                  }
                </tbody>
              </table>
            </section>) : (<h3>LOADING...</h3>)}

          {/* INACTIVE TABLE */}
          {/* <h1>INACTIVE</h1>
          {active ? (
            <section className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr className="text-slate-300">
                    <th className="p-3 text-left">Call ID</th>
                    <th className="p-3 text-left">Date/Time</th>
                    <th className="p-3 text-left">Overall Severity</th>
                    <th className="p-3 text-left">Context Severity</th>
                    <th className="p-3 text-left">Emotional Severity</th>
                    <th className="p-3 text-left">Key Details</th>
                    <th className="p-3 text-left">Transcript</th>
                  </tr>
                </thead>

                <tbody>

                </tbody>
              </table>
            </section>) : (<h3>LOADING...</h3>)} */}
        </div>
      </div>
    </div>
  );
}
