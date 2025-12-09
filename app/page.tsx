/**
 * Startseite – Redirect zu Sitzungen
 * Leitet Benutzer automatisch zur Sitzungen-Seite weiter.
 */

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/sitzungen");
}
