import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ML Triage System",
  description: "CS439 Project - Rutgers University",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col`}>
        <div> {children} </div>
        <footer className="flex items-center justify-center">
          <Link href="/"> Home </Link>
        </footer>
      </body>
    </html>
  );
}
