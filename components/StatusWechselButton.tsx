/**
 * StatusWechselButton – Button zum Abschliessen der ITOT Board Bewertung
 * 
 * Client Component für den Lifecycle-Status-Wechsel.
 * Ändert den Status von "Idee wird ITOT-Board vorgestellt" 
 * zu "ITOT-Board Bewertung abgeschlossen".
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface StatusWechselButtonProps {
  ideeId: string;
  // Prüft ob alle Pflichtfelder ausgefüllt sind
  bewertungVollstaendig: boolean;
}

export default function StatusWechselButton({ 
  ideeId, 
  bewertungVollstaendig 
}: StatusWechselButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status ändern
  const handleStatusWechsel = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideen/${ideeId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "ITOT-Board Bewertung abgeschlossen" 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Fehler beim Statuswechsel");
      }

      // Seite neu laden um den neuen Status anzuzeigen
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten"
      );
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  // Wenn Bewertung nicht vollständig, deaktivierten Button anzeigen
  if (!bewertungVollstaendig) {
    return (
      <div className="flex items-center gap-2 text-base-content/60">
        <AlertCircle size={18} />
        <span className="text-sm">
          Bitte zuerst die Bewertung vollständig ausfüllen
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Bestätigungsdialog */}
      {showConfirm ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-warning">
            Sind Sie sicher? Nach dem Abschluss kann die Bewertung nicht mehr geändert werden.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleStatusWechsel}
              className="btn btn-success btn-sm gap-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Wird abgeschlossen...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Ja, abschliessen
                </>
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="btn btn-ghost btn-sm"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="btn btn-success gap-2"
        >
          <CheckCircle size={18} />
          Bewertung abschliessen
        </button>
      )}

      {/* Fehlermeldung */}
      {error && (
        <div className="alert alert-error mt-3">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
