/**
 * /api/dataverse/digitalisierungsvorhaben/setup – Tabellen-Check
 * 
 * GET: Prüft ob die Tabelle cr6df_sgsw_digitalisierungsvorhaben existiert.
 * Diese Tabelle wird NICHT automatisch erstellt, da sie bereits in Dataverse existiert.
 */

import { NextResponse } from "next/server";
import { getValidToken, isAuthenticated } from "@/lib/services/dataverse/tokenService";

const DATAVERSE_URL = process.env.DATAVERSE_BASE_URL || "";
const ENTITY_SET_NAME = "cr6df_sgsw_digitalisierungsvorhabens";
const LOGICAL_NAME = "cr6df_sgsw_digitalisierungsvorhaben";

export async function GET() {
  try {
    // Prüfe ob authentifiziert
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const token = await getValidToken();
    if (!token) {
      return NextResponse.json(
        { error: "Token nicht verfügbar" },
        { status: 401 }
      );
    }

    // Prüfe ob Tabelle existiert via EntityDefinitions
    const checkUrl = `${DATAVERSE_URL}/api/data/v9.2/EntityDefinitions(LogicalName='${LOGICAL_NAME}')`;
    
    const response = await fetch(checkUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "OData-Version": "4.0",
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        tableExists: true,
        entitySetName: data.EntitySetName || ENTITY_SET_NAME,
        logicalName: LOGICAL_NAME,
        displayName: data.DisplayName?.UserLocalizedLabel?.Label || LOGICAL_NAME,
      });
    }

    // Tabelle existiert nicht
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || "Tabelle nicht gefunden";

    // Prüfe auf spezifische Fehlercodes
    if (
      response.status === 404 ||
      errorMessage.includes("does not exist") ||
      errorMessage.includes("0x80060888")
    ) {
      return NextResponse.json({
        tableExists: false,
        entitySetName: ENTITY_SET_NAME,
        error: "Tabelle existiert nicht in Dataverse. Bitte zuerst in Power Apps erstellen.",
      });
    }

    // Anderer Fehler
    return NextResponse.json(
      { tableExists: false, error: errorMessage },
      { status: response.status }
    );
  } catch (error) {
    console.error("Fehler beim Tabellen-Check:", error);
    return NextResponse.json(
      { tableExists: false, error: String(error) },
      { status: 500 }
    );
  }
}
