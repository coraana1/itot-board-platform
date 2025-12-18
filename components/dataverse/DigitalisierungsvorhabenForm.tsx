/**
 * DigitalisierungsvorhabenForm – Formular für Create/Edit
 * 
 * Design angelehnt an Power Apps "Neue Idee einreichen":
 * - Weisser Hintergrund, sauberes Layout
 * - Lila/Violett als Primärfarbe
 * - Hilfetext unter den Feldern
 */

"use client";

import { useState, useEffect } from "react";
import { Send, X, Loader2, Lightbulb, ArrowLeft } from "lucide-react";
import type { DigitalisierungsvorhabenRecord, DigitalisierungsvorhabenInput } from "@/lib/services/dataverse/types";

interface DigitalisierungsvorhabenFormProps {
  editRecord?: DigitalisierungsvorhabenRecord | null;
  onSubmit: (data: DigitalisierungsvorhabenInput) => Promise<void>;
  onCancel: () => void;
}

export default function DigitalisierungsvorhabenForm({
  editRecord,
  onSubmit,
  onCancel,
}: DigitalisierungsvorhabenFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DigitalisierungsvorhabenInput>({
    cr6df_name: "",
    cr6df_beschreibung: "",
  });

  // Formular mit Edit-Daten füllen
  useEffect(() => {
    if (editRecord) {
      setFormData({
        cr6df_name: editRecord.cr6df_name || "",
        cr6df_beschreibung: editRecord.cr6df_beschreibung || "",
        cr6df_typ: editRecord.cr6df_typ,
        cr6df_komplexitaet: editRecord.cr6df_komplexitaet,
        cr6df_kritikalitaet: editRecord.cr6df_kritikalitaet,
        cr6df_itotboard_begruendung: editRecord.cr6df_itotboard_begruendung || "",
        cr6df_lifecyclestatus: editRecord.cr6df_lifecyclestatus,
        cr6df_prioritat: editRecord.cr6df_prioritat,
        cr6df_detailanalyse_ergebnis: editRecord.cr6df_detailanalyse_ergebnis || "",
        cr6df_detailanalyse_personentage: editRecord.cr6df_detailanalyse_personentage,
      });
    } else {
      // Reset für Create
      setFormData({
        cr6df_name: "",
        cr6df_beschreibung: "",
      });
    }
  }, [editRecord]);

  // Handler für Select-Felder (Picklist = number)
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseInt(value) : undefined,
    }));
  };

  // Handler für Text-Felder
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler für Number-Felder
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseInt(value) : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      
      // Reset nach Create (nicht nach Edit)
      if (!editRecord) {
        setFormData({
          cr6df_name: "",
          cr6df_beschreibung: "",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status-Badge mit Farben
  const getStatusBadge = (status?: number) => {
    switch (status) {
      case 562520000: return { text: "Eingereicht", class: "bg-gray-100 text-gray-600" };
      case 562520001: return { text: "ITOT-Board", class: "bg-amber-100 text-amber-700" };
      case 562520002: return { text: "Bewertet", class: "bg-green-100 text-green-700" };
      case 562520003: return { text: "In Umsetzung", class: "bg-blue-100 text-blue-700" };
      case 562520004: return { text: "Abgeschlossen", class: "bg-green-50 text-green-600 border border-green-200" };
      case 562520005: return { text: "Abgelehnt", class: "bg-red-100 text-red-700" };
      case 562520006: return { text: "Pausiert", class: "bg-yellow-100 text-yellow-700" };
      case 562520007: return { text: "Archiviert", class: "bg-gray-50 text-gray-500" };
      default: return { text: "Keine Phase", class: "bg-violet-100 text-violet-700" };
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Zurück-Link */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} />
        Zurück zum Dashboard
      </button>

      {/* Header mit Icon */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
          <Lightbulb size={24} className="text-violet-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {editRecord ? "Idee bewerten" : "Neue Idee einreichen"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Eingereicht von: {editRecord?.cr6df_ideengebername || "–"}
            {editRecord?.createdon && (
              <span className="ml-2">
                • {new Date(editRecord.createdon).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Titel */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titel der Idee
        </label>
        <input
          type="text"
          name="cr6df_name"
          value={formData.cr6df_name || ""}
          readOnly
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
        />
      </div>

      {/* Beschreibung */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung
        </label>
        <textarea
          name="cr6df_beschreibung"
          value={formData.cr6df_beschreibung || ""}
          readOnly
          rows={6}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed resize-none"
        />
      </div>

      {/* Zusätzliche Felder (nur bei Edit) */}
      {editRecord && (
        <>
          {/* Idee-Informationen (Read-Only) */}
          <div className="border-t border-gray-200 my-6 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Idee-Informationen</h3>
            
            <div className="mb-4">
              {/* Verantwortlicher */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Verantwortlicher</label>
                <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  {editRecord.cr6df_verantwortlichername || "–"}
                </p>
              </div>
            </div>
          </div>

          {/* ITOT Board Bewertung (Editierbar) */}
          <div className="border-t border-gray-200 my-6 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ITOT Board Bewertung</h3>
            
            {/* Typ (volle Breite) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                name="cr6df_typ"
                value={formData.cr6df_typ?.toString() ?? ""}
                onChange={handleSelectChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Auswählen --</option>
                <option value="562520000">Idee</option>
                <option value="562520001">Vorhaben</option>
                <option value="562520002">Projekt</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Komplexität */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Komplexität
                </label>
                <select
                  name="cr6df_komplexitaet"
                  value={formData.cr6df_komplexitaet?.toString() ?? ""}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">-- Auswählen --</option>
                  <option value="562520000">Einfach</option>
                  <option value="562520001">Mittel</option>
                  <option value="562520002">Komplex</option>
                </select>
              </div>

              {/* Kritikalität */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kritikalität
                </label>
                <select
                  name="cr6df_kritikalitaet"
                  value={formData.cr6df_kritikalitaet?.toString() ?? ""}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">-- Auswählen --</option>
                  <option value="562520000">Gering</option>
                  <option value="562520001">Mittel</option>
                  <option value="562520002">Hoch</option>
                </select>
              </div>
            </div>

            {/* Aufwandschätzung (Read-Only) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Aufwandschätzung [in Tagen]
              </label>
              <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                {editRecord.cr6df_detailanalyse_personentage ?? "–"}
              </p>
            </div>

            {/* ITOT Board Begründung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ITOT Board Begründung
              </label>
              <textarea
                name="cr6df_itotboard_begruendung"
                value={formData.cr6df_itotboard_begruendung || ""}
                onChange={handleTextChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="Begründung der Bewertung..."
              />
            </div>
          </div>
        </>
      )}

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {isSubmitting ? "Wird gespeichert..." : editRecord ? "Speichern" : "Idee einreichen"}
        </button>
      </div>

      {/* Hinweis */}
      {!editRecord && (
        <p className="text-center text-sm text-gray-500 mt-6">
          Nach dem Einreichen wird deine Idee vom Digital Solution Team geprüft. Du kannst den Status jederzeit im Ideen-Pool verfolgen.
        </p>
      )}
    </form>
  );
}
