/**
 * Alle Ideen – Hauptseite für Digitalisierungsvorhaben
 * 
 * Design angelehnt an Power Apps Ideen-Pool:
 * - Weisser Hintergrund, sauberes Layout
 * - Lila/Violett als Primärfarbe
 * - Cards mit Ideen-Übersicht
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Lightbulb, Search, Loader2, AlertCircle, User, Calendar } from "lucide-react";
import LoginPrompt from "@/components/dataverse/LoginPrompt";
import WhoAmICard from "@/components/dataverse/WhoAmICard";
import type { DigitalisierungsvorhabenRecord } from "@/lib/services/dataverse/types";

export default function AlleIdeenPage() {
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

  // Detail-Ansicht
  const [editRecord, setEditRecord] = useState<DigitalisierungsvorhabenRecord | null>(null);

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

  // Suche und Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTyp, setFilterTyp] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);

  // Gefilterte Records
  const filteredRecords = records.filter((record) => {
    // Suche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        record.cr6df_name?.toLowerCase().includes(query) ||
        record.cr6df_beschreibung?.toLowerCase().includes(query) ||
        record.cr6df_verantwortlichername?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Typ-Filter
    if (filterTyp !== null && record.cr6df_typ !== filterTyp) return false;
    
    // Status-Filter
    if (filterStatus !== null && record.cr6df_lifecyclestatus !== filterStatus) return false;
    
    return true;
  });

  // Typ-Mapping (Dataverse Picklist-Werte zu Text)
  const getTypText = (typ?: number): string => {
    switch (typ) {
      case 562520000: return "Idee";
      case 562520001: return "Vorhaben";
      case 562520002: return "Projekt";
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

  // Status-Badge (Dataverse Picklist-Werte)
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
            <h1 className="text-2xl font-bold text-gray-900">Alle Ideen</h1>
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

              {/* Filter-Dropdowns */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Typ-Filter */}
                <div className="relative">
                  <select
                    value={filterTyp ?? ""}
                    onChange={(e) => setFilterTyp(e.target.value ? parseInt(e.target.value) : null)}
                    className={`appearance-none pl-4 pr-10 py-2 text-sm rounded-lg border transition-colors cursor-pointer
                      ${filterTyp !== null 
                        ? "bg-violet-50 border-violet-300 text-violet-700" 
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  >
                    <option value="">Alle Typen</option>
                    <option value="562520000">Idee</option>
                    <option value="562520001">Vorhaben</option>
                    <option value="562520002">Projekt</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Status-Filter */}
                <div className="relative">
                  <select
                    value={filterStatus ?? ""}
                    onChange={(e) => setFilterStatus(e.target.value ? parseInt(e.target.value) : null)}
                    className={`appearance-none pl-4 pr-10 py-2 text-sm rounded-lg border transition-colors cursor-pointer
                      ${filterStatus !== null 
                        ? "bg-violet-50 border-violet-300 text-violet-700" 
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  >
                    <option value="">Alle Status</option>
                    <option value="562520000">Eingereicht</option>
                    <option value="562520001">ITOT-Board</option>
                    <option value="562520002">Bewertet</option>
                    <option value="562520003">In Umsetzung</option>
                    <option value="562520004">Abgeschlossen</option>
                    <option value="562520005">Abgelehnt</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Filter zurücksetzen */}
                {(filterTyp !== null || filterStatus !== null || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterTyp(null);
                      setFilterStatus(null);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-violet-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Zurücksetzen
                  </button>
                )}
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

              {/* Detail-Modal (Read-Only) */}
              {editRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                          <Lightbulb size={20} className="text-violet-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Idee Details</h2>
                      </div>
                      <button
                        onClick={() => setEditRecord(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadge(editRecord.cr6df_lifecyclestatus).class}`}>
                        {getStatusBadge(editRecord.cr6df_lifecyclestatus).text}
                      </span>
                    </div>

                    {/* Titel */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Titel</label>
                      <p className="text-lg font-semibold text-gray-900">{editRecord.cr6df_name || "Ohne Titel"}</p>
                    </div>

                    {/* Beschreibung */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Beschreibung</label>
                      <p className="text-gray-700 whitespace-pre-wrap">{editRecord.cr6df_beschreibung || "Keine Beschreibung"}</p>
                    </div>

                    {/* Meta-Infos */}
                    <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-gray-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Verantwortlich</label>
                        <p className="text-gray-700">{editRecord.cr6df_verantwortlichername || "–"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Erstellt am</label>
                        <p className="text-gray-700">
                          {editRecord.createdon 
                            ? new Date(editRecord.createdon).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })
                            : "–"}
                        </p>
                      </div>
                    </div>

                    {/* ITOT Board Bewertung */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">ITOT Board Bewertung</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Komplexität</label>
                          <p className="text-gray-700">
                            {editRecord.cr6df_komplexitaet === 562520000 ? "Gering" :
                             editRecord.cr6df_komplexitaet === 562520001 ? "Mittel" :
                             editRecord.cr6df_komplexitaet === 562520002 ? "Hoch" : "Nicht bewertet"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Kritikalität</label>
                          <p className="text-gray-700">
                            {editRecord.cr6df_kritikalitaet === 562520000 ? "Gering" :
                             editRecord.cr6df_kritikalitaet === 562520001 ? "Mittel" :
                             editRecord.cr6df_kritikalitaet === 562520002 ? "Hoch" : "Nicht bewertet"}
                          </p>
                        </div>
                      </div>
                      {editRecord.cr6df_itotboard_begruendung && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Begründung</label>
                          <p className="text-gray-700 whitespace-pre-wrap">{editRecord.cr6df_itotboard_begruendung}</p>
                        </div>
                      )}
                    </div>

                    {/* Schliessen Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditRecord(null)}
                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                      >
                        Schliessen
                      </button>
                    </div>
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
