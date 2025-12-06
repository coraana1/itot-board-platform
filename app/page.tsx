/**
 * Startseite – Willkommensseite mit Navigation zum Dashboard
 * Dies ist die erste Seite, die Benutzer sehen, wenn sie die App öffnen.
 */

import Link from "next/link";
import { LayoutDashboard, ClipboardList } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar mit Login-Status */}
      <Navbar />

      {/* Hauptinhalt */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="card bg-base-100 shadow-xl max-w-lg w-full">
          <div className="card-body text-center">
            <h1 className="card-title text-2xl justify-center mb-2">
              Willkommen beim ITOT Board
            </h1>
            <p className="text-base-content/70 mb-6">
              Hier können ITOT Board Mitglieder Digitalisierungs-Ideen bewerten 
              und deren Komplexität sowie Kritikalität einschätzen.
            </p>
            
            {/* Aktions-Buttons */}
            <div className="card-actions justify-center gap-4">
              <Link href="/dashboard" className="btn btn-primary gap-2">
                <LayoutDashboard size={20} />
                Zum Dashboard
              </Link>
              <Link href="/ideen" className="btn btn-outline gap-2">
                <ClipboardList size={20} />
                Alle Ideen
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-100 text-base-content/60">
        <p>ITOT Board Platform – Prototyp</p>
      </footer>
    </div>
  );
}
