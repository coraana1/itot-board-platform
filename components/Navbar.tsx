/**
 * Navbar – Hauptnavigation mit Login-Status
 * 
 * Zeigt den aktuellen Benutzer und Logout-Button an.
 * Server Component, die den User aus der Session liest.
 */

import Link from "next/link";
import { User, LogIn, LogOut, LayoutDashboard, List } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

interface NavbarProps {
  // Optionaler Badge-Text (z.B. "Dashboard", "Alle Ideen")
  badge?: string;
  badgeColor?: "primary" | "secondary" | "warning" | "success";
}

export default async function Navbar({ badge, badgeColor = "primary" }: NavbarProps) {
  const user = await getCurrentUser();

  return (
    <header className="navbar bg-base-100 shadow-sm">
      {/* Logo / Titel */}
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">ITOT Board</Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-none hidden sm:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li>
            <Link href="/dashboard" className="gap-1">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/ideen" className="gap-1">
              <List size={16} />
              Alle Ideen
            </Link>
          </li>
        </ul>
      </div>

      {/* Badge (optional) */}
      {badge && (
        <div className="flex-none mx-2">
          <span className={`badge badge-${badgeColor}`}>{badge}</span>
        </div>
      )}

      {/* User-Bereich */}
      <div className="flex-none">
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
              <User size={18} />
              <span className="hidden sm:inline">{user.name}</span>
              <span className={`badge badge-sm ${user.rolle === "itot_board" ? "badge-primary" : "badge-ghost"}`}>
                {user.rolle === "itot_board" ? "ITOT" : "Viewer"}
              </span>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
              <li className="menu-title">
                <span>{user.email}</span>
              </li>
              <li>
                <LogoutButton />
              </li>
            </ul>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm gap-1">
            <LogIn size={16} />
            Anmelden
          </Link>
        )}
      </div>
    </header>
  );
}
