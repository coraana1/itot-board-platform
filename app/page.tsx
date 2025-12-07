/**
 * Startseite – Willkommensseite mit Navigation zum Dashboard
 * Dies ist die erste Seite, die Benutzer sehen, wenn sie die App öffnen.
 */

import Link from "next/link";
import { LayoutDashboard, ClipboardList } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hauptinhalt */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-lg w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Willkommen beim ITOT Board
          </h1>
          <p className="text-gray-600 mb-8">
            Hier können ITOT Board Mitglieder Digitalisierungs-Ideen bewerten 
            und deren Komplexität sowie Kritikalität einschätzen.
          </p>
          
          {/* Aktions-Buttons */}
          <div className="flex justify-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              <LayoutDashboard size={20} />
              Zum Dashboard
            </Link>
            <Link 
              href="/ideen" 
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-violet-400 text-gray-700 hover:text-violet-600 font-medium rounded-lg transition-colors"
            >
              <ClipboardList size={20} />
              Alle Ideen
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-gray-400 text-sm">
        <p>ITOT Board Platform – Prototyp</p>
      </footer>
    </div>
  );
}
