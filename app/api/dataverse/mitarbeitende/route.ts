/**
 * API-Route für Mitarbeitende
 * Holt alle Mitarbeitenden aus der Dataverse-Tabelle cr6df_sgsw_mitarbeitendes
 */

import { NextResponse } from "next/server";
import { getValidToken } from "@/lib/services/dataverse/tokenService";

const DATAVERSE_BASE_URL = process.env.DATAVERSE_BASE_URL;

/**
 * GET /api/dataverse/mitarbeitende
 * Holt alle Mitarbeitenden, sortiert nach Vorname
 */
export async function GET() {
  const accessToken = await getValidToken();
  
  if (!accessToken) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  if (!DATAVERSE_BASE_URL) {
    return NextResponse.json(
      { error: "DATAVERSE_BASE_URL nicht konfiguriert" },
      { status: 500 }
    );
  }

  try {
    // Mitarbeitende aus Dataverse holen mit expliziter Feldauswahl
    const response = await fetch(
      `${DATAVERSE_BASE_URL}/api/data/v9.2/cr6df_sgsw_mitarbeitendes?$select=cr6df_sgsw_mitarbeitendeid,cr6df_vorname,cr6df_nachname,cr6df_email&$orderby=cr6df_nachname asc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dataverse API Fehler:", errorText);
      return NextResponse.json(
        { error: "Fehler beim Abrufen der Mitarbeitenden", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fehler beim Abrufen der Mitarbeitenden:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", details: String(error) },
      { status: 500 }
    );
  }
}
