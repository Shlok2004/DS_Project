"use client";

import Link from "next/link";
import React, { useState } from "react";

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
    <div className = "flex justify-center">
      <div>
        {/* HEADER */}
        <header>
          <p>RUTGERS UNIVERSITY - CS439</p>
          <h1>Processed Calls Database</h1>
          <p>All analyzed calls are stored here with severity information</p>

          {/* PROCESS */}
          <Link href="/analyze"> PROCESS A CALL </Link>
        </header>
        <h1>ACTIVE</h1>
        <div className="flex flex-col">
          {/* ACTIVE TABLE */}
          {active ? (
            <section className="border">
              <table className="border-collapse">
                <thead className="border">
                  <tr>
                    <th>Call ID</th>
                    <th>Date/Time</th>
                    <th>Emotions</th>
                    <th>Emotional Severity</th>
                    <th>Context Severity</th>
                    <th>Transcript</th>
                    <th>Key Details</th>
                    {/* <th>Make Inactive?</th> */}
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
            <section>
              <table className="border-collapse">
                <thead className="border">
                  <tr className="text-slate-300">
                    <th>Call ID</th>
                    <th>Date/Time</th>
                    <th>Overall Severity</th>
                    <th>Context Severity</th>
                    <th>Emotional Severity</th>
                    <th>Key Details</th>
                    <th>Transcript</th>
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
