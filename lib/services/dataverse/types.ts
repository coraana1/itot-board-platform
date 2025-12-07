/**
 * types.ts – TypeScript-Interfaces für Dataverse-Integration
 * 
 * Definiert alle Typen für die Dataverse Web API, OAuth-Tokens
 * und die spezifische Tabelle cr6df_sgsw_digitalisierungsvorhaben.
 */

// ============================================
// Generische Dataverse-Typen
// ============================================

/**
 * Basis-Interface für alle Dataverse-Entities
 * Enthält OData-Metadaten die bei jeder Abfrage zurückkommen
 */
export interface DataverseEntity {
  "@odata.context"?: string;
  "@odata.etag"?: string;
}

/**
 * Response der WhoAmI-API
 * Wird verwendet um die Verbindung zu testen
 */
export interface WhoAmIResponse {
  "@odata.context": string;
  BusinessUnitId: string;
  UserId: string;
  OrganizationId: string;
}

/**
 * Generisches Interface für OData-Listen-Responses
 * T ist der Typ der einzelnen Datensätze
 */
export interface DataverseListResponse<T> {
  "@odata.context": string;
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
  value: T[];
}

// ============================================
// OAuth Token-Typen
// ============================================

/**
 * Response vom Azure AD Token-Endpoint
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  resource: string;
}

/**
 * Device Code Flow Response
 * ACHTUNG: Azure AD v1 nutzt "verification_url", nicht "verification_uri"!
 */
export interface DeviceCodeResponse {
  user_code: string;
  device_code: string;
  verification_url: string;  // v1 Endpoint!
  expires_in: number;
  interval: number;
  message: string;
}

/**
 * Interner Token-Cache
 * Wird file-basiert gespeichert für Persistenz über Worker-Prozesse
 */
export interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // Unix timestamp in Millisekunden
}

// ============================================
// Digitalisierungsvorhaben-Tabelle
// ============================================

/**
 * Datensatz aus der Tabelle cr6df_sgsw_digitalisierungsvorhaben
 * 
 * Basierend auf den tatsächlichen Dataverse-Attributen.
 * WICHTIG: Lookup-Felder kommen als _fieldname_value zurück!
 */
export interface DigitalisierungsvorhabenRecord extends DataverseEntity {
  // Primary Key (GUID)
  cr6df_sgsw_digitalisierungsvorhabenid: string;
  
  // === String-Felder ===
  cr6df_name?: string;                    // Titel der Idee
  cr6df_beschreibung?: string;            // Beschreibung (String)
  cr6df_newcolumn?: string;               // ID-Feld (Primary Name)
  cr6df_pia_pfad?: string;                // PIA Pfad
  
  // === Memo-Felder (langer Text) ===
  cr6df_detailanalyse_ergebnis?: string;  // Detailanalyse Ergebnis
  cr6df_initalbewertung_begruendung?: string; // Initialbewertung Begründung
  cr6df_itotboard_begruendung?: string;   // ITOT Board Begründung
  
  // === Integer-Felder ===
  cr6df_detailanalyse_personentage?: number; // Personentage
  
  // === Picklist-Felder (Choice) - kommen als number zurück ===
  cr6df_typ?: number;                     // Typ (Picklist!)
  cr6df_lifecyclestatus?: number;         // Lifecycle-Status (Picklist!)
  cr6df_komplexitaet?: number;            // Komplexität (Picklist!)
  cr6df_kritikalitaet?: number;           // Kritikalität (Picklist!)
  cr6df_prioritat?: number;               // Nutzen/Priorität (Picklist!)
  
  // === Boolean-Felder ===
  cr6df_istduplikat?: boolean;            // Ist Duplikat
  
  // === DateTime-Felder ===
  cr6df_abgelehnt_am?: string;
  cr6df_abgeschlossen_am?: string;
  cr6df_genehmigt_am?: string;
  cr6df_in_ueberarbeitung_am?: string;
  cr6df_pia_erstellt_am?: string;
  cr6df_planung_geplanterstart?: string;
  cr6df_planung_geplantesende?: string;
  
  // === Lookup-Felder (kommen als _fieldname_value zurück!) ===
  _cr6df_itotboardsitzung_value?: string;  // GUID der zugewiesenen Sitzung (Feldname: cr6df_itotBoardSitzung)
  cr6df_itotboardsitzungname?: string;     // Name der Sitzung (expanded)
  _cr6df_verantwortlicher_value?: string;  // GUID des Verantwortlichen
  _cr6df_ideengeber_value?: string;        // GUID des Ideengebers
  _cr6df_abonnenten_value?: string;        // GUID der Abonnenten
  
  // === Lookup-Namen (automatisch von Dataverse) ===
  cr6df_verantwortlichername?: string;     // Name des Verantwortlichen
  cr6df_ideengebername?: string;           // Name des Ideengebers
  cr6df_abonnentenname?: string;           // Name der Abonnenten
  
  // === System-Felder (ReadOnly) ===
  createdon?: string;
  modifiedon?: string;
  _createdby_value?: string;
  _modifiedby_value?: string;
  _ownerid_value?: string;
  statecode?: number;
  statuscode?: number;
}

/**
 * Input-DTO für Create/Update
 * 
 * WICHTIG: 
 * - Lookup-Felder werden NICHT direkt unterstützt (benötigen @odata.bind Syntax)
 * - Picklist-Felder sind numbers, nicht strings!
 */
export interface DigitalisierungsvorhabenInput {
  // String-Felder
  cr6df_name?: string;
  cr6df_beschreibung?: string;
  cr6df_pia_pfad?: string;
  
  // Memo-Felder
  cr6df_detailanalyse_ergebnis?: string;
  cr6df_initalbewertung_begruendung?: string;
  cr6df_itotboard_begruendung?: string;
  
  // Integer-Felder
  cr6df_detailanalyse_personentage?: number;
  
  // Picklist-Felder (als number!)
  cr6df_typ?: number;
  cr6df_lifecyclestatus?: number;
  cr6df_komplexitaet?: number;
  cr6df_kritikalitaet?: number;
  cr6df_prioritat?: number;
  
  // Boolean-Felder
  cr6df_istduplikat?: boolean;
  
  // DateTime-Felder
  cr6df_abgelehnt_am?: string;
  cr6df_abgeschlossen_am?: string;
  cr6df_genehmigt_am?: string;
  cr6df_in_ueberarbeitung_am?: string;
  cr6df_pia_erstellt_am?: string;
  cr6df_planung_geplanterstart?: string;
  cr6df_planung_geplantesende?: string;
}

// ============================================
// API Response-Typen
// ============================================

/**
 * Auth-Status Response
 */
export interface AuthStatusResponse {
  isAuthenticated: boolean;
  expiresIn?: number;
  userId?: string;
}

/**
 * Generische API-Error Response
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// ============================================
// ITOT Board Sitzung Tabelle
// ============================================

/**
 * Interface für ITOT Board Sitzungen (cr6df_itotboardsitzung)
 * Enthält alle Felder der Sitzungs-Tabelle
 */
export interface ITOTBoardSitzung extends DataverseEntity {
  // === System-Felder ===
  cr6df_itotboardsitzungid?: string;  // Primary Key (GUID)
  statecode?: number;
  statuscode?: number;
  createdon?: string;
  modifiedon?: string;
  _createdby_value?: string;
  _modifiedby_value?: string;
  _ownerid_value?: string;
  
  // === Sitzungs-Felder ===
  cr6df_sitzungid?: string;           // Sitzungs-ID (Primary Name)
  cr6df_sitzungsdatum?: string;       // Datum der Sitzung
  cr6df_protokoll?: string;           // Protokoll (Memo)
  _cr6df_teilnehmer_value?: string;   // Teilnehmer (Lookup zu Mitarbeitende)
  cr6df_teilnehmername?: string;      // Name des Teilnehmers (expanded)
}

/**
 * Interface für Mitarbeitende (cr6df_sgsw_mitarbeitende)
 */
export interface Mitarbeitende extends DataverseEntity {
  cr6df_sgsw_mitarbeitendeid?: string;  // Primary Key (GUID)
  cr6df_vorname?: string;               // Vorname (Primary Name)
  cr6df_nachname?: string;              // Nachname
  cr6df_email?: string;                 // E-Mail
  cr6df_zhaw_user?: string;             // ZHAW User
  statecode?: number;
  statuscode?: number;
}

/**
 * Setup-Response für Tabellen-Check
 */
export interface TableSetupResponse {
  tableExists: boolean;
  entitySetName: string;
  created?: boolean;
  error?: string;
}
