/**
 * BewertungFormular – Formular für die ITOT Board Bewertung
 * 
 * Client Component, da es interaktiv ist (Formulareingaben).
 * Verwendet React Hook Form für Formular-Handling und Zod für Validierung.
 * 
 * Felder:
 * - komplexitaet: Dropdown (gering/mittel/hoch)
 * - kritikalitaet: Dropdown (gering/mittel/hoch)
 * - itotBoard_begruendung: Textarea (min. 10 Zeichen)
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { itotBewertungSchema, type ITOTBewertungFormData } from "@/lib/validators";
import type { Komplexitaet, Kritikalitaet } from "@/lib/types";

// Props für das Formular
interface BewertungFormularProps {
  ideeId: string;
  // Vorhandene Werte (falls bereits teilweise ausgefüllt)
  initialData?: {
    komplexitaet?: Komplexitaet;
    kritikalitaet?: Kritikalitaet;
    itotBoard_begruendung?: string;
  };
  // Callback nach erfolgreichem Speichern
  onSuccess?: () => void;
}

export default function BewertungFormular({ 
  ideeId, 
  initialData,
  onSuccess 
}: BewertungFormularProps) {
  // State für Lade- und Erfolgszustand
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // React Hook Form mit Zod-Resolver initialisieren
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ITOTBewertungFormData>({
    resolver: zodResolver(itotBewertungSchema),
    defaultValues: {
      komplexitaet: initialData?.komplexitaet || undefined,
      kritikalitaet: initialData?.kritikalitaet || undefined,
      itotBoard_begruendung: initialData?.itotBoard_begruendung || "",
    },
  });

  // Formular absenden
  const onSubmit = async (data: ITOTBewertungFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // API-Aufruf zum Speichern
      const response = await fetch(`/api/ideen/${ideeId}/bewertung`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Fehler beim Speichern");
      }

      setSubmitSuccess(true);
      onSuccess?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Komplexität */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-medium">Komplexität *</span>
        </label>
        <select
          {...register("komplexitaet")}
          className={`select select-bordered w-full ${errors.komplexitaet ? "select-error" : ""}`}
          defaultValue=""
        >
          <option value="" disabled>Bitte wählen...</option>
          <option value="gering">Gering – Einfach umzusetzen</option>
          <option value="mittel">Mittel – Mittlerer Aufwand</option>
          <option value="hoch">Hoch – Komplexe Umsetzung</option>
        </select>
        {errors.komplexitaet && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.komplexitaet.message}</span>
          </label>
        )}
      </div>

      {/* Kritikalität */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-medium">Kritikalität *</span>
        </label>
        <select
          {...register("kritikalitaet")}
          className={`select select-bordered w-full ${errors.kritikalitaet ? "select-error" : ""}`}
          defaultValue=""
        >
          <option value="" disabled>Bitte wählen...</option>
          <option value="gering">Gering – Wenig geschäftskritisch</option>
          <option value="mittel">Mittel – Mittlere Priorität</option>
          <option value="hoch">Hoch – Sehr wichtig für das Geschäft</option>
        </select>
        {errors.kritikalitaet && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.kritikalitaet.message}</span>
          </label>
        )}
      </div>

      {/* Begründung */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-medium">Begründung *</span>
        </label>
        <textarea
          {...register("itotBoard_begruendung")}
          className={`textarea textarea-bordered w-full h-32 ${errors.itotBoard_begruendung ? "textarea-error" : ""}`}
          placeholder="Bitte begründen Sie Ihre Einschätzung (mindestens 10 Zeichen)..."
        />
        {errors.itotBoard_begruendung && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.itotBoard_begruendung.message}</span>
          </label>
        )}
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            Mindestens 10 Zeichen, maximal 2000 Zeichen
          </span>
        </label>
      </div>

      {/* Fehlermeldung */}
      {submitError && (
        <div className="alert alert-error">
          <span>{submitError}</span>
        </div>
      )}

      {/* Erfolgsmeldung */}
      {submitSuccess && (
        <div className="alert alert-success">
          <span>Bewertung erfolgreich gespeichert!</span>
        </div>
      )}

      {/* Submit-Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            <>
              <Save size={18} />
              Bewertung speichern
            </>
          )}
        </button>
      </div>
    </form>
  );
}
