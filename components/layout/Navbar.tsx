/**
 * Navbar.tsx – Hauptnavigation der App
 * 
 * Zeigt Logo, Navigation-Links und Benutzer-Status an.
 * Nach Microsoft-Authentifizierung wird der Benutzername angezeigt.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightbulb, Settings, LogOut, Loader2 } from "lucide-react";

interface UserInfo {
  UserId: string;
  BusinessUnitId: string;
  OrganizationId: string;
  // Zusätzliche Felder falls verfügbar
  FullName?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth-Status und User-Info laden
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/dataverse/whoami");
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserInfo(data);
        } else {
          setIsAuthenticated(false);
          setUserInfo(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUserInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login starten
  const handleLogin = async () => {
    try {
      const response = await fetch("/api/dataverse/auth/login");
      const data = await response.json();

      if (data.user_code && data.verification_url) {
        // Öffne Microsoft Login in neuem Tab
        window.open(data.verification_url, "_blank");
        
        // Starte Polling
        pollForToken(data.device_code);
      }
    } catch (error) {
      console.error("Login-Fehler:", error);
    }
  };

  // Polling für Token
  const pollForToken = async (deviceCode: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) return;

      try {
        const response = await fetch("/api/dataverse/auth/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_code: deviceCode }),
        });

        const data = await response.json();

        if (data.success) {
          // Force Refresh um alle Daten neu zu laden
          window.location.href = window.location.href;
        } else if (data.error === "authorization_pending") {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch {
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/dataverse/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setUserInfo(null);
      window.location.reload();
    } catch (error) {
      console.error("Logout-Fehler:", error);
    }
  };

  // Aktiver Link-Style
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Lightbulb size={20} className="text-violet-600" />
            <span className="font-semibold text-gray-900">ITOT Board</span>
          </Link>

          {/* Navigation Links (Mitte) */}
          <div className="flex items-center gap-6">
            <Link
              href="/sitzungen"
              className={`text-sm font-medium transition-colors ${
                isActive("/sitzungen")
                  ? "text-violet-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sitzungen
            </Link>
            <Link
              href="/ideen"
              className={`text-sm font-medium transition-colors ${
                isActive("/ideen") || pathname.startsWith("/ideen/")
                  ? "text-violet-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Alle Ideen
            </Link>
          </div>

          {/* Rechte Seite: User/Login */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Benutzer-Info */}
                {userInfo && (
                  <span className="text-sm text-gray-700">
                    {userInfo.FullName || `User ${userInfo.UserId?.substring(0, 8) || ""}...`}
                  </span>
                )}

                {/* Abmelden Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Abmelden
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Settings size={16} />
                Verbinden
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
