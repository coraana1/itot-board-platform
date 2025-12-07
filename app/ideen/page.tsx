/**
 * Ideen-Übersicht – Liste aller Ideen (alle Status)
 * 
 * Zeigt alle Ideen unabhängig vom Status an.
 * Der Status wird farblich hervorgehoben. Tabelle ist filterbar.
 */

import { List, AlertCircle } from "lucide-react";
import { getAlleIdeen } from "@/lib/dataverse";
import Navbar from "@/components/Navbar";
import IdeenTable from "@/components/IdeenTable";

export default async function IdeenPage() {
  const ideen = await getAlleIdeen();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar mit Login-Status */}
      <Navbar badge="Alle Ideen" badgeColor="secondary" />

      {/* Hauptinhalt */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Titel mit Anzahl */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <List size={32} />
              Alle Ideen
            </h1>
            <span className="badge badge-lg badge-secondary">
              {ideen.length} {ideen.length === 1 ? "Idee" : "Ideen"}
            </span>
          </div>

          {/* Ideen-Liste oder Leer-Zustand */}
          {ideen.length === 0 ? (
            <div className="alert alert-info">
              <AlertCircle size={20} />
              <span>Keine Ideen vorhanden.</span>
            </div>
          ) : (
            <IdeenTable ideen={ideen} />
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
