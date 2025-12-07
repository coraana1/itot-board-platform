/**
 * DigitalisierungsvorhabenTable – Tabelle der Datensätze
 * 
 * Zeigt alle Digitalisierungsvorhaben aus Dataverse an.
 * Mit Edit- und Delete-Aktionen.
 */

"use client";

import { useState } from "react";
import { Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { DigitalisierungsvorhabenRecord } from "@/lib/services/dataverse/types";

interface DigitalisierungsvorhabenTableProps {
  records: DigitalisierungsvorhabenRecord[];
  isLoading: boolean;
  error: string | null;
  onEdit: (record: DigitalisierungsvorhabenRecord) => void;
  onDelete: (id: string) => void;
}

export default function DigitalisierungsvorhabenTable({
  records,
  isLoading,
  error,
  onEdit,
  onDelete,
}: DigitalisierungsvorhabenTableProps) {
  // Doppelklick-Bestätigung für Löschen
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    if (deleteConfirm === id) {
      // Zweiter Klick - wirklich löschen
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      // Erster Klick - Bestätigung anfordern
      setDeleteConfirm(id);
      // Nach 3 Sekunden zurücksetzen
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  // Lifecycle-Status als Text
  const getStatusText = (status?: number): string => {
    switch (status) {
      case 1: return "Idee eingereicht";
      case 2: return "Idee wird ITOT-Board vorgestellt";
      case 3: return "ITOT-Board Bewertung abgeschlossen";
      case 4: return "In Umsetzung";
      case 5: return "Abgeschlossen";
      case 6: return "Abgelehnt";
      default: return "Unbekannt";
    }
  };

  // Status-Badge-Farbe
  const getStatusBadgeClass = (status?: number): string => {
    switch (status) {
      case 1: return "badge-neutral";
      case 2: return "badge-warning";
      case 3: return "badge-success";
      case 4: return "badge-info";
      case 5: return "badge-success badge-outline";
      case 6: return "badge-error";
      default: return "badge-ghost";
    }
  };

  // Typ als Text (Picklist)
  const getTypText = (typ?: number): string => {
    switch (typ) {
      case 1: return "Idee";
      case 2: return "Vorhaben";
      case 3: return "Projekt";
      default: return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="ml-3">Lade Daten...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="alert alert-info">
        <span>Keine Datensätze vorhanden.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra bg-base-100 shadow">
        <thead>
          <tr>
            <th>Name</th>
            <th>Typ</th>
            <th>Status</th>
            <th>Verantwortlich</th>
            <th>Erstellt am</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.cr6df_sgsw_digitalisierungsvorhabenid} className="hover">
              <td className="font-medium">
                {record.cr6df_name || "-"}
              </td>
              <td>
                <span className="badge badge-ghost">
                  {getTypText(record.cr6df_typ)}
                </span>
              </td>
              <td>
                <span className={`badge ${getStatusBadgeClass(record.cr6df_lifecyclestatus)}`}>
                  {getStatusText(record.cr6df_lifecyclestatus)}
                </span>
              </td>
              <td>{record.cr6df_verantwortlichername || "-"}</td>
              <td>
                {record.createdon
                  ? new Date(record.createdon).toLocaleDateString("de-CH")
                  : "-"}
              </td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onEdit(record)}
                    className="btn btn-ghost btn-sm"
                    title="Bearbeiten"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(record.cr6df_sgsw_digitalisierungsvorhabenid)}
                    className={`btn btn-sm ${
                      deleteConfirm === record.cr6df_sgsw_digitalisierungsvorhabenid
                        ? "btn-error"
                        : "btn-ghost"
                    }`}
                    title={
                      deleteConfirm === record.cr6df_sgsw_digitalisierungsvorhabenid
                        ? "Nochmal klicken zum Bestätigen"
                        : "Löschen"
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
