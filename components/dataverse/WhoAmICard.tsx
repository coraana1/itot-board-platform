/**
 * WhoAmICard – Kompakter Verbindungsstatus
 * 
 * Zeigt nur einen kleinen Hinweis dass man verbunden ist,
 * mit Logout-Button.
 */

"use client";

import { useState, useEffect } from "react";
import { LogOut, Loader2, AlertCircle, CheckCircle2, Database } from "lucide-react";

interface WhoAmIData {
  UserId: string;
  BusinessUnitId: string;
  OrganizationId: string;
  FullName?: string;
}

interface WhoAmICardProps {
  onLogout: () => void;
}

export default function WhoAmICard({ onLogout }: WhoAmICardProps) {
  const [data, setData] = useState<WhoAmIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWhoAmI = async () => {
      try {
        const response = await fetch("/api/dataverse/whoami");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Fehler beim Laden");
        }

        const whoAmI = await response.json();
        setData(whoAmI);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWhoAmI();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/dataverse/auth", { method: "DELETE" });
      onLogout();
    } catch (err) {
      console.error("Logout-Fehler:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 size={14} className="animate-spin" />
        <span>Verbindung wird geprüft...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 py-2">
        <AlertCircle size={14} />
        <span>Verbindungsfehler</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-green-50 border border-green-200 rounded-lg text-sm">
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle2 size={16} />
        <span>Mit Dataverse verbunden</span>
        {data?.FullName && (
          <span className="text-green-600/80 hidden sm:inline">
            ({data.FullName})
          </span>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Abmelden</span>
      </button>
    </div>
  );
}
