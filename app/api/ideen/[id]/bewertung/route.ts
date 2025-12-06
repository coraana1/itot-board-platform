/**
 * API Route: POST /api/ideen/[id]/bewertung
 * 
 * Speichert die ITOT Board Bewertung für eine Idee.
 * Validiert die Eingaben mit Zod und aktualisiert die Datenbank.
 */

import { NextRequest, NextResponse } from "next/server";
import { itotBewertungSchema } from "@/lib/validators";
import { updateITOTBewertung, getIdeeById } from "@/lib/dataverse";

// Typ für die Route-Parameter
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // ID aus den Parametern holen
    const { id } = await context.params;

    // Prüfen ob Idee existiert und bearbeitbar ist (Sperr-Logik)
    const idee = await getIdeeById(id);
    
    if (!idee) {
      return NextResponse.json(
        { error: "Idee nicht gefunden" },
        { status: 404 }
      );
    }

    // Nur Ideen mit Status "Idee wird ITOT-Board vorgestellt" dürfen bearbeitet werden
    if (idee.lifecyclestatus !== "Idee wird ITOT-Board vorgestellt") {
      return NextResponse.json(
        { error: "Diese Idee kann nicht mehr bearbeitet werden" },
        { status: 403 }
      );
    }

    // Request-Body parsen
    const body = await request.json();

    // Validierung mit Zod
    const validationResult = itotBewertungSchema.safeParse(body);

    if (!validationResult.success) {
      // Validierungsfehler zurückgeben (Zod v4 Syntax)
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        { error: "Validierungsfehler", details: errors },
        { status: 400 }
      );
    }

    // Daten in Dataverse speichern
    const result = await updateITOTBewertung(id, validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Fehler beim Speichern" },
        { status: 500 }
      );
    }

    // Erfolg
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler in POST /api/ideen/[id]/bewertung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
