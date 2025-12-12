/**
 * digitalisierungsvorhabenService.ts – Service für Digitalisierungsvorhaben
 * 
 * Spezifischer Service für die Tabelle cr6df_sgsw_digitalisierungsvorhaben.
 * Erweitert den generischen BaseDataverseClient mit typisierten Methoden.
 */

import { BaseDataverseClient } from "./dataverseClient";
import type {
  DigitalisierungsvorhabenRecord,
  DigitalisierungsvorhabenInput,
} from "./types";

// EntitySetName für die Tabelle (Plural!)
const ENTITY_SET_NAME = "cr6df_sgsw_digitalisierungsvorhabens";

/**
 * Service-Klasse für Digitalisierungsvorhaben
 */
export class DigitalisierungsvorhabenService extends BaseDataverseClient<DigitalisierungsvorhabenRecord> {
  constructor() {
    super(ENTITY_SET_NAME);
  }

  /**
   * Holt alle Digitalisierungsvorhaben
   * Explizit alle relevanten Felder auswählen, damit nichts fehlt
   */
  async listAll(): Promise<DigitalisierungsvorhabenRecord[]> {
    return this.list({
      select: [
        "cr6df_sgsw_digitalisierungsvorhabenid",
        "cr6df_name",
        "cr6df_beschreibung",
        "cr6df_typ",
        "cr6df_lifecyclestatus",
        "cr6df_komplexitaet",
        "cr6df_kritikalitaet",
        "cr6df_prioritat",
        "cr6df_detailanalyse_personentage",
        "cr6df_detailanalyse_ergebnis",
        "cr6df_initalbewertung_begruendung",
        "cr6df_itotboard_begruendung",
        "cr6df_pia_pfad",
        "cr6df_istduplikat",
        "cr6df_abgelehnt_am",
        "cr6df_abgeschlossen_am",
        "cr6df_genehmigt_am",
        "cr6df_in_ueberarbeitung_am",
        "cr6df_pia_erstellt_am",
        "cr6df_planung_geplanterstart",
        "cr6df_planung_geplantesende",
        "_cr6df_itotboardsitzung_value",
        "_cr6df_verantwortlicher_value",
        "_cr6df_ideengeber_value",
        "_cr6df_abonnenten_value",
        "createdon",
        "modifiedon",
        "statecode",
        "statuscode",
      ],
      orderby: "createdon desc",
    });
  }

  /**
   * Holt ein Digitalisierungsvorhaben nach ID
   */
  async getById(id: string): Promise<DigitalisierungsvorhabenRecord> {
    return this.get(id);
  }

  /**
   * Erstellt ein neues Digitalisierungsvorhaben
   * 
   * Filtert leere Werte und ungültige Felder raus.
   */
  async createRecord(
    input: DigitalisierungsvorhabenInput
  ): Promise<DigitalisierungsvorhabenRecord> {
    const cleanedInput = this.cleanInput(input);
    return this.create(cleanedInput as DigitalisierungsvorhabenInput);
  }

  /**
   * Aktualisiert ein Digitalisierungsvorhaben
   * 
   * Filtert leere Werte und ungültige Felder raus.
   */
  async updateRecord(
    id: string,
    input: Partial<DigitalisierungsvorhabenInput>
  ): Promise<DigitalisierungsvorhabenRecord> {
    const cleanedInput = this.cleanInput(input);
    return this.update(id, cleanedInput as Partial<DigitalisierungsvorhabenInput>);
  }

  /**
   * Bereinigt Input-Daten für Dataverse
   * - Entfernt undefined und leere Strings
   * - Entfernt Felder die nicht in der Tabelle existieren
   */
  private cleanInput(input: Partial<DigitalisierungsvorhabenInput>): Record<string, unknown> {
    // Erlaubte Felder basierend auf Dataverse-Schema
    const allowedFields = [
      "cr6df_name",
      "cr6df_beschreibung",
      "cr6df_pia_pfad",
      "cr6df_detailanalyse_ergebnis",
      "cr6df_initalbewertung_begruendung",
      "cr6df_itotboard_begruendung",
      "cr6df_detailanalyse_personentage",
      "cr6df_typ",
      "cr6df_lifecyclestatus",
      "cr6df_komplexitaet",
      "cr6df_kritikalitaet",
      "cr6df_prioritat",
      "cr6df_istduplikat",
      "cr6df_abgelehnt_am",
      "cr6df_abgeschlossen_am",
      "cr6df_genehmigt_am",
      "cr6df_in_ueberarbeitung_am",
      "cr6df_pia_erstellt_am",
      "cr6df_planung_geplanterstart",
      "cr6df_planung_geplantesende",
    ];

    const cleanedInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // Nur erlaubte Felder mit gültigen Werten
      if (allowedFields.includes(key) && value !== undefined && value !== "") {
        cleanedInput[key] = value;
      }
    }
    return cleanedInput;
  }

  /**
   * Löscht ein Digitalisierungsvorhaben
   */
  async deleteRecord(id: string): Promise<{ success: boolean }> {
    return this.delete(id);
  }

  /**
   * Holt alle Vorhaben mit einem bestimmten Lifecycle-Status
   */
  async listByStatus(
    statusCode: number
  ): Promise<DigitalisierungsvorhabenRecord[]> {
    return this.list({
      filter: `cr6df_lifecyclestatus eq ${statusCode}`,
      orderby: "createdon desc",
    });
  }

  /**
   * Sucht Vorhaben nach Name (enthält)
   */
  async searchByName(name: string): Promise<DigitalisierungsvorhabenRecord[]> {
    return this.list({
      filter: `contains(cr6df_name, '${name}')`,
      orderby: "cr6df_name asc",
    });
  }

  /**
   * Aktualisiert nur die ITOT Board Bewertungsfelder
   */
  async updateBewertung(
    id: string,
    bewertung: {
      komplexitaet?: number;
      kritikalitaet?: number;
      begruendung?: string;
    }
  ): Promise<DigitalisierungsvorhabenRecord> {
    const input: Partial<DigitalisierungsvorhabenInput> = {};
    
    if (bewertung.komplexitaet !== undefined) {
      input.cr6df_komplexitaet = bewertung.komplexitaet;
    }
    if (bewertung.kritikalitaet !== undefined) {
      input.cr6df_kritikalitaet = bewertung.kritikalitaet;
    }
    if (bewertung.begruendung !== undefined) {
      input.cr6df_itotboard_begruendung = bewertung.begruendung;
    }

    return this.update(id, input);
  }

  /**
   * Aktualisiert den Lifecycle-Status
   */
  async updateStatus(
    id: string,
    statusCode: number
  ): Promise<DigitalisierungsvorhabenRecord> {
    return this.update(id, {
      cr6df_lifecyclestatus: statusCode,
    });
  }
}

/**
 * Factory-Funktion für einfache Instanziierung
 */
export function createDigitalisierungsvorhabenService(): DigitalisierungsvorhabenService {
  return new DigitalisierungsvorhabenService();
}
