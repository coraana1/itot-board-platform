/**
 * auth.ts – Authentifizierungs-Utilities
 * 
 * Prototyp-Implementierung für die Authentifizierung.
 * Im Produktivbetrieb würde hier SSO (z.B. Azure AD / Microsoft Entra ID) verwendet.
 * 
 * Aktuell: Mock-Authentifizierung mit Cookie-basierter Session
 */

import { cookies } from "next/headers";

// ============================================================================
// TYPEN
// ============================================================================

/**
 * Benutzer-Typ für die Session
 */
export interface User {
  id: string;
  name: string;
  email: string;
  rolle: "itot_board" | "viewer";
}

// ============================================================================
// MOCK-BENUTZER (für Prototyp)
// ============================================================================

/**
 * Vordefinierte Test-Benutzer
 * Im Produktivbetrieb würden diese aus dem SSO-Provider kommen
 */
const mockUsers: Record<string, User> = {
  "itot1": {
    id: "itot1",
    name: "Max Mustermann",
    email: "max.mustermann@example.com",
    rolle: "itot_board",
  },
  "itot2": {
    id: "itot2",
    name: "Anna Schmidt",
    email: "anna.schmidt@example.com",
    rolle: "itot_board",
  },
  "viewer1": {
    id: "viewer1",
    name: "Peter Zuschauer",
    email: "peter.zuschauer@example.com",
    rolle: "viewer",
  },
};

// Cookie-Name für die Session
const SESSION_COOKIE = "itot_session";

// ============================================================================
// AUTH-FUNKTIONEN
// ============================================================================

/**
 * Holt den aktuell eingeloggten Benutzer aus der Session
 * Gibt null zurück wenn nicht eingeloggt
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  // Mock: User-ID aus Cookie lesen
  const userId = sessionCookie.value;
  return mockUsers[userId] || null;
}

/**
 * Prüft ob der Benutzer eingeloggt ist
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Prüft ob der Benutzer die ITOT Board Rolle hat
 */
export async function isITOTBoardMember(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.rolle === "itot_board";
}

/**
 * Mock-Login: Setzt den Session-Cookie
 * Im Produktivbetrieb würde hier der SSO-Flow stattfinden
 */
export async function mockLogin(userId: string): Promise<{ success: boolean; error?: string }> {
  const user = mockUsers[userId];
  
  if (!user) {
    return { success: false, error: "Benutzer nicht gefunden" };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 Stunden
    path: "/",
  });

  return { success: true };
}

/**
 * Logout: Löscht den Session-Cookie
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Gibt alle verfügbaren Mock-Benutzer zurück (für Login-Seite)
 */
export function getMockUsers(): User[] {
  return Object.values(mockUsers);
}
