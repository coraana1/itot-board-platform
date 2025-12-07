/**
 * /api/dataverse/whoami – Dataverse Verbindungstest
 * 
 * GET: Ruft die WhoAmI-API auf und gibt Benutzerinformationen zurück.
 * Holt zusätzlich den Benutzernamen aus der systemusers-Tabelle.
 */

import { NextResponse } from "next/server";
import { getWhoAmI, makeDataverseRequest } from "@/lib/services/dataverse/dataverseClient";
import { isAuthenticated } from "@/lib/services/dataverse/tokenService";

export async function GET() {
  try {
    // Prüfe ob authentifiziert
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Nicht authentifiziert - bitte zuerst anmelden" },
        { status: 401 }
      );
    }

    // WhoAmI aufrufen
    const whoAmI = await getWhoAmI();

    // Benutzername aus systemusers holen
    let fullName = "";
    try {
      const userResponse = await makeDataverseRequest<{
        fullname?: string;
        internalemailaddress?: string;
      }>(`systemusers(${whoAmI.UserId})?$select=fullname,internalemailaddress`);
      
      console.log("User Response:", JSON.stringify(userResponse));
      fullName = userResponse.fullname || "";
    } catch (userError) {
      console.error("Konnte Benutzername nicht laden:", userError);
    }

    return NextResponse.json({
      UserId: whoAmI.UserId,
      BusinessUnitId: whoAmI.BusinessUnitId,
      OrganizationId: whoAmI.OrganizationId,
      FullName: fullName,
    });
  } catch (error) {
    console.error("Fehler bei WhoAmI:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
