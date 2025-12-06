/**
 * Dashboard-Seite – Übersicht der zu bewertenden Ideen
 * 
 * Dies ist eine Server Component, die Daten direkt vom Server lädt.
 * Zeigt alle Ideen mit Status "Idee wird ITOT-Board vorgestellt" als Tabelle an.
 */

import Link from "next/link";
import { ClipboardList, Eye, AlertCircle } from "lucide-react";
import { getIdeenZurBewertung } from "@/lib/dataverse";
import Navbar from "@/components/Navbar";

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
            <div className="overflow-x-auto">
              <table className="table table-zebra bg-base-100 shadow">
                {/* Tabellenkopf */}
                <thead>
                  <tr>
                    <th>Titel</th>
                    <th>Typ</th>
                    <th>Verantwortlich</th>
                    <th>Ideengeber</th>
                    <th className="text-right">Aktion</th>
                  </tr>
                </thead>
                
                {/* Tabelleninhalt */}
                <tbody>
                  {ideen.map((idee) => (
                    <tr key={idee.id} className="hover">
                      <td className="font-medium">{idee.titel}</td>
                      <td>
                        <span className="badge badge-ghost">{idee.typ}</span>
                      </td>
                      <td>{idee.verantwortlicher}</td>
                      <td>{idee.ideengeber}</td>
                      <td className="text-right">
                        <Link 
                          href={`/ideen/${idee.id}`}
                          className="btn btn-sm btn-primary gap-1"
                        >
                          <Eye size={16} />
                          Ansehen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Info-Box */}
          <div className="mt-8 p-4 bg-base-100 rounded-lg border border-base-300">
            <p className="text-sm text-base-content/70">
              <strong>Hinweis:</strong> Diese Liste zeigt alle Ideen mit dem Status 
              &quot;Idee wird ITOT-Board vorgestellt&quot;. Klicke auf &quot;Ansehen&quot;, 
              um die Details zu sehen und die Bewertung durchzuführen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
