/**
 * /api/dataverse/digitalisierungsvorhaben – Liste und Erstellen
 * 
 * GET: Alle Digitalisierungsvorhaben auflisten
 * POST: Neues Digitalisierungsvorhaben erstellen
 */

import { NextRequest, NextResponse } from "next/server";
import { createDigitalisierungsvorhabenService } from "@/lib/services/dataverse/digitalisierungsvorhabenService";
import { isAuthenticated } from "@/lib/services/dataverse/tokenService";

/**
 * GET: Alle Datensätze auflisten
 */
export async function GET() {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const service = createDigitalisierungsvorhabenService();
    const records = await service.listAll();

    return NextResponse.json({ value: records });
  } catch (error) {
    console.error("Fehler beim Laden der Digitalisierungsvorhaben:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST: Neuen Datensatz erstellen
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validierung: Name ist erforderlich
    if (!body.cr6df_name) {
      return NextResponse.json(
        { error: "cr6df_name ist erforderlich" },
        { status: 400 }
      );
    }

    const service = createDigitalisierungsvorhabenService();
    const created = await service.createRecord(body);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Erstellen:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
