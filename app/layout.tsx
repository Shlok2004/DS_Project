import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Emergency Distress Detection",
  description: "CS439 Project - Rutgers University",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        
        {/* --- Main Page Content --- */}
        <div className="flex-1">
          {children}
        </div>

        {/* --- Global Footer w/ Back Button --- */}
        <footer className="w-full border-t border-slate-800 bg-slate-950 py-4 flex items-center justify-center">
          <Link
            href="/"
            className="
              px-5 py-2 rounded-full 
              bg-red-600 text-white 
              text-sm font-semibold 
              shadow-lg hover:bg-red-500 
              hover:-translate-y-[1px] transition
            "
          >
            ⬅ Back to Home
          </Link>
        </footer>

      </body>
    </html>
  );
}
