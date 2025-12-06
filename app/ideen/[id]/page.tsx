/**
 * Ideen-Detailseite – Zeigt alle Details einer einzelnen Idee
 * 
 * Dynamische Route: /ideen/[id]
 * Die ID wird aus der URL gelesen und die Idee aus der Datenbank geholt.
 * 
 * Felder gemäss PRD:
 * - Nur lesbare Felder: titel, beschreibung, typ, verantwortlicher, ideengeber, detailanalyse_*
 * - Editierbare Felder: komplexitaet, kritikalitaet, itotBoard_begruendung (in Schritt 6)
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  User, 
  Lightbulb, 
  FileText, 
  Clock, 
  BarChart3,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { getIdeeById } from "@/lib/dataverse";
import { getCurrentUser, isITOTBoardMember } from "@/lib/auth";
import type { LifecycleStatus, Komplexitaet, Kritikalitaet } from "@/lib/types";
import Navbar from "@/components/Navbar";
import BewertungFormular from "@/components/BewertungFormular";
import StatusWechselButton from "@/components/StatusWechselButton";

// Hilfsfunktion für Status-Badge-Farbe
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

// Hilfsfunktion für Komplexität/Kritikalität-Badge
function getLevelBadgeClass(level: Komplexitaet | Kritikalitaet | undefined): string {
  switch (level) {
    case "gering":
      return "badge-success";
    case "mittel":
      return "badge-warning";
    case "hoch":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

// Props-Typ für die Seite (Next.js 15+ mit async params)
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IdeeDetailPage({ params }: PageProps) {
  // Params auflösen (Next.js 15+ Syntax)
  const { id } = await params;
  
  // Idee aus der Datenbank laden
  const idee = await getIdeeById(id);

  // Falls Idee nicht gefunden, 404-Seite anzeigen
  if (!idee) {
    notFound();
  }

  // Benutzer und Berechtigung prüfen
  const user = await getCurrentUser();
  const istITOTMitglied = await isITOTBoardMember();

  // Prüfen ob Idee zur Bewertung ansteht UND Benutzer berechtigt ist
  const istZurBewertung = idee.lifecyclestatus === "Idee wird ITOT-Board vorgestellt";
  const kannBearbeiten = istZurBewertung && istITOTMitglied;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar mit Login-Status */}
      <Navbar />

      {/* Hauptinhalt */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">

          {/* Titel-Bereich */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{idee.titel}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-lg badge-outline">{idee.typ}</span>
              <span className={`badge badge-lg ${getStatusBadgeClass(idee.lifecyclestatus)}`}>
                {idee.lifecyclestatus}
              </span>
            </div>
          </div>

          {/* Hauptinhalt in Cards */}
          <div className="grid gap-6">
            
            {/* Beschreibung */}
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title gap-2">
                  <FileText size={20} />
                  Beschreibung
                </h2>
                <p className="whitespace-pre-wrap">{idee.beschreibung}</p>
              </div>
            </div>

            {/* Personen */}
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title gap-2">
                  <User size={20} />
                  Beteiligte Personen
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">Ideengeber</p>
                    <p className="font-medium">{idee.ideengeber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Verantwortlich</p>
                    <p className="font-medium">{idee.verantwortlicher}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailanalyse (falls vorhanden) */}
            {(idee.detailanalyse_ergebnis || idee.detailanalyse_personentage || idee.detailanalyse_nutzen) && (
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title gap-2">
                    <BarChart3 size={20} />
                    Detailanalyse
                  </h2>
                  <div className="grid gap-4">
                    {idee.detailanalyse_ergebnis && (
                      <div>
                        <p className="text-sm text-base-content/60">Ergebnis</p>
                        <p>{idee.detailanalyse_ergebnis}</p>
                      </div>
                    )}
                    {idee.detailanalyse_personentage && (
                      <div>
                        <p className="text-sm text-base-content/60">Geschätzter Aufwand</p>
                        <p className="font-medium">
                          <Clock size={16} className="inline mr-1" />
                          {idee.detailanalyse_personentage} Personentage
                        </p>
                      </div>
                    )}
                    {idee.detailanalyse_nutzen && (
                      <div>
                        <p className="text-sm text-base-content/60">Erwarteter Nutzen</p>
                        <p>{idee.detailanalyse_nutzen}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ITOT Board Bewertung */}
            <div className="card bg-base-100 shadow border-2 border-primary/20">
              <div className="card-body">
                <h2 className="card-title gap-2">
                  <Lightbulb size={20} />
                  ITOT Board Bewertung
                </h2>
                
                {/* Komplexität & Kritikalität */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-base-content/60 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Komplexität
                    </p>
                    {idee.komplexitaet ? (
                      <span className={`badge ${getLevelBadgeClass(idee.komplexitaet)}`}>
                        {idee.komplexitaet}
                      </span>
                    ) : (
                      <span className="text-base-content/40 italic">Noch nicht bewertet</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      Kritikalität
                    </p>
                    {idee.kritikalitaet ? (
                      <span className={`badge ${getLevelBadgeClass(idee.kritikalitaet)}`}>
                        {idee.kritikalitaet}
                      </span>
                    ) : (
                      <span className="text-base-content/40 italic">Noch nicht bewertet</span>
                    )}
                  </div>
                </div>

                {/* Begründung */}
                <div>
                  <p className="text-sm text-base-content/60 flex items-center gap-1 mb-1">
                    <MessageSquare size={14} />
                    Begründung
                  </p>
                  {idee.itotBoard_begruendung ? (
                    <p className="whitespace-pre-wrap">{idee.itotBoard_begruendung}</p>
                  ) : (
                    <span className="text-base-content/40 italic">Noch keine Begründung erfasst</span>
                  )}
                </div>

                {/* Info wenn nicht zur Bewertung (Idle-Zustand) */}
                {!istZurBewertung && (
                  <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 size={18} />
                      <span className="font-medium">Bewertung abgeschlossen</span>
                    </div>
                    <p className="text-sm text-base-content/70 mt-1">
                      Diese Idee wurde bewertet und ist nun im Status &quot;{idee.lifecyclestatus}&quot;. 
                      Die Bewertung kann nicht mehr geändert werden.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bewertungsformular (nur wenn zur Bewertung anstehend UND berechtigt) */}
            {kannBearbeiten && (
              <div className="card bg-base-100 shadow border-2 border-warning">
                <div className="card-body">
                  <h2 className="card-title gap-2 text-warning">
                    <Lightbulb size={20} />
                    Bewertung erfassen
                  </h2>
                  <p className="text-sm text-base-content/70 mb-4">
                    Bitte bewerten Sie diese Idee. Alle Felder sind Pflichtfelder.
                  </p>
                  <BewertungFormular 
                    ideeId={idee.id}
                    initialData={{
                      komplexitaet: idee.komplexitaet,
                      kritikalitaet: idee.kritikalitaet,
                      itotBoard_begruendung: idee.itotBoard_begruendung,
                    }}
                  />

                  {/* Trennlinie */}
                  <div className="divider"></div>

                  {/* Status-Wechsel Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Bewertung abschliessen</h3>
                      <p className="text-sm text-base-content/60">
                        Nach dem Abschluss wird die Idee als bewertet markiert.
                      </p>
                    </div>
                    <StatusWechselButton 
                      ideeId={idee.id}
                      bewertungVollstaendig={!!(idee.komplexitaet && idee.kritikalitaet && idee.itotBoard_begruendung)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hinweis für nicht-berechtigte Benutzer */}
            {istZurBewertung && !istITOTMitglied && (
              <div className="card bg-base-100 shadow border border-base-300">
                <div className="card-body">
                  <div className="flex items-center gap-3 text-base-content/70">
                    <Lock size={24} />
                    <div>
                      <h3 className="font-medium">Keine Berechtigung</h3>
                      <p className="text-sm">
                        {user 
                          ? "Nur ITOT Board Mitglieder können Ideen bewerten." 
                          : "Bitte melden Sie sich an, um diese Idee zu bewerten."}
                      </p>
                      {!user && (
                        <Link href="/login" className="btn btn-primary btn-sm mt-3">
                          Anmelden
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
