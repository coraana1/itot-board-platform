/**
 * Dashboard-Seite – Übersicht der zu bewertenden Ideen
 * 
 * Dies ist eine Server Component, die Daten direkt vom Server lädt.
 * Zeigt alle Ideen mit Status "Idee wird ITOT-Board vorgestellt" als filterbare Tabelle an.
 */

import { ClipboardList, AlertCircle } from "lucide-react";
import { getIdeenZurBewertung } from "@/lib/dataverse";
import Navbar from "@/components/Navbar";
import DashboardTable from "@/components/DashboardTable";

export default async function DashboardPage() {
  // Daten vom Server laden (Server Component)
  const ideen = await getIdeenZurBewertung();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar mit Login-Status */}
      <Navbar badge="Dashboard" badgeColor="primary" />

      {/* Hauptinhalt */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Titel mit Anzahl */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList size={32} />
              Ideen zur Bewertung
            </h1>
            <span className="badge badge-lg badge-primary">
              {ideen.length} {ideen.length === 1 ? "Idee" : "Ideen"}
            </span>
          </div>

          {/* Ideen-Liste oder Leer-Zustand */}
          {ideen.length === 0 ? (
            <div className="alert alert-info">
              <AlertCircle size={20} />
              <span>Aktuell gibt es keine Ideen zur Bewertung.</span>
            </div>
          ) : (
            <DashboardTable ideen={ideen} />
          )}

          {/* Info-Box */}
          <div className="mt-8 p-4 bg-base-100 rounded-lg border border-base-300">
            <p className="text-sm text-base-content/70">
              <strong>Tipp:</strong> Klicke auf die Spaltenüberschriften, um die Tabelle zu sortieren. 
              Erster Klick = aufsteigend, zweiter Klick = absteigend, dritter Klick = unsortiert.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
