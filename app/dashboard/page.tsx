/**
 * Dashboard – Ideen zur Bewertung durch das ITOT Board
 * 
 * Zeigt alle Ideen mit Status "Idee wird ITOT-Board vorgestellt" (Status 2).
 * Verwendet Dataverse als Datenquelle.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Loader2, AlertCircle, User, Calendar, Lightbulb } from "lucide-react";
import LoginPrompt from "@/components/dataverse/LoginPrompt";
import DigitalisierungsvorhabenForm from "@/components/dataverse/DigitalisierungsvorhabenForm";
import type { 
  DigitalisierungsvorhabenRecord, 
  DigitalisierungsvorhabenInput 
} from "@/lib/services/dataverse/types";

export default function DashboardPage() {
  // Auth-Status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Datensätze
  const [records, setRecords] = useState<DigitalisierungsvorhabenRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit-Modus
  const [editRecord, setEditRecord] = useState<DigitalisierungsvorhabenRecord | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth prüfen
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/dataverse/auth");
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      return data.isAuthenticated;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  // Daten laden (nur Status 2 = ITOT-Board)
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dataverse/digitalisierungsvorhaben");
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Fehler beim Laden");
      }

      const data = await response.json();
      // Filtere nur Status 562520001 (Idee wird ITOT-Board vorgestellt)
      const filtered = (data.value || []).filter(
        (r: DigitalisierungsvorhabenRecord) => r.cr6df_lifecyclestatus === 562520001
      );
      setRecords(filtered);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
    }
  }, [isAuthenticated, fetchRecords]);

  // Login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Update
  const handleUpdate = async (data: DigitalisierungsvorhabenInput) => {
    if (!editRecord) return;

    try {
      const response = await fetch(
        `/api/dataverse/digitalisierungsvorhaben/${editRecord.cr6df_sgsw_digitalisierungsvorhabenid}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Fehler beim Aktualisieren");
      }

      showToast("success", "Bewertung gespeichert");
      setEditRecord(null);
      fetchRecords();
    } catch (err) {
      showToast("error", String(err));
    }
  };

  // Loading
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={48} className="animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Nicht authentifiziert */}
      {!isAuthenticated && (
        <div className="p-8">
          <LoginPrompt onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {/* Authentifiziert */}
      {isAuthenticated && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <ClipboardList size={22} className="text-violet-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Ideen zur Bewertung</h1>
            </div>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">
              {records.length} {records.length === 1 ? "Idee" : "Ideen"}
            </span>
          </div>

          {/* Info */}
          <p className="text-sm text-gray-500 mb-6">
            Diese Ideen warten auf die Bewertung durch das ITOT Board.
          </p>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-3 py-8 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Lade Ideen...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Keine Daten */}
          {!isLoading && !error && records.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Aktuell gibt es keine Ideen zur Bewertung.</p>
            </div>
          )}

          {/* Ideen-Cards */}
          {!isLoading && !error && records.length > 0 && (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.cr6df_sgsw_digitalisierungsvorhabenid}
                  onClick={() => setEditRecord(record)}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-violet-300 transition-all cursor-pointer"
                >
                  {/* Header mit Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {record.cr6df_name || "Ohne Titel"}
                    </h3>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                      Wartet auf Bewertung
                    </span>
                  </div>

                  {/* Beschreibung */}
                  {record.cr6df_beschreibung && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {record.cr6df_beschreibung}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {record.cr6df_verantwortlichername && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {record.cr6df_verantwortlichername}
                      </span>
                    )}
                    {record.createdon && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(record.createdon).toLocaleDateString("de-CH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Bewertungs-Status */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Komplexität:</span>
                      <span className={`text-xs font-medium ${record.cr6df_komplexitaet ? "text-violet-600" : "text-gray-400"}`}>
                        {record.cr6df_komplexitaet ? getKomplexitaetText(record.cr6df_komplexitaet) : "Nicht bewertet"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Kritikalität:</span>
                      <span className={`text-xs font-medium ${record.cr6df_kritikalitaet ? "text-violet-600" : "text-gray-400"}`}>
                        {record.cr6df_kritikalitaet ? getKritikalitaetText(record.cr6df_kritikalitaet) : "Nicht bewertet"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {editRecord && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <DigitalisierungsvorhabenForm
                  editRecord={editRecord}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditRecord(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hilfsfunktionen für Picklist-Werte
function getKomplexitaetText(value: number): string {
  switch (value) {
    case 562520000: return "Gering";
    case 562520001: return "Mittel";
    case 562520002: return "Hoch";
    default: return "Unbekannt";
  }
}

function getKritikalitaetText(value: number): string {
  switch (value) {
    case 562520000: return "Gering";
    case 562520001: return "Mittel";
    case 562520002: return "Hoch";
    default: return "Unbekannt";
  }
}
