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
import { Lightbulb, Search, Loader2, AlertCircle, User, Calendar, ChevronDown, ChevronRight, FileText, FolderKanban, Rocket } from "lucide-react";
import LoginPrompt from "@/components/dataverse/LoginPrompt";
import WhoAmICard from "@/components/dataverse/WhoAmICard";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { DigitalisierungsvorhabenRecord } from "@/lib/services/dataverse/types";
import { BPF_PHASES, PHASE_CONFIG, getStatusLabel, getPhaseForStatus, getStatusClasses, BpfPhase } from "@/lib/stageConfig";

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

  // Collapsible-State für Phasen (alle standardmässig offen)
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  // Collapsible-State für Status innerhalb Phasen
  const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({});

  // Toggle Phase ein-/ausklappen
  const togglePhase = (phase: string) => {
    setCollapsedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  // Toggle Status ein-/ausklappen
  const toggleStatus = (key: string) => {
    setCollapsedStatuses(prev => ({ ...prev, [key]: !prev[key] }));
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

  // Suche und Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTyp, setFilterTyp] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

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
    
    // Typ-Filter (Multi-Select)
    if (filterTyp.length > 0 && !filterTyp.includes(String(record.cr6df_typ))) return false;
    
    // Status-Filter (Multi-Select)
    if (filterStatus.length > 0 && !filterStatus.includes(String(record.cr6df_lifecyclestatus))) return false;
    
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

  // Phasen-Icon Komponente
  const PhaseIcon = ({ phase, size = 20 }: { phase: BpfPhase; size?: number }) => {
    const config = PHASE_CONFIG[phase];
    switch (config.iconName) {
      case "Lightbulb": return <Lightbulb size={size} className={config.colorClass} />;
      case "Search": return <Search size={size} className={config.colorClass} />;
      case "FolderKanban": return <FolderKanban size={size} className={config.colorClass} />;
      case "Rocket": return <Rocket size={size} className={config.colorClass} />;
      default: return <Lightbulb size={size} className={config.colorClass} />;
    }
  };

  // Gruppiere nach Phase
  const groupedByPhase = filteredRecords.reduce((acc, record) => {
    const phase = getPhaseForStatus(record.cr6df_lifecyclestatus);
    const phaseKey = phase || "Ohne Phase";
    if (!acc[phaseKey]) acc[phaseKey] = [];
    acc[phaseKey].push(record);
    return acc;
  }, {} as Record<string, DigitalisierungsvorhabenRecord[]>);

  // Gruppiere innerhalb jeder Phase nach Status
  const getIdeasByStatus = (ideas: DigitalisierungsvorhabenRecord[]) => {
    return ideas.reduce((acc, idea) => {
      const status = idea.cr6df_lifecyclestatus ?? 0;
      if (!acc[status]) acc[status] = [];
      acc[status].push(idea);
      return acc;
    }, {} as Record<number, DigitalisierungsvorhabenRecord[]>);
  };

  // Status-Badge (Dataverse Lifecycle-Status Picklist-Werte)
  const getStatusBadge = (status?: number) => {
    switch (status) {
      case 562520000: return { text: "Eingereicht", class: "bg-gray-100 text-gray-600" };
      case 562520003: return { text: "Genehmigt", class: "bg-green-100 text-green-700" };
      case 562520005: return { text: "ITOT-Board", class: "bg-amber-100 text-amber-700" };
      case 562520006: return { text: "In Umsetzung", class: "bg-blue-100 text-blue-700" };
      case 562520007: return { text: "Pausiert", class: "bg-yellow-100 text-yellow-700" };
      case 562520011: return { text: "Abgeschlossen", class: "bg-green-50 text-green-600 border border-green-200" };
      default: return { text: `Status ${status || "–"}`, class: "bg-violet-100 text-violet-700" };
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Lightbulb size={22} className="text-violet-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Alle Ideen</h1>
            </div>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">
              {filteredRecords.length} {filteredRecords.length === 1 ? "Idee" : "Ideen"}
            </span>
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
                {/* Typ-Filter (durchsuchbar, Multi-Select) */}
                <SearchableSelect
                  options={[
                    { value: "562520000", label: "Idee" },
                    { value: "562520001", label: "Vorhaben" },
                    { value: "562520002", label: "Projekt" },
                  ]}
                  value={filterTyp}
                  onChange={setFilterTyp}
                  placeholder="Alle Typen"
                  className="w-48"
                />

                {/* Status-Filter (durchsuchbar, Multi-Select) */}
                <SearchableSelect
                  options={[
                    { value: "562520000", label: "eingereicht" },
                    { value: "562520001", label: "Idee in Qualitätsprüfung" },
                    { value: "562520002", label: "Idee zur Überarbeitung" },
                    { value: "562520009", label: "Idee in Detailanalyse" },
                    { value: "562520003", label: "Genehmigt" },
                    { value: "562520004", label: "Abgelehnt" },
                    { value: "562520005", label: "Idee wird ITOT-Board vorgestellt" },
                    { value: "562520006", label: "Idee in Projektportfolio" },
                    { value: "562520007", label: "Idee in Quartalsplanung" },
                    { value: "562520008", label: "Idee in Wochenplanung" },
                    { value: "562520010", label: "In Umsetzung" },
                    { value: "562520011", label: "Abgeschlossen" },
                  ]}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  placeholder="Alle Status"
                  className="w-72"
                />

                {/* Filter zurücksetzen */}
                {(filterTyp.length > 0 || filterStatus.length > 0 || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterTyp([]);
                      setFilterStatus([]);
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

              {/* Nach Phase gruppierte Ideen */}
              {!isLoadingRecords && !recordsError && filteredRecords.length > 0 && (
                <div className="space-y-6">
                  {/* Phasen in der richtigen Reihenfolge */}
                  {BPF_PHASES.map((phase) => {
                    const phaseIdeas = groupedByPhase[phase];
                    if (!phaseIdeas || phaseIdeas.length === 0) return null;
                    
                    const config = PHASE_CONFIG[phase];
                    const ideasByStatus = getIdeasByStatus(phaseIdeas);
                    const isPhaseCollapsed = collapsedPhases[phase];
                    
                    return (
                      <div key={phase} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        {/* Phase Header */}
                        <button
                          onClick={() => togglePhase(phase)}
                          className={`w-full flex items-center gap-3 p-4 ${config.bgClass} hover:opacity-90 transition-opacity`}
                        >
                          {isPhaseCollapsed ? (
                            <ChevronRight size={20} className={config.colorClass} />
                          ) : (
                            <ChevronDown size={20} className={config.colorClass} />
                          )}
                          <PhaseIcon phase={phase} />
                          <div className="flex-1 text-left">
                            <h2 className={`font-semibold ${config.colorClass}`}>{phase}</h2>
                            <p className="text-xs text-gray-500">{config.description}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgClass} ${config.colorClass}`}>
                            {phaseIdeas.length}
                          </span>
                        </button>
                        
                        {/* Status-Gruppen innerhalb der Phase */}
                        {!isPhaseCollapsed && (
                          <div className="divide-y divide-gray-100">
                            {Object.entries(ideasByStatus).map(([statusCode, statusIdeas]) => {
                              const statusNum = parseInt(statusCode);
                              const statusClasses = getStatusClasses(statusNum);
                              const statusLabel = getStatusLabel(statusNum);
                              const statusKey = `${phase}-${statusCode}`;
                              const isStatusCollapsed = collapsedStatuses[statusKey];
                              
                              return (
                                <div key={statusCode}>
                                  {/* Status Header */}
                                  <button
                                    onClick={() => toggleStatus(statusKey)}
                                    className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    {isStatusCollapsed ? (
                                      <ChevronRight size={16} className="text-gray-400" />
                                    ) : (
                                      <ChevronDown size={16} className="text-gray-400" />
                                    )}
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClasses.bgClass} ${statusClasses.colorClass}`}>
                                      {statusLabel}
                                    </span>
                                    <span className="text-xs text-gray-400">({statusIdeas.length})</span>
                                  </button>
                                  
                                  {/* Ideen mit diesem Status */}
                                  {!isStatusCollapsed && (
                                    <div className="divide-y divide-gray-50">
                                      {statusIdeas.map((record) => (
                                        <div
                                          key={record.cr6df_sgsw_digitalisierungsvorhabenid}
                                          onClick={() => setEditRecord(record)}
                                          className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                          {/* Titel und Typ */}
                                          <div className="flex items-start justify-between gap-3 mb-1">
                                            <h3 className="font-medium text-gray-900">
                                              {record.cr6df_name || "Ohne Titel"}
                                            </h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                              {getTypText(record.cr6df_typ)}
                                            </span>
                                          </div>

                                          {/* Meta-Infos */}
                                          <div className="flex items-center gap-4 text-xs text-gray-400">
                                            {record.cr6df_verantwortlichername && (
                                              <span className="flex items-center gap-1">
                                                <User size={12} />
                                                {record.cr6df_verantwortlichername}
                                              </span>
                                            )}
                                            {record.cr6df_detailanalyse_personentage && (
                                              <span className="text-violet-600 font-medium">
                                                {record.cr6df_detailanalyse_personentage} Tage
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
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Ideen ohne Phase */}
                  {groupedByPhase["Ohne Phase"] && groupedByPhase["Ohne Phase"].length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => togglePhase("Ohne Phase")}
                        className="w-full flex items-center gap-3 p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        {collapsedPhases["Ohne Phase"] ? (
                          <ChevronRight size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                        <Calendar size={20} className="text-gray-400" />
                        <div className="flex-1 text-left">
                          <h2 className="font-semibold text-gray-500">Ohne Phase</h2>
                          <p className="text-xs text-gray-400">Ideen ohne zugewiesenen Status</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-600">
                          {groupedByPhase["Ohne Phase"].length}
                        </span>
                      </button>
                      
                      {!collapsedPhases["Ohne Phase"] && (
                        <div className="divide-y divide-gray-50">
                          {groupedByPhase["Ohne Phase"].map((record) => (
                            <div
                              key={record.cr6df_sgsw_digitalisierungsvorhabenid}
                              onClick={() => setEditRecord(record)}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <h3 className="font-medium text-gray-900">
                                {record.cr6df_name || "Ohne Titel"}
                              </h3>
                              {record.cr6df_beschreibung && (
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {record.cr6df_beschreibung}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Detail-Modal (Read-Only) */}
              {editRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                        <Lightbulb size={24} className="text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">Idee Details</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Eingereicht von: {editRecord.cr6df_ideengebername || "–"}
                          {editRecord.createdon && (
                            <span className="ml-2">
                              • {new Date(editRecord.createdon).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </p>
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

                    {/* Prozess-Fortschritt */}
                    {(() => {
                      const currentPhase = getPhaseForStatus(editRecord.cr6df_lifecyclestatus);
                      const currentPhaseIndex = currentPhase ? BPF_PHASES.indexOf(currentPhase) : -1;
                      const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < BPF_PHASES.length - 1 
                        ? BPF_PHASES[currentPhaseIndex + 1] 
                        : null;
                      const statusLabel = getStatusLabel(editRecord.cr6df_lifecyclestatus);
                      const statusClasses = getStatusClasses(editRecord.cr6df_lifecyclestatus);
                      
                      return (
                        <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
                          {/* Prozess-Fortschritt Header */}
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700">Prozess-Fortschritt</h3>
                          </div>
                          
                          {/* Aktuelle Phase */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Calendar size={16} className="text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Aktuelle Phase: {currentPhase || "Keine Phase"}
                                </p>
                                {editRecord.createdon && (
                                  <p className="text-xs text-gray-500">
                                    Seit {new Date(editRecord.createdon).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Phasen-Fortschrittsbalken */}
                          <div className="px-4 py-4">
                            <div className="flex items-center">
                              {BPF_PHASES.map((phase, index) => {
                                const isActive = index <= currentPhaseIndex;
                                const isCurrent = index === currentPhaseIndex;
                                
                                return (
                                  <div key={phase} className="flex-1 flex items-center">
                                    {/* Verbindungslinie (vor dem Punkt, ausser beim ersten) */}
                                    {index > 0 && (
                                      <div className={`flex-1 h-1 ${isActive ? "bg-violet-500" : "bg-gray-200"}`} />
                                    )}
                                    
                                    {/* Phasen-Punkt */}
                                    <div className="flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                        isCurrent 
                                          ? "bg-violet-600 text-white" 
                                          : isActive 
                                            ? "bg-violet-500 text-white" 
                                            : "bg-gray-200 text-gray-500"
                                      }`}>
                                        {index + 1}
                                      </div>
                                      <span className={`text-xs mt-1 text-center max-w-[80px] ${
                                        isCurrent ? "font-semibold text-violet-700" : "text-gray-500"
                                      }`}>
                                        {phase}
                                      </span>
                                    </div>
                                    
                                    {/* Verbindungslinie (nach dem Punkt, ausser beim letzten) */}
                                    {index < BPF_PHASES.length - 1 && (
                                      <div className={`flex-1 h-1 ${index < currentPhaseIndex ? "bg-violet-500" : "bg-gray-200"}`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Nächste Phase */}
                          {nextPhase && (
                            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Nächste Phase: <span className="font-medium">{nextPhase}</span>
                              </p>
                            </div>
                          )}
                          
                          {/* Detailstatus */}
                          <div className="px-4 py-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-600">Detailstatus:</span>
                              <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${statusClasses.bgClass} ${statusClasses.colorClass}`}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Titel */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Titel</label>
                      <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                        {editRecord.cr6df_name || "Ohne Titel"}
                      </p>
                    </div>

                    {/* Beschreibung */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Beschreibung</label>
                      <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 whitespace-pre-wrap min-h-[100px]">
                        {editRecord.cr6df_beschreibung || "Keine Beschreibung"}
                      </p>
                    </div>

                    {/* Idee-Informationen */}
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Idee-Informationen</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Verantwortlicher</label>
                        <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                          {editRecord.cr6df_verantwortlichername || "–"}
                        </p>
                      </div>
                    </div>

                    {/* ITOT Board Bewertung */}
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">ITOT Board Bewertung</h3>
                      
                      {/* Typ (volle Breite) */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Typ</label>
                        <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                          {editRecord.cr6df_typ === 562520000 ? "Idee" :
                           editRecord.cr6df_typ === 562520001 ? "Vorhaben" :
                           editRecord.cr6df_typ === 562520002 ? "Projekt" : "–"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Komplexität</label>
                          <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                            {editRecord.cr6df_komplexitaet === 562520000 ? "Gering" :
                             editRecord.cr6df_komplexitaet === 562520001 ? "Mittel" :
                             editRecord.cr6df_komplexitaet === 562520002 ? "Hoch" : "Nicht bewertet"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Kritikalität</label>
                          <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                            {editRecord.cr6df_kritikalitaet === 562520000 ? "Gering" :
                             editRecord.cr6df_kritikalitaet === 562520001 ? "Mittel" :
                             editRecord.cr6df_kritikalitaet === 562520002 ? "Hoch" : "Nicht bewertet"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Aufwandschätzung */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Aufwandschätzung [in Tagen]</label>
                        <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                          {editRecord.cr6df_detailanalyse_personentage ?? "–"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">ITOT Board Begründung</label>
                        <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 whitespace-pre-wrap min-h-[60px]">
                          {editRecord.cr6df_itotboard_begruendung || "–"}
                        </p>
                      </div>
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
