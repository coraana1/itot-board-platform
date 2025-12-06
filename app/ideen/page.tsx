/**
 * Ideen-Übersicht – Liste aller Ideen (alle Status)
 * 
 * Zeigt alle Ideen unabhängig vom Status an.
 * Der Status wird farblich hervorgehoben.
 */

import Link from "next/link";
import { List, Eye, AlertCircle } from "lucide-react";
import { getAlleIdeen } from "@/lib/dataverse";
import type { LifecycleStatus } from "@/lib/types";
import Navbar from "@/components/Navbar";

/**
 * Gibt die passende Badge-Farbe für einen Status zurück
 */
function getStatusBadgeClass(status: LifecycleStatus): string {
  switch (status) {
    case "Idee eingereicht":
      return "badge-neutral";
    case "Idee wird ITOT-Board vorgestellt":
      return "badge-warning";
    case "ITOT-Board Bewertung abgeschlossen":
      return "badge-success";
    case "In Umsetzung":
      return "badge-info";
    case "Abgeschlossen":
      return "badge-success badge-outline";
    case "Abgelehnt":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

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
            <div className="overflow-x-auto">
              <table className="table table-zebra bg-base-100 shadow">
                <thead>
                  <tr>
                    <th>Titel</th>
                    <th>Typ</th>
                    <th>Status</th>
                    <th>Verantwortlich</th>
                    <th className="text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {ideen.map((idee) => (
                    <tr key={idee.id} className="hover">
                      <td className="font-medium">{idee.titel}</td>
                      <td>
                        <span className="badge badge-ghost">{idee.typ}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(idee.lifecyclestatus)}`}>
                          {idee.lifecyclestatus}
                        </span>
                      </td>
                      <td>{idee.verantwortlicher}</td>
                      <td className="text-right">
                        <Link 
                          href={`/ideen/${idee.id}`}
                          className="btn btn-sm btn-ghost gap-1"
                        >
                          <Eye size={16} />
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
