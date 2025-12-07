/**
 * /api/dataverse/auth/poll – Pollt Token-Endpoint
 * 
 * POST: Pollt den Token-Endpoint mit dem Device Code.
 * Gibt status 'pending', 'success', 'expired' oder 'error' zurück.
 */

import { NextRequest, NextResponse } from "next/server";
import { pollForToken } from "@/lib/services/dataverse/tokenService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device_code } = body;

    if (!device_code) {
      return NextResponse.json(
        { error: "device_code ist erforderlich" },
        { status: 400 }
      );
    }

    // Token-Endpoint pollen
    const result = await pollForToken(device_code);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fehler beim Pollen des Token-Endpoints:", error);
    return NextResponse.json(
      { status: "error", error: String(error) },
      { status: 500 }
    );
  }
}
