/**
 * API-Route für einzelne ITOT Board Sitzung
 * PATCH: Aktualisiert Protokoll und Teilnehmer einer Sitzung
 */

import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/services/dataverse/tokenService";

const DATAVERSE_BASE_URL = process.env.DATAVERSE_BASE_URL;

/**
 * PATCH /api/dataverse/sitzungen/[id]
 * Aktualisiert eine Sitzung (Protokoll, Teilnehmer)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const { protokoll, teilnehmerId, sitzungsdatum } = body;

    // Update-Payload erstellen
    const updatePayload: Record<string, string | null> = {};
    
    if (protokoll !== undefined) {
      updatePayload["cr6df_protokoll"] = protokoll;
    }
    
    // Sitzungsdatum aktualisieren
    if (sitzungsdatum !== undefined) {
      updatePayload["cr6df_sitzungsdatum"] = sitzungsdatum;
    }
    
    // Teilnehmer ist ein Lookup-Feld zur Mitarbeitende-Tabelle
    // Feldname in lowercase für OData bind
    if (teilnehmerId !== undefined) {
      if (teilnehmerId) {
        updatePayload["cr6df_teilnehmer@odata.bind"] = `/cr6df_sgsw_mitarbeitendes(${teilnehmerId})`;
      } else {
        // Um ein Lookup zu entfernen, muss man einen separaten DELETE Request machen
        // oder das Feld einfach nicht setzen wenn es null ist
      }
    }

    // PATCH Request an Dataverse
    const response = await fetch(
      `${DATAVERSE_BASE_URL}/api/data/v9.2/cr6df_itotboardsitzungs(${id})`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          Accept: "application/json",
          "Content-Type": "application/json",
          "If-Match": "*",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dataverse API Fehler:", errorText);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Sitzung", details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Aktualisieren:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", details: String(error) },
      { status: 500 }
    );
  }
}
