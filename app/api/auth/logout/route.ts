/**
 * API Route: POST /api/auth/logout
 * 
 * Meldet den Benutzer ab und löscht die Session.
 */

import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  await logout();
  return NextResponse.json({ success: true });
}
