/**
 * API-Route für ITOT Board Sitzungen
 * GET: Holt alle Sitzungen aus der Dataverse-Tabelle cr6df_itotboardsitzungs
 * POST: Erstellt eine neue Sitzung
 */

import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/services/dataverse/tokenService";

const DATAVERSE_BASE_URL = process.env.DATAVERSE_BASE_URL;

/**
 * GET /api/dataverse/sitzungen
 * Holt alle ITOT Board Sitzungen, sortiert nach Datum (neueste zuerst)
 */
export async function GET() {
  // Token aus Server-Cache holen
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
    // Sitzungen aus Dataverse holen, sortiert nach Datum absteigend
    const response = await fetch(
      `${DATAVERSE_BASE_URL}/api/data/v9.2/cr6df_itotboardsitzungs?$orderby=cr6df_sitzungsdatum desc`,
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
        { error: "Fehler beim Abrufen der Sitzungen", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fehler beim Abrufen der Sitzungen:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dataverse/sitzungen
 * Erstellt eine neue ITOT Board Sitzung
 */
export async function POST(request: NextRequest) {
  // Token aus Server-Cache holen
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
    const body = await request.json();
    const { sitzungsdatum, protokoll, teilnehmerId } = body;

    // Validierung: Datum ist Pflichtfeld
    if (!sitzungsdatum) {
      return NextResponse.json(
        { error: "Sitzungsdatum ist erforderlich" },
        { status: 400 }
      );
    }

    // Payload für Dataverse erstellen
    const createPayload: Record<string, string | null> = {
      cr6df_sitzungsdatum: sitzungsdatum,
    };

    // Optionale Felder hinzufügen
    if (protokoll) {
      createPayload["cr6df_protokoll"] = protokoll;
    }

    // Teilnehmer als Lookup (OData bind)
    if (teilnehmerId) {
      createPayload["cr6df_teilnehmer@odata.bind"] = `/cr6df_sgsw_mitarbeitendes(${teilnehmerId})`;
    }

    // Neue Sitzung in Dataverse erstellen
    const response = await fetch(
      `${DATAVERSE_BASE_URL}/api/data/v9.2/cr6df_itotboardsitzungs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          Accept: "application/json",
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(createPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dataverse API Fehler beim Erstellen:", errorText);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Sitzung", details: errorText },
        { status: response.status }
      );
    }

    const createdSitzung = await response.json();
    return NextResponse.json(createdSitzung, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Erstellen der Sitzung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", details: String(error) },
      { status: 500 }
    );
  }
}
