/**
 * /api/dataverse/digitalisierungsvorhaben/[id] – Einzelner Datensatz
 * 
 * GET: Einzelnen Datensatz abrufen
 * PATCH: Datensatz aktualisieren
 * DELETE: Datensatz löschen
 */

import { NextRequest, NextResponse } from "next/server";
import { createDigitalisierungsvorhabenService } from "@/lib/services/dataverse/digitalisierungsvorhabenService";
import { isAuthenticated } from "@/lib/services/dataverse/tokenService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET: Einzelnen Datensatz abrufen
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const service = createDigitalisierungsvorhabenService();
    const record = await service.getById(id);

    return NextResponse.json(record);
  } catch (error) {
    console.error("Fehler beim Laden:", error);
    
    // Prüfe auf 404
    if (String(error).includes("404") || String(error).includes("not found")) {
      return NextResponse.json(
        { error: "Datensatz nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Datensatz aktualisieren
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const service = createDigitalisierungsvorhabenService();
    const updated = await service.updateRecord(id, body);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Fehler beim Aktualisieren:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Datensatz löschen
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const service = createDigitalisierungsvorhabenService();
    await service.deleteRecord(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Löschen:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
