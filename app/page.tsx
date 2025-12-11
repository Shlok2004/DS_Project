"use client";

import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex items-center">
      <div className="flex flex-col items-center w-full">
        <p> Rutgers University - CS439 </p>
        <h1> ML Triage System </h1>
        <p>
          This project analyzes call audio using machine learning and agentic ai to detect 
          emotional intensity, context severity, generate a 
          severity rating, and help responders triage calls more effectively
        </p>
        <Link href="/analyze"> PROCESS A CALL </Link>
        <Link href="/calls"> VIEW ARCHIVED CALLS </Link>
        <div> CS439 - Data Science Project - Spring 2025 </div>
      </div>
    </main>
  );
}
