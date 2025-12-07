/**
 * /api/dataverse/auth – Token-Status und Logout
 * 
 * GET: Prüft ob ein gültiges Token vorhanden ist.
 * DELETE: Löscht alle Tokens (Logout).
 */

import { NextResponse } from "next/server";
import {
  isAuthenticated,
  getTokenExpiresIn,
  clearTokens,
} from "@/lib/services/dataverse/tokenService";

/**
 * GET: Token-Status prüfen
 */
export async function GET() {
  try {
    const authenticated = isAuthenticated();
    const expiresIn = getTokenExpiresIn();

    return NextResponse.json({
      isAuthenticated: authenticated,
      expiresIn: authenticated ? expiresIn : 0,
    });
  } catch (error) {
    console.error("Fehler beim Prüfen des Auth-Status:", error);
    return NextResponse.json(
      { isAuthenticated: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Logout (alle Tokens löschen)
 */
export async function DELETE() {
  try {
    clearTokens();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Logout:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
