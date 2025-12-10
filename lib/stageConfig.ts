/**
 * stageConfig.ts – Konfiguration für BPF-Phasen und Lifecycle-Status
 * 
 * Definiert die 4 Hauptphasen (Stages) und die zugehörigen Lifecycle-Statuses.
 * Wird verwendet um Ideen nach Phase zu gruppieren und anzuzeigen.
 */

// ============================================
// BPF-Phasen (Business Process Flow)
// ============================================

/**
 * Die 4 Hauptphasen im Idea-to-Solution Prozess
 */
export const BPF_PHASES = [
  "Initialisierung",
  "Analyse & Bewertung", 
  "Planung",
  "Umsetzung"
] as const;

export type BpfPhase = (typeof BPF_PHASES)[number];

/**
 * Konfiguration für jede Phase (Icon-Name, Farbe, Beschreibung)
 */
export const PHASE_CONFIG: Record<BpfPhase, {
  iconName: "Lightbulb" | "Search" | "FolderKanban" | "Rocket";
  colorClass: string;
  bgClass: string;
  description: string;
}> = {
  "Initialisierung": {
    iconName: "Lightbulb",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100",
    description: "Neue Ideen werden eingereicht und initial geprüft",
  },
  "Analyse & Bewertung": {
    iconName: "Search",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-100",
    description: "Detaillierte Analyse und Bewertung durch ITOT-Board",
  },
  "Planung": {
    iconName: "FolderKanban",
    colorClass: "text-violet-600",
    bgClass: "bg-violet-100",
    description: "Konkrete Planung und Aufnahme ins Portfolio",
  },
  "Umsetzung": {
    iconName: "Rocket",
    colorClass: "text-green-600",
    bgClass: "bg-green-100",
    description: "Aktive Umsetzung und Abschluss",
  },
};

// ============================================
// Lifecycle-Status Mapping
// ============================================

/**
 * Mapping von Dataverse Picklist-Werten zu Labels
 * Die Werte entsprechen cr6df_lifecyclestatus
 */
export const LIFECYCLE_STATUS_MAP: Record<number, {
  label: string;
  phase: BpfPhase;
  colorClass: string;
  bgClass: string;
}> = {
  // Initialisierung (Blau)
  562520000: {
    label: "eingereicht",
    phase: "Initialisierung",
    colorClass: "text-blue-700",
    bgClass: "bg-blue-100",
  },
  562520001: {
    label: "Idee in Qualitätsprüfung",
    phase: "Initialisierung",
    colorClass: "text-blue-700",
    bgClass: "bg-blue-100",
  },
  562520002: {
    label: "Idee zur Überarbeitung an Ideengeber",
    phase: "Initialisierung",
    colorClass: "text-blue-700",
    bgClass: "bg-blue-100",
  },
  
  // Analyse & Bewertung (Amber)
  562520009: {
    label: "Idee in Detailanalyse",
    phase: "Analyse & Bewertung",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-100",
  },
  562520003: {
    label: "Genehmigt",
    phase: "Analyse & Bewertung",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-100",
  },
  562520004: {
    label: "Abgelehnt",
    phase: "Analyse & Bewertung",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-100",
  },
  562520005: {
    label: "Idee wird ITOT-Board vorgestellt",
    phase: "Analyse & Bewertung",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-100",
  },
  
  // Planung (Violett)
  562520006: {
    label: "Idee in Projektportfolio aufgenommen",
    phase: "Planung",
    colorClass: "text-violet-700",
    bgClass: "bg-violet-100",
  },
  562520007: {
    label: "Idee in Quartalsplanung aufgenommen",
    phase: "Planung",
    colorClass: "text-violet-700",
    bgClass: "bg-violet-100",
  },
  562520008: {
    label: "Idee in Wochenplanung aufgenommen",
    phase: "Planung",
    colorClass: "text-violet-700",
    bgClass: "bg-violet-100",
  },
  
  // Umsetzung (Grün)
  562520010: {
    label: "In Umsetzung",
    phase: "Umsetzung",
    colorClass: "text-green-700",
    bgClass: "bg-green-100",
  },
  562520011: {
    label: "Abgeschlossen",
    phase: "Umsetzung",
    colorClass: "text-green-700",
    bgClass: "bg-green-100",
  },
};

/**
 * Hilfsfunktion: Lifecycle-Status-Code zu Label
 */
export function getStatusLabel(statusCode?: number): string {
  if (statusCode === undefined) return "Unbekannt";
  return LIFECYCLE_STATUS_MAP[statusCode]?.label ?? "Unbekannt";
}

/**
 * Hilfsfunktion: Lifecycle-Status-Code zu Phase
 */
export function getPhaseForStatus(statusCode?: number): BpfPhase | null {
  if (statusCode === undefined) return null;
  return LIFECYCLE_STATUS_MAP[statusCode]?.phase ?? null;
}

/**
 * Hilfsfunktion: Status-Badge Klassen
 */
export function getStatusClasses(statusCode?: number): { colorClass: string; bgClass: string } {
  if (statusCode === undefined) {
    return { colorClass: "text-gray-500", bgClass: "bg-gray-100" };
  }
  const config = LIFECYCLE_STATUS_MAP[statusCode];
  return config 
    ? { colorClass: config.colorClass, bgClass: config.bgClass }
    : { colorClass: "text-gray-500", bgClass: "bg-gray-100" };
}
