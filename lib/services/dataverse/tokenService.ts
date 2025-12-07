/**
 * tokenService.ts – OAuth Token-Verwaltung für Dataverse
 * 
 * Implementiert den Device Code Flow für Microsoft-Anmeldung.
 * Tokens werden file-basiert gespeichert für Persistenz über Worker-Prozesse.
 * 
 * WICHTIG: Next.js startet mehrere Worker-Prozesse, daher muss der Cache
 * bei JEDEM Zugriff aus der Datei geladen werden!
 */

import fs from "fs";
import path from "path";
import type { TokenCache, TokenResponse, DeviceCodeResponse } from "./types";

// ============================================
// Konfiguration
// ============================================

// Token-Cache-Pfad: Lokal in .next, auf Vercel in /tmp
const isVercel = process.env.VERCEL === "1";
const TOKEN_CACHE_FILE = isVercel
  ? "/tmp/dataverse-token-cache.json"
  : path.join(process.cwd(), ".next", "dataverse-token-cache.json");

// Azure AD v1 Endpoints (Device Code Flow)
const TENANT_ID = process.env.DATAVERSE_TENANT_ID || "common";
const CLIENT_ID = process.env.DATAVERSE_CLIENT_ID || "04b07795-8ddb-461a-bbee-02f9e1bf7b46";
const DATAVERSE_URL = process.env.DATAVERSE_BASE_URL || "";

const DEVICE_CODE_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/devicecode`;
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/token`;

// Token wird 5 Minuten vor Ablauf erneuert
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// ============================================
// Token Cache Management
// ============================================

let tokenCache: TokenCache | null = null;

/**
 * Lädt den Token-Cache aus der Datei
 * MUSS bei jedem Zugriff aufgerufen werden (Next.js Worker-Problem)
 */
function loadTokenCache(): void {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const data = fs.readFileSync(TOKEN_CACHE_FILE, "utf8");
      tokenCache = JSON.parse(data);
    }
  } catch (error) {
    console.error("Fehler beim Laden des Token-Cache:", error);
    tokenCache = null;
  }
}

/**
 * Speichert den Token-Cache in die Datei
 */
function saveTokenCache(): void {
  try {
    // Stelle sicher, dass das Verzeichnis existiert
    const dir = path.dirname(TOKEN_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(tokenCache, null, 2));
  } catch (error) {
    console.error("Fehler beim Speichern des Token-Cache:", error);
  }
}

// ============================================
// Token-Prüfung
// ============================================

/**
 * Prüft ob ein Token abgelaufen ist (oder in 5 Min abläuft)
 */
function isTokenExpired(): boolean {
  if (!tokenCache) return true;
  return Date.now() >= tokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS;
}

/**
 * Prüft ob der Benutzer authentifiziert ist
 * Lädt zuerst den Cache aus der Datei!
 */
export function isAuthenticated(): boolean {
  loadTokenCache();
  return tokenCache !== null && !isTokenExpired();
}

/**
 * Gibt die verbleibende Zeit bis zum Token-Ablauf zurück (in Sekunden)
 */
export function getTokenExpiresIn(): number {
  loadTokenCache();
  if (!tokenCache) return 0;
  const remaining = tokenCache.expiresAt - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

// ============================================
// Device Code Flow
// ============================================

/**
 * Startet den Device Code Flow
 * Gibt user_code und device_code zurück
 */
export async function initiateDeviceCodeFlow(): Promise<DeviceCodeResponse> {
  if (!DATAVERSE_URL) {
    throw new Error("DATAVERSE_BASE_URL ist nicht konfiguriert");
  }

  const response = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      resource: DATAVERSE_URL,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Device Code Flow fehlgeschlagen: ${error}`);
  }

  const data = await response.json();
  
  // Azure AD v1 gibt "verification_url" zurück (nicht "verification_uri"!)
  return {
    user_code: data.user_code,
    device_code: data.device_code,
    verification_url: data.verification_url,
    expires_in: data.expires_in,
    interval: data.interval || 5,
    message: data.message,
  };
}

/**
 * Pollt den Token-Endpoint mit dem Device Code
 * Gibt 'pending', 'success' oder 'error' zurück
 */
export async function pollForToken(
  deviceCode: string
): Promise<{ status: "pending" | "success" | "expired" | "error"; error?: string }> {
  if (!DATAVERSE_URL) {
    return { status: "error", error: "DATAVERSE_BASE_URL nicht konfiguriert" };
  }

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "device_code",
        client_id: CLIENT_ID,
        resource: DATAVERSE_URL,
        code: deviceCode,
      }),
    });

    const data = await response.json();

    // Prüfe auf Fehler
    if (data.error) {
      if (data.error === "authorization_pending") {
        return { status: "pending" };
      }
      if (data.error === "expired_token") {
        return { status: "expired" };
      }
      return { status: "error", error: data.error_description || data.error };
    }

    // Token erhalten - speichern!
    if (data.access_token) {
      saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        resource: data.resource,
      });
      return { status: "success" };
    }

    return { status: "error", error: "Unbekannte Antwort vom Token-Endpoint" };
  } catch (error) {
    return { status: "error", error: String(error) };
  }
}

// ============================================
// Token-Verwaltung
// ============================================

/**
 * Speichert Tokens im Cache
 */
export function saveTokens(tokens: TokenResponse): void {
  tokenCache = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
  saveTokenCache();
}

/**
 * Löscht alle Tokens (Logout)
 */
export function clearTokens(): void {
  tokenCache = null;
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      fs.unlinkSync(TOKEN_CACHE_FILE);
    }
  } catch (error) {
    console.error("Fehler beim Löschen des Token-Cache:", error);
  }
}

/**
 * Erneuert das Access Token mit dem Refresh Token
 */
async function refreshAccessToken(): Promise<boolean> {
  loadTokenCache();
  if (!tokenCache?.refreshToken) {
    return false;
  }

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        resource: DATAVERSE_URL,
        refresh_token: tokenCache.refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Token-Erneuerung fehlgeschlagen:", await response.text());
      return false;
    }

    const data = await response.json();
    saveTokens(data);
    return true;
  } catch (error) {
    console.error("Fehler bei Token-Erneuerung:", error);
    return false;
  }
}

/**
 * Gibt ein gültiges Access Token zurück
 * Erneuert automatisch wenn nötig
 */
export async function getValidToken(): Promise<string | null> {
  loadTokenCache();

  if (!tokenCache) {
    return null;
  }

  // Token noch gültig?
  if (!isTokenExpired()) {
    return tokenCache.accessToken;
  }

  // Versuche Token zu erneuern
  const refreshed = await refreshAccessToken();
  if (refreshed && tokenCache) {
    return tokenCache.accessToken;
  }

  // Refresh fehlgeschlagen - Benutzer muss sich neu anmelden
  return null;
}
