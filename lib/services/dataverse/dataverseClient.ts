/**
 * dataverseClient.ts – Generischer Base Client für Dataverse
 * 
 * Wiederverwendbare Klasse für CRUD-Operationen auf beliebigen
 * Dataverse-Tabellen. Nutzt den tokenService für Authentifizierung.
 */

import { getValidToken } from "./tokenService";
import type { DataverseListResponse, WhoAmIResponse } from "./types";

// ============================================
// Konfiguration
// ============================================

const DATAVERSE_URL = process.env.DATAVERSE_BASE_URL || "";
const API_VERSION = "v9.2";

// ============================================
// Base Client Klasse
// ============================================

/**
 * Generischer Dataverse Client für CRUD-Operationen
 * T ist der Typ der Entity (z.B. DigitalisierungsvorhabenRecord)
 */
export class BaseDataverseClient<T> {
  protected entitySetName: string;
  protected baseUrl: string;

  constructor(entitySetName: string) {
    this.entitySetName = entitySetName;
    this.baseUrl = `${DATAVERSE_URL}/api/data/${API_VERSION}`;
  }

  /**
   * Erstellt die Standard-Header für Dataverse-Requests
   */
  protected async getHeaders(includePrefer = false): Promise<HeadersInit> {
    const token = await getValidToken();
    if (!token) {
      throw new Error("Nicht authentifiziert - bitte zuerst anmelden");
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    };

    // Dataverse: Formatted Values (z.B. Lookup-Namen) in der Response mitliefern
    const preferParts: string[] = [
      'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    ];

    // Prefer-Header für POST/PATCH um Response-Body zu erhalten
    if (includePrefer) {
      preferParts.push("return=representation");
    }

    headers["Prefer"] = preferParts.join(",");

    return headers;
  }

  /**
   * Führt einen Fetch-Request aus und behandelt Fehler
   */
  protected async fetchWithAuth<R>(
    url: string,
    options: RequestInit = {}
  ): Promise<R> {
    const headers = await this.getHeaders(
      options.method === "POST" || options.method === "PATCH"
    );

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // DELETE gibt keinen Body zurück
    if (options.method === "DELETE") {
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DELETE fehlgeschlagen: ${error}`);
      }
      return { success: true } as R;
    }

    // Prüfe auf Fehler
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    // Parse JSON Response
    return response.json();
  }

  // ============================================
  // CRUD-Operationen
  // ============================================

  /**
   * Ruft WhoAmI-Endpoint auf (Verbindungstest)
   */
  async getWhoAmI(): Promise<WhoAmIResponse> {
    return this.fetchWithAuth<WhoAmIResponse>(`${this.baseUrl}/WhoAmI`);
  }

  /**
   * Listet alle Datensätze auf
   * @param select - Felder die zurückgegeben werden sollen
   * @param filter - OData-Filter
   * @param top - Maximale Anzahl Datensätze
   * @param orderby - Sortierung
   */
  async list(options?: {
    select?: string[];
    filter?: string;
    top?: number;
    orderby?: string;
  }): Promise<T[]> {
    const params = new URLSearchParams();

    if (options?.select?.length) {
      params.set("$select", options.select.join(","));
    }
    if (options?.filter) {
      params.set("$filter", options.filter);
    }
    if (options?.top) {
      params.set("$top", options.top.toString());
    }
    if (options?.orderby) {
      params.set("$orderby", options.orderby);
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/${this.entitySetName}${queryString ? `?${queryString}` : ""}`;

    const response = await this.fetchWithAuth<DataverseListResponse<T>>(url);
    return response.value;
  }

  /**
   * Holt einen einzelnen Datensatz nach ID
   */
  async get(id: string, select?: string[]): Promise<T> {
    const params = new URLSearchParams();
    if (select?.length) {
      params.set("$select", select.join(","));
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/${this.entitySetName}(${id})${queryString ? `?${queryString}` : ""}`;

    return this.fetchWithAuth<T>(url);
  }

  /**
   * Erstellt einen neuen Datensatz
   */
  async create(data: Partial<T>): Promise<T> {
    const url = `${this.baseUrl}/${this.entitySetName}`;

    return this.fetchWithAuth<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Aktualisiert einen Datensatz (partielles Update)
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const url = `${this.baseUrl}/${this.entitySetName}(${id})`;

    return this.fetchWithAuth<T>(url, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Löscht einen Datensatz
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${this.entitySetName}(${id})`;

    return this.fetchWithAuth<{ success: boolean }>(url, {
      method: "DELETE",
    });
  }
}

// ============================================
// Hilfsfunktionen
// ============================================

/**
 * Einfache Funktion für WhoAmI ohne spezifische Entity
 */
export async function getWhoAmI(): Promise<WhoAmIResponse> {
  const client = new BaseDataverseClient<never>(""); 
  return client.getWhoAmI();
}

/**
 * Generische Dataverse-Request Funktion für beliebige Endpoints
 * Nützlich für Abfragen ausserhalb der Standard-CRUD-Operationen
 */
export async function makeDataverseRequest<T>(endpoint: string): Promise<T> {
  const token = await getValidToken();
  if (!token) {
    throw new Error("Nicht authentifiziert - bitte zuerst anmelden");
  }

  const baseUrl = `${DATAVERSE_URL}/api/data/${API_VERSION}`;
  const url = `${baseUrl}/${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dataverse-Fehler: ${response.status} - ${errorText}`);
  }

  return response.json();
}
