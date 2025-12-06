/**
 * types.ts – TypeScript-Typen für die ITOT Board Platform
 * 
 * Hier definieren wir die Datenstrukturen, die in der App verwendet werden.
 * Diese Typen basieren auf den Feldern aus dem PRD (Product Requirements Document).
 */

/**
 * Mögliche Werte für die Komplexität einer Idee
 * - gering: Einfach umzusetzen
 * - mittel: Mittlerer Aufwand
 * - hoch: Komplexe Umsetzung
 */
export type Komplexitaet = "gering" | "mittel" | "hoch";

/**
 * Mögliche Werte für die Kritikalität einer Idee
 * - gering: Wenig geschäftskritisch
 * - mittel: Mittlere Priorität
 * - hoch: Sehr wichtig für das Geschäft
 */
export type Kritikalitaet = "gering" | "mittel" | "hoch";

/**
 * Mögliche Lifecycle-Status einer Idee
 * Die App zeigt primär Ideen mit Status "Idee wird ITOT-Board vorgestellt"
 */
export type LifecycleStatus =
  | "Idee eingereicht"
  | "Idee wird ITOT-Board vorgestellt"
  | "ITOT-Board Bewertung abgeschlossen"
  | "In Umsetzung"
  | "Abgeschlossen"
  | "Abgelehnt";

/**
 * Idee – Hauptdatenstruktur für eine Digitalisierungs-Idee
 * 
 * Felder gemäss PRD Abschnitt 6.2:
 * - Einige Felder sind nur lesbar (vom Ideengeber ausgefüllt)
 * - Einige Felder sind vom ITOT Board editierbar
 */
export interface Idee {
  // Eindeutige ID (kommt aus Dataverse)
  id: string;

  // --- Nur lesbare Felder (vom Ideengeber) ---
  titel: string;
  beschreibung: string;
  typ: string;
  verantwortlicher: string;
  ideengeber: string;
  
  // Ergebnisse der Detailanalyse (falls vorhanden)
  detailanalyse_ergebnis?: string;
  detailanalyse_personentage?: number;
  detailanalyse_nutzen?: string;

  // --- Vom ITOT Board editierbare Felder ---
  komplexitaet?: Komplexitaet;
  kritikalitaet?: Kritikalitaet;
  itotBoard_begruendung?: string;
  
  // Lifecycle-Status (ITOT Board kann nur den ITOT-Schritt ändern)
  lifecyclestatus: LifecycleStatus;

  // --- Metadaten ---
  erstelltAm?: Date;
  aktualisiertAm?: Date;
}

/**
 * IdeenListeItem – Vereinfachte Version für die Listenansicht
 * Enthält nur die Felder, die in der Übersicht angezeigt werden
 */
export interface IdeenListeItem {
  id: string;
  titel: string;
  typ: string;
  verantwortlicher: string;
  ideengeber: string;
  lifecyclestatus: LifecycleStatus;
}

/**
 * ITOTBewertung – Die Felder, die das ITOT Board ausfüllt
 * Wird für das Formular verwendet
 */
export interface ITOTBewertung {
  komplexitaet: Komplexitaet;
  kritikalitaet: Kritikalitaet;
  itotBoard_begruendung: string;
}
