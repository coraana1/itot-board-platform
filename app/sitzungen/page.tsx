/**
 * ITOT Board Sitzungen Seite
 * Zeigt alle ITOT Board Sitzungen aus Dataverse an
 * Ermöglicht das Zuweisen von Ideen zu Sitzungen
 * Bietet Listen- und Kalenderansicht
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, FileText, RefreshCw, Plus, Check, Lightbulb, List, ChevronLeft, ChevronRight, ChevronDown, CalendarDays, Pencil, Search, User } from "lucide-react";
import LoginPrompt from "@/components/dataverse/LoginPrompt";
import WhoAmICard from "@/components/dataverse/WhoAmICard";
import DigitalisierungsvorhabenForm from "@/components/dataverse/DigitalisierungsvorhabenForm";
import { ITOTBoardSitzung, DataverseListResponse, DigitalisierungsvorhabenRecord, Mitarbeitende, DigitalisierungsvorhabenInput } from "@/lib/services/dataverse/types";

export default function SitzungenPage() {
  // Hilfsfunktion für heutiges Datum (YYYY-MM-DD)
  const getTodayString = () => new Date().toISOString().split("T")[0];

  // Auth-State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Daten-State
  const [sitzungen, setSitzungen] = useState<ITOTBoardSitzung[]>([]);
  const [ideen, setIdeen] = useState<DigitalisierungsvorhabenRecord[]>([]);
  const [mitarbeitende, setMitarbeitende] = useState<Mitarbeitende[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ansicht-State (list oder calendar)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Detail-Modal State
  const [selectedSitzung, setSelectedSitzung] = useState<ITOTBoardSitzung | null>(null);
  
  // Bearbeitungs-State für Sitzung
  const [editProtokoll, setEditProtokoll] = useState("");
  const [editTeilnehmerId, setEditTeilnehmerId] = useState("");
  const [editSitzungsdatum, setEditSitzungsdatum] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Idee-Zuweisung State (Multi-Select)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningSitzung, setAssigningSitzung] = useState<ITOTBoardSitzung | null>(null);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");

  // Neue Sitzung erstellen State
  const [showNewSitzungModal, setShowNewSitzungModal] = useState(false);
  const [newSitzungDatum, setNewSitzungDatum] = useState(getTodayString());
  const [newSitzungTeilnehmerId, setNewSitzungTeilnehmerId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Idee bearbeiten State
  const [editingIdee, setEditingIdee] = useState<DigitalisierungsvorhabenRecord | null>(null);

  // Collapsible Sitzungen State
  const [collapsedSitzungen, setCollapsedSitzungen] = useState<Record<string, boolean>>({});

  // Toggle Sitzung ein-/ausklappen
  const toggleSitzung = (sitzungId: string) => {
    setCollapsedSitzungen(prev => ({ ...prev, [sitzungId]: !prev[sitzungId] }));
  };

  // Datum-Filter State (Standard: heutiges Datum als "Von")
  const [dateRangeStart, setDateRangeStart] = useState(getTodayString());
  const [dateRangeEnd, setDateRangeEnd] = useState("");

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

  // Sitzungen laden
  const loadSitzungen = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/dataverse/sitzungen");
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error("Fehler beim Laden der Sitzungen");
      }
      
      const data: DataverseListResponse<ITOTBoardSitzung> = await response.json();
      setSitzungen(data.value || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ideen laden (für Dropdown)
  const loadIdeen = useCallback(async () => {
    try {
      const response = await fetch("/api/dataverse/digitalisierungsvorhaben");
      
      if (!response.ok) {
        return;
      }
      
      const data: DataverseListResponse<DigitalisierungsvorhabenRecord> = await response.json();
      setIdeen(data.value || []);
    } catch (err) {
      console.error("Fehler beim Laden der Ideen:", err);
    }
  }, []);

  // Mitarbeitende laden (für Teilnehmer-Dropdown)
  const loadMitarbeitende = useCallback(async () => {
    try {
      const response = await fetch("/api/dataverse/mitarbeitende");
      
      if (!response.ok) {
        return;
      }
      
      const data: DataverseListResponse<Mitarbeitende> = await response.json();
      setMitarbeitende(data.value || []);
    } catch (err) {
      console.error("Fehler beim Laden der Mitarbeitenden:", err);
    }
  }, []);

  // Auth prüfen beim Start
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Sitzungen, Ideen und Mitarbeitende laden wenn authentifiziert
  useEffect(() => {
    if (isAuthenticated) {
      loadSitzungen();
      loadIdeen();
      loadMitarbeitende();
    }
  }, [isAuthenticated, loadSitzungen, loadIdeen, loadMitarbeitende]);

  // Login-Handler
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadSitzungen();
    loadIdeen();
    loadMitarbeitende();
  };

  // Logout-Handler
  const handleLogout = async () => {
    try {
      await fetch("/api/dataverse/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setSitzungen([]);
      setIdeen([]);
    } catch (error) {
      console.error("Logout-Fehler:", error);
    }
  };

  // Mehrere Ideen einer Sitzung zuweisen
  const handleAssignIdeas = async () => {
    if (!assigningSitzung || selectedIdeaIds.length === 0) return;
    
    setIsAssigning(true);
    setAssignSuccess(false);
    
    try {
      // Alle ausgewählten Ideen nacheinander zuweisen
      for (const ideaId of selectedIdeaIds) {
        const response = await fetch("/api/dataverse/sitzungen/assign", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ideaId: ideaId,
            sitzungId: assigningSitzung.cr6df_itotboardsitzungid,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Fehler beim Zuweisen der Idee ${ideaId}`);
        }
      }
      
      setAssignSuccess(true);
      // Nach 1.5s Modal schliessen und Ideen neu laden
      setTimeout(() => {
        setShowAssignModal(false);
        setAssigningSitzung(null);
        setSelectedIdeaIds([]);
        setAssignSuccess(false);
        loadIdeen();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Zuweisen");
    } finally {
      setIsAssigning(false);
    }
  };

  // Idee zur Auswahl hinzufügen/entfernen (Toggle)
  const toggleIdeaSelection = (ideaId: string) => {
    setSelectedIdeaIds(prev => 
      prev.includes(ideaId) 
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    );
  };

  // Modal zum Zuweisen öffnen
  const openAssignModal = (sitzung: ITOTBoardSitzung) => {
    setAssigningSitzung(sitzung);
    setSelectedIdeaIds([]);
    setAssignSearchQuery("");
    setShowAssignModal(true);
  };

  // Neue Sitzung erstellen
  const handleCreateSitzung = async () => {
    if (!newSitzungDatum) return;
    
    setIsCreating(true);
    setCreateSuccess(false);
    
    try {
      const response = await fetch("/api/dataverse/sitzungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sitzungsdatum: newSitzungDatum,
          teilnehmerId: newSitzungTeilnehmerId || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Fehler beim Erstellen");
      }
      
      setCreateSuccess(true);
      // Nach 1.5s Modal schliessen und Sitzungen neu laden
      setTimeout(() => {
        setShowNewSitzungModal(false);
        setNewSitzungDatum(getTodayString());
        setNewSitzungTeilnehmerId("");
        setCreateSuccess(false);
        loadSitzungen();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setIsCreating(false);
    }
  };

  // Modal für neue Sitzung öffnen
  const openNewSitzungModal = () => {
    setNewSitzungDatum(getTodayString());
    setNewSitzungTeilnehmerId("");
    setCreateSuccess(false);
    setShowNewSitzungModal(true);
  };

  // Idee bearbeiten (Update in Dataverse)
  const handleUpdateIdee = async (data: DigitalisierungsvorhabenInput) => {
    if (!editingIdee) return;

    const response = await fetch(
      `/api/dataverse/digitalisierungsvorhaben/${editingIdee.cr6df_sgsw_digitalisierungsvorhabenid}`,
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

    // Modal schliessen und Ideen neu laden
    setEditingIdee(null);
    loadIdeen();
  };

  // Sitzung Details öffnen (mit Bearbeitungswerten)
  const openSitzungDetails = (sitzung: ITOTBoardSitzung) => {
    setSelectedSitzung(sitzung);
    setEditProtokoll(sitzung.cr6df_protokoll || "");
    setEditTeilnehmerId(sitzung._cr6df_teilnehmer_value || "");
    // Datum für Input formatieren (YYYY-MM-DD)
    setEditSitzungsdatum(sitzung.cr6df_sitzungsdatum ? sitzung.cr6df_sitzungsdatum.split("T")[0] : "");
    setSaveSuccess(false);
  };

  // Sitzung speichern
  const handleSaveSitzung = async () => {
    if (!selectedSitzung?.cr6df_itotboardsitzungid) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const response = await fetch(`/api/dataverse/sitzungen/${selectedSitzung.cr6df_itotboardsitzungid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protokoll: editProtokoll,
          teilnehmerId: editTeilnehmerId || null,
          sitzungsdatum: editSitzungsdatum || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Speichern fehlgeschlagen:", errorData);
        throw new Error(errorData.details || errorData.error || "Fehler beim Speichern");
      }
      
      setSaveSuccess(true);
      
      // Sitzungen neu laden um die Änderungen zu sehen
      await loadSitzungen();
      
      // Aktualisierte Sitzung im State aktualisieren
      setSelectedSitzung(prev => prev ? {
        ...prev,
        cr6df_protokoll: editProtokoll,
        _cr6df_teilnehmer_value: editTeilnehmerId || undefined,
        cr6df_sitzungsdatum: editSitzungsdatum || undefined,
      } : null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  // Datum formatieren
  const formatDate = (dateString?: string) => {
    if (!dateString) return "–";
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Ideen filtern die noch keiner Sitzung zugewiesen sind
  const unassignedIdeen = ideen.filter(idee => !idee._cr6df_itotboardsitzung_value);
  
  // Ideen die dieser Sitzung zugewiesen sind
  const getAssignedIdeen = (sitzungId?: string) => {
    if (!sitzungId) return [];
    return ideen.filter(idee => idee._cr6df_itotboardsitzung_value === sitzungId);
  };

  // ============================================
  // Gefilterte Sitzungen
  // ============================================
  
  const filteredSitzungen = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sitzungen.filter(sitzung => {
      if (!sitzung.cr6df_sitzungsdatum) return false;
      
      const sitzungDate = new Date(sitzung.cr6df_sitzungsdatum);
      sitzungDate.setHours(0, 0, 0, 0);
      
      // Filter: Datum-Range Start (Standard: heute)
      if (dateRangeStart) {
        const startDate = new Date(dateRangeStart);
        startDate.setHours(0, 0, 0, 0);
        if (sitzungDate < startDate) return false;
      }
      
      // Filter: Datum-Range Ende
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        if (sitzungDate > endDate) return false;
      }
      
      return true;
    });
  }, [sitzungen, dateRangeStart, dateRangeEnd]);

  // ============================================
  // Kalender-Funktionen
  // ============================================
  
  // Kalender-Tage generieren (Montag bis Sonntag)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Erster Tag des Monats
    const firstDay = new Date(year, month, 1);
    // Letzter Tag des Monats
    const lastDay = new Date(year, month + 1, 0);
    
    // Wochentag des ersten Tags (0 = Sonntag, 1 = Montag, ...)
    // Umrechnen auf Montag = 0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // Sonntag wird zu 6
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Tage vom vorherigen Monat
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Tage des aktuellen Monats
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Tage des nächsten Monats (bis 42 Tage für 6 Wochen)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [currentMonth]);

  // Sitzungen für ein bestimmtes Datum
  const getSitzungenForDate = (date: Date) => {
    return sitzungen.filter(sitzung => {
      if (!sitzung.cr6df_sitzungsdatum) return false;
      const sitzungDate = new Date(sitzung.cr6df_sitzungsdatum);
      return (
        sitzungDate.getDate() === date.getDate() &&
        sitzungDate.getMonth() === date.getMonth() &&
        sitzungDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Prüfen ob ein Datum heute ist
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Monat wechseln
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Monat formatieren
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth wird geprüft */}
      {isCheckingAuth && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-violet-600" />
          <span className="ml-2 text-gray-600">Prüfe Authentifizierung...</span>
        </div>
      )}

      {/* Nicht authentifiziert */}
      {!isCheckingAuth && !isAuthenticated && (
        <div className="p-8">
          <LoginPrompt onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {/* Authentifiziert */}
      {!isCheckingAuth && isAuthenticated && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Calendar size={22} className="text-violet-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ITOT Board Sitzungen</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Ansicht-Umschalter */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-violet-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List size={16} />
                  Liste
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "calendar"
                      ? "bg-white text-violet-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <CalendarDays size={16} />
                  Kalender
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadSitzungen}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>

              {/* Neue Sitzung Button */}
              <button
                onClick={openNewSitzungModal}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Neue Sitzung
              </button>
            </div>
          </div>

          {/* Verbindungsstatus (versteckt) */}
          <div className="hidden">
            <WhoAmICard onLogout={() => handleLogout()} />
          </div>

          {/* Filter-Leiste (nur in Listenansicht) */}
          {viewMode === "list" && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Datum-Range */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Von:</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {dateRangeStart && (
                    <button
                      onClick={() => setDateRangeStart("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Bis:</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {dateRangeEnd && (
                    <button
                      onClick={() => setDateRangeEnd("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter zurücksetzen (zeigt heutiges Datum wieder) */}
              {(dateRangeStart !== getTodayString() || dateRangeEnd) && (
                <button
                  onClick={() => {
                    setDateRangeStart(getTodayString());
                    setDateRangeEnd("");
                  }}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Filter zurücksetzen
                </button>
              )}

              {/* Anzahl gefilterte Sitzungen */}
              <div className="ml-auto">
                <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">
                  {filteredSitzungen.length} von {sitzungen.length} Sitzungen
                </span>
              </div>
            </div>
          </div>
          )}

          {/* Fehler-Anzeige */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin text-violet-600" />
              <span className="ml-2 text-gray-600">Lade Sitzungen...</span>
            </div>
          )}

          {/* Keine Sitzungen */}
          {!isLoading && sitzungen.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Keine Sitzungen gefunden.
            </div>
          )}

          {/* Keine Sitzungen nach Filter */}
          {!isLoading && sitzungen.length > 0 && filteredSitzungen.length === 0 && viewMode === "list" && (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={32} className="mx-auto mb-3 text-gray-300" />
              <p>Keine Sitzungen entsprechen den Filterkriterien.</p>
              <button
                onClick={() => {
                  setDateRangeStart("");
                  setDateRangeEnd("");
                }}
                className="mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Alle Sitzungen anzeigen
              </button>
            </div>
          )}

          {/* ============================================ */}
          {/* LISTENANSICHT */}
          {/* ============================================ */}
          {!isLoading && filteredSitzungen.length > 0 && viewMode === "list" && (
            <div className="space-y-4">
              {filteredSitzungen.map((sitzung) => {
                const assignedIdeen = getAssignedIdeen(sitzung.cr6df_itotboardsitzungid);
                const isCollapsed = collapsedSitzungen[sitzung.cr6df_itotboardsitzungid!];
                
                return (
                  <div
                    key={sitzung.cr6df_itotboardsitzungid}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                  >
                    {/* Sitzungs-Header (klickbar zum Ein-/Ausklappen) */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleSitzung(sitzung.cr6df_itotboardsitzungid!)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Collapse Icon */}
                        <div className={`transition-transform ${isCollapsed ? "" : "rotate-0"}`}>
                          {isCollapsed ? (
                            <ChevronRight size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </div>
                        
                        {/* Sitzungs-Info */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {sitzung.cr6df_sitzungid || "Ohne ID"}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(sitzung.cr6df_sitzungsdatum)}
                            </span>
                            {sitzung.cr6df_protokoll && (
                              <span className="flex items-center gap-1">
                                <FileText size={14} />
                                Protokoll
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Lightbulb size={14} />
                              {assignedIdeen.length} Idee{assignedIdeen.length !== 1 ? "n" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSitzungDetails(sitzung);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                          Bearbeiten
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAssignModal(sitzung);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                          Idee zuweisen
                        </button>
                      </div>
                    </div>
                    
                    {/* Zugewiesene Ideen Subtabelle (nur wenn nicht eingeklappt) */}
                    {!isCollapsed && assignedIdeen.length > 0 && (
                      <div className="border-t border-gray-100 bg-gray-50/50">
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-wider">
                              <th className="px-4 py-2 text-left font-medium">Titel</th>
                              <th className="px-4 py-2 text-left font-medium">Typ</th>
                              <th className="px-4 py-2 text-left font-medium">Komplexität</th>
                              <th className="px-4 py-2 text-left font-medium">Kritikalität</th>
                              <th className="px-4 py-2 text-left font-medium">Aufwand</th>
                              <th className="px-4 py-2 text-right font-medium">Aktion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedIdeen.map((idee) => (
                              <tr 
                                key={idee.cr6df_sgsw_digitalisierungsvorhabenid}
                                className="border-t border-gray-100 hover:bg-white transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <span className="font-medium text-gray-900">
                                    {idee.cr6df_name || "Ohne Titel"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {idee.cr6df_typ === 562520000 ? "Idee" :
                                   idee.cr6df_typ === 562520001 ? "Vorhaben" :
                                   idee.cr6df_typ === 562520002 ? "Projekt" : "–"}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    idee.cr6df_komplexitaet === 562520002 ? "bg-green-100 text-green-700" :
                                    idee.cr6df_komplexitaet === 562520001 ? "bg-yellow-100 text-yellow-700" :
                                    idee.cr6df_komplexitaet === 562520000 ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-500"
                                  }`}>
                                    {idee.cr6df_komplexitaet === 562520002 ? "Einfach" :
                                     idee.cr6df_komplexitaet === 562520001 ? "Mittel" :
                                     idee.cr6df_komplexitaet === 562520000 ? "Komplex" : "–"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    idee.cr6df_kritikalitaet === 562520002 ? "bg-green-100 text-green-700" :
                                    idee.cr6df_kritikalitaet === 562520001 ? "bg-yellow-100 text-yellow-700" :
                                    idee.cr6df_kritikalitaet === 562520000 ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-500"
                                  }`}>
                                    {idee.cr6df_kritikalitaet === 562520002 ? "Niedrig" :
                                     idee.cr6df_kritikalitaet === 562520001 ? "Mittel" :
                                     idee.cr6df_kritikalitaet === 562520000 ? "Hoch" : "–"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {idee.cr6df_detailanalyse_personentage ? `${idee.cr6df_detailanalyse_personentage} Tage` : "–"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => setEditingIdee(idee)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                  >
                                    <Pencil size={14} />
                                    Bearbeiten
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Keine Ideen Hinweis */}
                    {!isCollapsed && assignedIdeen.length === 0 && (
                      <div className="border-t border-gray-100 px-4 py-6 text-center text-sm text-gray-500">
                        <Lightbulb size={24} className="mx-auto mb-2 text-gray-300" />
                        Keine Ideen zugewiesen
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================ */}
          {/* KALENDERANSICHT */}
          {/* ============================================ */}
          {!isLoading && viewMode === "calendar" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              {/* Kalender-Header mit Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {formatMonth(currentMonth)}
                  </h2>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    Heute
                  </button>
                </div>
                
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Wochentage Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Kalender-Tage */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const daySitzungen = getSitzungenForDate(day.date);
                  const today = isToday(day.date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 rounded-lg border transition-colors ${
                        day.isCurrentMonth
                          ? "bg-white border-gray-100"
                          : "bg-gray-50 border-gray-50"
                      } ${today ? "ring-2 ring-violet-500 ring-inset" : ""}`}
                    >
                      {/* Datum */}
                      <div
                        className={`text-sm font-medium mb-1 ${
                          today
                            ? "text-violet-600"
                            : day.isCurrentMonth
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {day.date.getDate()}
                      </div>
                      
                      {/* Sitzungen an diesem Tag */}
                      <div className="space-y-1">
                        {daySitzungen.map((sitzung) => (
                          <button
                            key={sitzung.cr6df_itotboardsitzungid}
                            onClick={() => openSitzungDetails(sitzung)}
                            className="w-full text-left px-2 py-1 text-xs bg-violet-100 text-violet-700 rounded truncate hover:bg-violet-200 transition-colors"
                          >
                            {sitzung.cr6df_sitzungid || "Sitzung"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detail-Modal */}
          {selectedSitzung && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                    <Calendar size={24} className="text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">Sitzung Details</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(selectedSitzung.cr6df_sitzungsdatum)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSitzung(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Sitzungs-ID */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Sitzungs-ID</label>
                  <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    {selectedSitzung.cr6df_sitzungid || "–"}
                  </p>
                </div>

                {/* Datum (editierbar) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitzungsdatum</label>
                  <input
                    type="date"
                    value={editSitzungsdatum}
                    onChange={(e) => setEditSitzungsdatum(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Teilnehmer (editierbar - Dropdown) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teilnehmer</label>
                  <select
                    value={editTeilnehmerId}
                    onChange={(e) => setEditTeilnehmerId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">-- Kein Teilnehmer --</option>
                    {mitarbeitende.map((ma) => (
                      <option key={ma.cr6df_sgsw_mitarbeitendeid} value={ma.cr6df_sgsw_mitarbeitendeid}>
                        {ma.cr6df_email || ""} {ma.cr6df_nachname || ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Protokoll (editierbar) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Protokoll</label>
                  <textarea
                    value={editProtokoll}
                    onChange={(e) => setEditProtokoll(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    placeholder="Protokoll der Sitzung..."
                  />
                </div>

                {/* Erfolgs-Anzeige */}
                {saveSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-4">
                    <Check size={18} />
                    <span>Änderungen gespeichert!</span>
                  </div>
                )}

                {/* System-Infos */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">System-Informationen</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Erstellt am:</span>
                      <span className="ml-2 text-gray-700">
                        {selectedSitzung.createdon 
                          ? new Date(selectedSitzung.createdon).toLocaleDateString("de-CH")
                          : "–"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Geändert am:</span>
                      <span className="ml-2 text-gray-700">
                        {selectedSitzung.modifiedon 
                          ? new Date(selectedSitzung.modifiedon).toLocaleDateString("de-CH")
                          : "–"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedSitzung(null)}
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Schliessen
                  </button>
                  <button
                    onClick={handleSaveSitzung}
                    disabled={isSaving}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Speichern...
                      </>
                    ) : (
                      "Speichern"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Idee zuweisen Modal (Multi-Select) */}
          {showAssignModal && assigningSitzung && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <Plus size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Ideen zuweisen</h2>
                    <p className="text-sm text-gray-500">{assigningSitzung.cr6df_sitzungid}</p>
                  </div>
                </div>

                {/* Erfolgs-Anzeige */}
                {assignSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-4">
                    <Check size={20} />
                    <span>{selectedIdeaIds.length} Idee(n) erfolgreich zugewiesen!</span>
                  </div>
                )}

                {/* Multi-Select Liste */}
                {!assignSuccess && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ideen auswählen (Mehrfachauswahl möglich)
                      </label>
                      
                      {/* Suchfeld */}
                      <div className="relative mb-3">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Ideen durchsuchen..."
                          value={assignSearchQuery}
                          onChange={(e) => setAssignSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                      
                      {unassignedIdeen.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          Keine unzugewiesenen Ideen vorhanden.
                        </p>
                      ) : (
                        <>
                          {/* Gefilterte Ideen */}
                          {(() => {
                            const filteredIdeen = unassignedIdeen.filter((idee) => {
                              if (!assignSearchQuery) return true;
                              const query = assignSearchQuery.toLowerCase();
                              return (
                                idee.cr6df_name?.toLowerCase().includes(query) ||
                                idee.cr6df_beschreibung?.toLowerCase().includes(query) ||
                                idee.cr6df_verantwortlichername?.toLowerCase().includes(query) ||
                                idee.cr6df_ideengebername?.toLowerCase().includes(query)
                              );
                            });
                            
                            if (filteredIdeen.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <p>Keine Ideen gefunden für "{assignSearchQuery}"</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="border border-gray-200 rounded-lg max-h-[50vh] overflow-y-auto">
                                {filteredIdeen.map((idee) => (
                                  <label
                                    key={idee.cr6df_sgsw_digitalisierungsvorhabenid}
                                    className={`block p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                      selectedIdeaIds.includes(idee.cr6df_sgsw_digitalisierungsvorhabenid!)
                                        ? "bg-violet-50"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={selectedIdeaIds.includes(idee.cr6df_sgsw_digitalisierungsvorhabenid!)}
                                        onChange={() => toggleIdeaSelection(idee.cr6df_sgsw_digitalisierungsvorhabenid!)}
                                        className="w-4 h-4 mt-1 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                      />
                                      <div className="flex-1 min-w-0">
                                        {/* Titel */}
                                        <p className="font-medium text-gray-900">
                                          {idee.cr6df_name || "Ohne Titel"}
                                        </p>
                                        
                                        {/* Beschreibung */}
                                        {idee.cr6df_beschreibung && (
                                          <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                                            {idee.cr6df_beschreibung}
                                          </p>
                                        )}
                                        
                                        {/* Metadaten (vereinfacht) */}
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                          {/* Verantwortlicher */}
                                          {idee.cr6df_verantwortlichername && (
                                            <span className="flex items-center gap-1">
                                              <User size={12} />
                                              {idee.cr6df_verantwortlichername}
                                            </span>
                                          )}
                                          
                                          {/* Ideengeber */}
                                          {idee.cr6df_ideengebername && (
                                            <span className="flex items-center gap-1">
                                              <Lightbulb size={12} />
                                              {idee.cr6df_ideengebername}
                                            </span>
                                          )}
                                          
                                          {/* Erstelldatum */}
                                          {idee.createdon && (
                                            <span className="flex items-center gap-1">
                                              <Calendar size={12} />
                                              {new Date(idee.createdon).toLocaleDateString("de-CH", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                              })}
                                            </span>
                                          )}
                                          
                                          {/* Aufwand */}
                                          {idee.cr6df_detailanalyse_personentage && (
                                            <span className="text-violet-600 font-medium">
                                              {idee.cr6df_detailanalyse_personentage} Tage
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      )}
                      {selectedIdeaIds.length > 0 && (
                        <p className="text-sm text-violet-600 mt-2 font-medium">
                          {selectedIdeaIds.length} Idee(n) ausgewählt
                        </p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowAssignModal(false);
                          setAssigningSitzung(null);
                          setSelectedIdeaIds([]);
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg transition-colors"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleAssignIdeas}
                        disabled={selectedIdeaIds.length === 0 || isAssigning}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isAssigning ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Wird zugewiesen...
                          </>
                        ) : (
                          `${selectedIdeaIds.length} Idee(n) zuweisen`
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Neue Sitzung Modal */}
          {showNewSitzungModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <Plus size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Neue Sitzung erstellen</h2>
                  </div>
                </div>

                {/* Erfolgs-Anzeige */}
                {createSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-4">
                    <Check size={20} />
                    <span>Sitzung erfolgreich erstellt!</span>
                  </div>
                )}

                {/* Formular */}
                {!createSuccess && (
                  <>
                    <div className="space-y-4 mb-6">
                      {/* Datum */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sitzungsdatum *
                        </label>
                        <input
                          type="date"
                          value={newSitzungDatum}
                          onChange={(e) => setNewSitzungDatum(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      {/* Teilnehmer */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teilnehmer (optional)
                        </label>
                        <select
                          value={newSitzungTeilnehmerId}
                          onChange={(e) => setNewSitzungTeilnehmerId(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="">-- Kein Teilnehmer --</option>
                          {mitarbeitende.map((ma) => (
                            <option key={ma.cr6df_sgsw_mitarbeitendeid} value={ma.cr6df_sgsw_mitarbeitendeid}>
                              {ma.cr6df_email || ""} {ma.cr6df_nachname || ""}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowNewSitzungModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg transition-colors"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleCreateSitzung}
                        disabled={!newSitzungDatum || isCreating}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isCreating ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Wird erstellt...
                          </>
                        ) : (
                          "Sitzung erstellen"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Idee bearbeiten Modal */}
          {editingIdee && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <DigitalisierungsvorhabenForm
                  editRecord={editingIdee}
                  onSubmit={handleUpdateIdee}
                  onCancel={() => setEditingIdee(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
