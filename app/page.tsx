/**
 * Startseite – Redirect zum Dashboard
 * Leitet Benutzer automatisch zum Dashboard weiter.
 */

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
