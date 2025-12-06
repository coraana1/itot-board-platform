/**
 * dataverse.ts – Dataverse API-Anbindung
 * 
 * Diese Datei enthält alle Funktionen für die Kommunikation mit Dataverse.
 * Aktuell mit Mock-Daten für die Entwicklung – später mit echter API-Anbindung.
 * 
 * WICHTIG: Die echte Anbindung erfordert:
 * 1. Umgebungsvariablen in .env.local (siehe .env.example)
 * 2. OAuth-Token-Handling für die Authentifizierung
 */

import type { Idee, IdeenListeItem } from "./types";

// ============================================================================
// KONFIGURATION
// ============================================================================

/**
 * Dataverse-Konfiguration aus Umgebungsvariablen
 * Diese Werte müssen in .env.local gesetzt werden
 */
const config = {
  url: process.env.DATAVERSE_URL || "",
  clientId: process.env.DATAVERSE_CLIENT_ID || "",
  clientSecret: process.env.DATAVERSE_CLIENT_SECRET || "",
  tenantId: process.env.DATAVERSE_TENANT_ID || "",
  tableName: process.env.DATAVERSE_TABLE_NAME || "cr_ideen",
};

/**
 * Prüft, ob die Dataverse-Konfiguration vollständig ist
 */
export function isDataverseConfigured(): boolean {
  return !!(config.url && config.clientId && config.clientSecret && config.tenantId);
}

// ============================================================================
// MOCK-DATEN FÜR ENTWICKLUNG
// ============================================================================

/**
 * Mock-Daten für die Entwicklung
 * Diese werden verwendet, solange Dataverse nicht konfiguriert ist
 */
const mockIdeen: Idee[] = [
  {
    id: "1",
    titel: "Automatisierte Rechnungsverarbeitung",
    beschreibung: "Eingehende Rechnungen sollen automatisch erfasst, kategorisiert und zur Freigabe weitergeleitet werden.",
    typ: "Prozessoptimierung",
    verantwortlicher: "Max Müller",
    ideengeber: "Anna Schmidt",
    detailanalyse_ergebnis: "Machbar mit OCR-Technologie und Workflow-Automatisierung",
    detailanalyse_personentage: 45,
    detailanalyse_nutzen: "Zeitersparnis von ca. 20 Stunden pro Woche",
    lifecyclestatus: "Idee wird ITOT-Board vorgestellt",
  },
  {
    id: "2",
    titel: "Kunden-Self-Service Portal",
    beschreibung: "Kunden sollen ihre Bestellungen, Rechnungen und Support-Tickets selbst online verwalten können.",
    typ: "Digitalisierung",
    verantwortlicher: "Lisa Weber",
    ideengeber: "Thomas Huber",
    detailanalyse_ergebnis: "Technisch umsetzbar, Integration mit ERP erforderlich",
    detailanalyse_personentage: 120,
    detailanalyse_nutzen: "Reduktion der Support-Anfragen um 30%",
    lifecyclestatus: "Idee wird ITOT-Board vorgestellt",
  },
  {
    id: "3",
    titel: "Mobile Zeiterfassung",
    beschreibung: "Mitarbeiter im Aussendienst sollen ihre Arbeitszeiten per Smartphone-App erfassen können.",
    typ: "Mobile App",
    verantwortlicher: "Peter Keller",
    ideengeber: "Sandra Meier",
    detailanalyse_ergebnis: "Standard-App verfügbar, Anpassungen nötig",
    detailanalyse_personentage: 25,
    detailanalyse_nutzen: "Echtzeit-Übersicht, weniger Papierkram",
    komplexitaet: "mittel",
    kritikalitaet: "gering",
    itotBoard_begruendung: "Gute Idee, aber nicht geschäftskritisch. Kann in Q3 umgesetzt werden.",
    lifecyclestatus: "ITOT-Board Bewertung abgeschlossen",
  },
  {
    id: "4",
    titel: "KI-gestützte Angebotserstellung",
    beschreibung: "Angebote sollen basierend auf historischen Daten und Kundenanforderungen automatisch erstellt werden.",
    typ: "KI/ML",
    verantwortlicher: "Julia Brunner",
    ideengeber: "Marco Frei",
    lifecyclestatus: "Idee wird ITOT-Board vorgestellt",
  },
];

// ============================================================================
// API-FUNKTIONEN
// ============================================================================

/**
 * Holt alle Ideen, die zur ITOT-Board-Bewertung anstehen
 * Filtert nach Status "Idee wird ITOT-Board vorgestellt"
 */
export async function getIdeenZurBewertung(): Promise<IdeenListeItem[]> {
  // TODO: Echte Dataverse-API-Anfrage implementieren
  if (!isDataverseConfigured()) {
    // Mock-Daten zurückgeben
    return mockIdeen
      .filter((idee) => idee.lifecyclestatus === "Idee wird ITOT-Board vorgestellt")
      .map((idee) => ({
        id: idee.id,
        titel: idee.titel,
        typ: idee.typ,
        verantwortlicher: idee.verantwortlicher,
        ideengeber: idee.ideengeber,
        lifecyclestatus: idee.lifecyclestatus,
      }));
  }

  // Echte API-Anfrage (Platzhalter)
  // const token = await getAccessToken();
  // const response = await fetch(`${config.url}/api/data/v9.2/${config.tableName}?$filter=...`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // return response.json();
  
  return [];
}

/**
 * Holt alle Ideen (für die Übersichtsseite)
 */
export async function getAlleIdeen(): Promise<IdeenListeItem[]> {
  if (!isDataverseConfigured()) {
    return mockIdeen.map((idee) => ({
      id: idee.id,
      titel: idee.titel,
      typ: idee.typ,
      verantwortlicher: idee.verantwortlicher,
      ideengeber: idee.ideengeber,
      lifecyclestatus: idee.lifecyclestatus,
    }));
  }

  return [];
}

/**
 * Holt eine einzelne Idee anhand ihrer ID
 */
export async function getIdeeById(id: string): Promise<Idee | null> {
  if (!isDataverseConfigured()) {
    return mockIdeen.find((idee) => idee.id === id) || null;
  }

  return null;
}

/**
 * Aktualisiert die ITOT-Board-Bewertung einer Idee
 */
export async function updateITOTBewertung(
  id: string,
  bewertung: {
    komplexitaet: string;
    kritikalitaet: string;
    itotBoard_begruendung: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isDataverseConfigured()) {
    // Mock: Simuliere erfolgreiche Aktualisierung
    const idee = mockIdeen.find((i) => i.id === id);
    if (!idee) {
      return { success: false, error: "Idee nicht gefunden" };
    }
    
    // In echtem Code würde hier die Datenbank aktualisiert
    console.log("Mock: Bewertung aktualisiert", { id, bewertung });
    return { success: true };
  }

  return { success: false, error: "Dataverse nicht konfiguriert" };
}

/**
 * Aktualisiert den Lifecycle-Status einer Idee
 */
export async function updateLifecycleStatus(
  id: string,
  neuerStatus: string
): Promise<{ success: boolean; error?: string }> {
  if (!isDataverseConfigured()) {
    const idee = mockIdeen.find((i) => i.id === id);
    if (!idee) {
      return { success: false, error: "Idee nicht gefunden" };
    }
    
    console.log("Mock: Status aktualisiert", { id, neuerStatus });
    return { success: true };
  }

  return { success: false, error: "Dataverse nicht konfiguriert" };
}

// ============================================================================
// OAUTH TOKEN HANDLING (Platzhalter)
// ============================================================================

/**
 * Holt einen OAuth Access Token für Dataverse
 * 
 * TODO: Implementieren wenn Dataverse-Credentials vorhanden
 * 
 * Ablauf:
 * 1. POST an https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
 * 2. Mit client_id, client_secret, scope (https://org.crm4.dynamics.com/.default)
 * 3. Token cachen und bei Ablauf erneuern
 */
// async function getAccessToken(): Promise<string> {
//   const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
//   
//   const response = await fetch(tokenUrl, {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({
//       client_id: config.clientId,
//       client_secret: config.clientSecret,
//       scope: `${config.url}/.default`,
//       grant_type: "client_credentials",
//     }),
//   });
//   
//   const data = await response.json();
//   return data.access_token;
// }
