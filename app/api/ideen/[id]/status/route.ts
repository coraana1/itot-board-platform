/**
 * API Route: POST /api/ideen/[id]/status
 * 
 * Ändert den Lifecycle-Status einer Idee.
 * Wird verwendet, um die Bewertung abzuschliessen.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateLifecycleStatus, getIdeeById } from "@/lib/dataverse";
import { lifecycleStatusSchema } from "@/lib/validators";

// Schema für den Request-Body
const statusUpdateSchema = z.object({
  status: lifecycleStatusSchema,
});

// Typ für die Route-Parameter
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // ID aus den Parametern holen
    const { id } = await context.params;

    // Prüfen ob Idee existiert und Status geändert werden darf (Sperr-Logik)
    const idee = await getIdeeById(id);
    
    if (!idee) {
      return NextResponse.json(
        { error: "Idee nicht gefunden" },
        { status: 404 }
      );
    }

    // Nur Ideen mit Status "Idee wird ITOT-Board vorgestellt" dürfen abgeschlossen werden
    if (idee.lifecyclestatus !== "Idee wird ITOT-Board vorgestellt") {
      return NextResponse.json(
        { error: "Der Status dieser Idee kann nicht mehr geändert werden" },
        { status: 403 }
      );
    }

    // Prüfen ob Bewertung vollständig ist
    if (!idee.komplexitaet || !idee.kritikalitaet || !idee.itotBoard_begruendung) {
      return NextResponse.json(
        { error: "Bitte zuerst die Bewertung vollständig ausfüllen" },
        { status: 400 }
      );
    }

    // Request-Body parsen
    const body = await request.json();

    // Validierung mit Zod
    const validationResult = statusUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Ungültiger Status" },
        { status: 400 }
      );
    }

    // Status in Dataverse aktualisieren
    const result = await updateLifecycleStatus(id, validationResult.data.status);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Fehler beim Aktualisieren des Status" },
        { status: 500 }
      );
    }

    // Erfolg
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler in POST /api/ideen/[id]/status:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
