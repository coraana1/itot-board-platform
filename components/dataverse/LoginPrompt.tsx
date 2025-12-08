/**
 * LoginPrompt – Aufforderung zur Microsoft-Anmeldung
 * 
 * Zeigt den Device Code Flow UI:
 * 1. Button zum Starten
 * 2. User Code zum Eingeben auf microsoft.com/devicelogin
 * 3. Polling im Hintergrund bis Token kommt
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { LogIn, Copy, Check, Loader2, ExternalLink } from "lucide-react";

interface LoginPromptProps {
  onLoginSuccess: () => void;
}

interface DeviceCodeData {
  user_code: string;
  device_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

export default function LoginPrompt({ onLoginSuccess }: LoginPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState<DeviceCodeData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Polling für Token
  const pollForToken = useCallback(async (device_code: string, interval: number) => {
    const poll = async () => {
      try {
        const response = await fetch("/api/dataverse/auth/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_code }),
        });

        const data = await response.json();

        if (data.status === "success") {
          onLoginSuccess();
          return true;
        }

        if (data.status === "expired") {
          setError("Code abgelaufen. Bitte erneut versuchen.");
          setDeviceCode(null);
          return true;
        }

        if (data.status === "error") {
          setError(data.error || "Unbekannter Fehler");
          return true;
        }

        // Weiter pollen
        return false;
      } catch (err) {
        console.error("Polling-Fehler:", err);
        return false;
      }
    };

    // Polling starten
    const intervalId = setInterval(async () => {
      const done = await poll();
      if (done) {
        clearInterval(intervalId);
      }
    }, interval * 1000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [onLoginSuccess]);

  // Countdown für Code-Ablauf
  useEffect(() => {
    if (!deviceCode || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setDeviceCode(null);
          setError("Code abgelaufen. Bitte erneut versuchen.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deviceCode, countdown]);

  // Login starten
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dataverse/auth/login");
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setDeviceCode(data);
      setCountdown(data.expires_in);

      // Verification URL in neuem Tab öffnen
      window.open(data.verification_url, "_blank");

      // Polling starten
      pollForToken(data.device_code, data.interval);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Code kopieren
  const handleCopy = async () => {
    if (!deviceCode) return;
    await navigator.clipboard.writeText(deviceCode.user_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Countdown formatieren
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
      <div className="card-body items-center text-center">
        <h2 className="card-title text-2xl mb-4">
          <LogIn size={28} />
          Mit Microsoft anmelden
        </h2>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {!deviceCode ? (
          <>
            <p className="text-base-content/70 mb-4">
              Melde dich mit deinem Microsoft-Konto an, um auf Dataverse zuzugreifen.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="btn btn-lg gap-2 bg-violet-600 hover:bg-violet-700 text-white border-none"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {isLoading ? "Wird gestartet..." : "Mit Microsoft anmelden"}
            </button>
          </>
        ) : (
          <>
            <p className="text-base-content/70 mb-2">
              Gib diesen Code auf der Microsoft-Seite ein:
            </p>

            {/* User Code gross anzeigen */}
            <div className="flex items-center gap-2 mb-4">
              <code className="text-4xl font-mono font-bold tracking-widest bg-base-200 px-6 py-3 rounded-lg">
                {deviceCode.user_code}
              </code>
              <button
                onClick={handleCopy}
                className="btn btn-ghost btn-square"
                title="Code kopieren"
              >
                {copied ? <Check size={20} className="text-success" /> : <Copy size={20} />}
              </button>
            </div>

            {/* Link zur Verification-Seite */}
            <a
              href={deviceCode.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm gap-2 mb-4"
            >
              <ExternalLink size={16} />
              {deviceCode.verification_url}
            </a>

            {/* Countdown */}
            <div className="text-sm text-base-content/60">
              <Loader2 size={14} className="inline animate-spin mr-2" />
              Warte auf Anmeldung... ({formatCountdown(countdown)})
            </div>
          </>
        )}

        <div className="divider"></div>

        <p className="text-xs text-base-content/50">
          Dataverse-Umgebung: {process.env.NEXT_PUBLIC_DATAVERSE_URL || "Nicht konfiguriert"}
        </p>
      </div>
    </div>
  );
}
