/**
 * API-Route zum Zuweisen einer Idee zu einer Sitzung
 * PATCH: Aktualisiert das Sitzungs-Lookup auf einer Idee
 */

import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/lib/services/dataverse/tokenService";

const DATAVERSE_BASE_URL = process.env.DATAVERSE_BASE_URL;

/**
 * PATCH /api/dataverse/sitzungen/assign
 * Body: { ideaId: string, sitzungId: string | null }
 * Weist eine Idee einer Sitzung zu (oder entfernt die Zuweisung wenn sitzungId null)
 */
export async function PATCH(request: NextRequest) {
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
    const { ideaId, sitzungId } = body;

    if (!ideaId) {
      return NextResponse.json(
        { error: "ideaId ist erforderlich" },
        { status: 400 }
      );
    }

    // Update-Payload erstellen
    // Für Lookup-Felder muss das Format "fieldname@odata.bind" verwendet werden
    const updatePayload: Record<string, string | null> = {};
    
    if (sitzungId) {
      // Sitzung zuweisen
      updatePayload["cr6df_itotBoardSitzung@odata.bind"] = `/cr6df_itotboardsitzungs(${sitzungId})`;
    } else {
      // Sitzung entfernen (null setzen)
      updatePayload["cr6df_itotBoardSitzung@odata.bind"] = null;
    }

    // PATCH Request an Dataverse
    const response = await fetch(
      `${DATAVERSE_BASE_URL}/api/data/v9.2/cr6df_sgsw_digitalisierungsvorhabens(${ideaId})`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          Accept: "application/json",
          "Content-Type": "application/json",
          "If-Match": "*", // Optimistic Concurrency
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dataverse API Fehler:", errorText);
      return NextResponse.json(
        { error: "Fehler beim Zuweisen der Idee", details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Zuweisen:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", details: String(error) },
      { status: 500 }
    );
  }
}
