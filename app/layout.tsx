/**
 * Root Layout – Hauptlayout für die gesamte App
 * Hier wird das daisyUI-Theme gesetzt und die Grundstruktur definiert.
 */

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";

// Geist ist eine moderne, gut lesbare Schriftart
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Metadata erscheint im Browser-Tab und bei Suchmaschinen
export const metadata: Metadata = {
  title: "ITOT Board Platform",
  description: "Plattform zur Bewertung von Digitalisierungs-Ideen durch das ITOT Board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="de" für deutsche Inhalte, data-theme für daisyUI
    <html lang="de" data-theme="corporate">
      <body className={`${geistSans.variable} font-sans antialiased min-h-screen bg-base-200`}>
        <NavbarWrapper />
        <main>{children}</main>
      </body>
    </html>
  );
}
