/**
 * /api/dataverse/auth/login – Startet Device Code Flow
 * 
 * GET: Initiiert den Device Code Flow und gibt user_code zurück.
 * Der Benutzer muss dann zu microsoft.com/devicelogin gehen und den Code eingeben.
 */

import { NextResponse } from "next/server";
import { initiateDeviceCodeFlow } from "@/lib/services/dataverse/tokenService";

export async function GET() {
  try {
    // Device Code Flow starten
    const deviceCodeResponse = await initiateDeviceCodeFlow();

    return NextResponse.json({
      user_code: deviceCodeResponse.user_code,
      device_code: deviceCodeResponse.device_code,
      verification_url: deviceCodeResponse.verification_url,
      expires_in: deviceCodeResponse.expires_in,
      interval: deviceCodeResponse.interval,
      message: deviceCodeResponse.message,
    });
  } catch (error) {
    console.error("Fehler beim Starten des Device Code Flow:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
