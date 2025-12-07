/**
 * Ideen-Pool – Hauptseite für Digitalisierungsvorhaben
 * 
 * Design angelehnt an Power Apps Ideen-Pool:
 * - Weisser Hintergrund, sauberes Layout
 * - Lila/Violett als Primärfarbe
 * - Cards mit Ideen-Übersicht
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Lightbulb, Search, Filter, Loader2, AlertCircle, User, Calendar } from "lucide-react";
import LoginPrompt from "@/components/dataverse/LoginPrompt";
import WhoAmICard from "@/components/dataverse/WhoAmICard";
import DigitalisierungsvorhabenForm from "@/components/dataverse/DigitalisierungsvorhabenForm";
import type { 
  DigitalisierungsvorhabenRecord, 
  DigitalisierungsvorhabenInput 
} from "@/lib/services/dataverse/types";

export default function DataversePage() {
  // Auth-Status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Tabellen-Status
  const [tableReady, setTableReady] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [isCheckingTable, setIsCheckingTable] = useState(false);

  // Datensätze
  const [records, setRecords] = useState<DigitalisierungsvorhabenRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // Edit-Modus
  const [editRecord, setEditRecord] = useState<DigitalisierungsvorhabenRecord | null>(null);

  // Toast-Nachrichten
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Toast anzeigen
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth-Status prüfen
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/dataverse/auth");
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      return data.isAuthenticated;
    } catch (error) {
      console.error("Auth-Check fehlgeschlagen:", error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  // Tabellen-Status prüfen
  const checkTable = useCallback(async () => {
    setIsCheckingTable(true);
    setTableError(null);

    try {
      const response = await fetch("/api/dataverse/digitalisierungsvorhaben/setup");
      const data = await response.json();

      if (data.tableExists) {
        setTableReady(true);
        return true;
      } else {
        setTableError(data.error || "Tabelle nicht gefunden");
        return false;
      }
    } catch (error) {
      setTableError(String(error));
      return false;
    } finally {
      setIsCheckingTable(false);
    }
  }, []);

  // Datensätze laden
  const fetchRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    setRecordsError(null);

    try {
      const response = await fetch("/api/dataverse/digitalisierungsvorhaben");
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Laden");
      }

      const data = await response.json();
      setRecords(data.value || []);
    } catch (error) {
      setRecordsError(String(error));
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  // Initial: Auth prüfen
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Nach Auth: Tabelle prüfen und Daten laden
  useEffect(() => {
    if (isAuthenticated) {
      checkTable().then((ready) => {
        if (ready) {
          fetchRecords();
        }
      });
    }
  }, [isAuthenticated, checkTable, fetchRecords]);

  // Login erfolgreich
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setTableReady(false);
    setRecords([]);
  };

  // Datensatz aktualisieren
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
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Aktualisieren");
      }

      showToast("success", "Datensatz aktualisiert");
      setEditRecord(null);
      fetchRecords();
    } catch (error) {
      showToast("error", String(error));
    }
  };

  // Datensatz löschen
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/dataverse/digitalisierungsvorhaben/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Löschen");
      }

      showToast("success", "Datensatz gelöscht");
      fetchRecords();
    } catch (error) {
      showToast("error", String(error));
    }
  };

  // Suche
  const [searchQuery, setSearchQuery] = useState("");

  // Gefilterte Records
  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.cr6df_name?.toLowerCase().includes(query) ||
      record.cr6df_beschreibung?.toLowerCase().includes(query) ||
      record.cr6df_verantwortlichername?.toLowerCase().includes(query)
    );
  });

  // Typ-Mapping (Picklist-Werte zu Text)
  const getTypText = (typ?: number): string => {
    switch (typ) {
      case 1: return "Idee";
      case 2: return "Vorhaben";
      case 3: return "Projekt";
      default: return "Sonstige";
    }
  };

  // Gruppiere nach Typ
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    const typ = getTypText(record.cr6df_typ);
    if (!acc[typ]) acc[typ] = [];
    acc[typ].push(record);
    return acc;
  }, {} as Record<string, DigitalisierungsvorhabenRecord[]>);

  // Status-Badge
  const getStatusBadge = (status?: number) => {
    switch (status) {
      case 1: return { text: "Eingereicht", class: "bg-gray-100 text-gray-600" };
      case 2: return { text: "ITOT-Board", class: "bg-amber-100 text-amber-700" };
      case 3: return { text: "Bewertet", class: "bg-green-100 text-green-700" };
      case 4: return { text: "In Umsetzung", class: "bg-blue-100 text-blue-700" };
      case 5: return { text: "Abgeschlossen", class: "bg-green-50 text-green-600 border border-green-200" };
      case 6: return { text: "Abgelehnt", class: "bg-red-100 text-red-700" };
      default: return { text: "Keine Phase", class: "bg-violet-100 text-violet-700" };
    }
  };

  // Loading-State
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

      {/* Nicht authentifiziert: Login-Prompt */}
      {!isAuthenticated && (
        <div className="p-8">
          <LoginPrompt onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {/* Authentifiziert */}
      {isAuthenticated && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Lightbulb size={22} className="text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ideen-Pool</h1>
          </div>

          {/* Verbindungsstatus (kompakt) - versteckt, aber im DOM behalten */}
          <div className="hidden">
            <WhoAmICard onLogout={handleLogout} />
          </div>

          {/* Tabellen-Check */}
          {isCheckingTable && (
            <div className="flex items-center gap-3 py-8 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Lade Daten...</span>
            </div>
          )}

          {tableError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span>{tableError}</span>
              </div>
            </div>
          )}

          {/* Tabelle bereit: Ideen anzeigen */}
          {tableReady && (
            <>
              {/* Suchleiste */}
              <div className="mt-6 mb-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter-Buttons */}
              <div className="flex gap-2 mb-4">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Filter size={14} />
                  Typ
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Filter size={14} />
                  Phase
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  <User size={14} />
                  Person
                </button>
              </div>

              {/* Anzahl Einträge */}
              <p className="text-sm text-gray-500 mb-6">
                {filteredRecords.length} Einträge
              </p>

              {/* Loading */}
              {isLoadingRecords && (
                <div className="flex items-center gap-3 py-8 text-gray-500">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Lade Ideen...</span>
                </div>
              )}

              {/* Error */}
              {recordsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <span className="text-red-700">{recordsError}</span>
                </div>
              )}

              {/* Keine Daten */}
              {!isLoadingRecords && !recordsError && filteredRecords.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Keine Ideen gefunden.</p>
                </div>
              )}

              {/* Gruppierte Ideen-Cards */}
              {!isLoadingRecords && !recordsError && Object.entries(groupedRecords).map(([typ, items]) => (
                <div key={typ} className="mb-8">
                  {/* Typ-Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={18} className="text-amber-500" />
                    <h2 className="font-semibold text-gray-900">{typ}</h2>
                    <span className="text-sm text-violet-600 font-medium">{items.length}</span>
                  </div>

                  {/* Ideen-Cards */}
                  <div className="space-y-3">
                    {items.map((record) => {
                      const status = getStatusBadge(record.cr6df_lifecyclestatus);
                      return (
                        <div
                          key={record.cr6df_sgsw_digitalisierungsvorhabenid}
                          onClick={() => setEditRecord(record)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          {/* Status-Badge oben rechts */}
                          <div className="flex justify-end mb-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${status.class}`}>
                              {status.text}
                            </span>
                          </div>

                          {/* Titel */}
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {record.cr6df_name || "Ohne Titel"}
                          </h3>

                          {/* Beschreibung (gekürzt) */}
                          {record.cr6df_beschreibung && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {record.cr6df_beschreibung}
                            </p>
                          )}

                          {/* Meta-Infos */}
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Formular-Modal (nur Edit) */}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
