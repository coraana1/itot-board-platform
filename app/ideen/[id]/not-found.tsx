/**
 * 404-Seite für nicht gefundene Ideen
 * 
 * Wird angezeigt, wenn eine Idee mit der angegebenen ID nicht existiert.
 */

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function IdeeNotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">ITOT Board</Link>
        </div>
      </header>

      {/* Hauptinhalt */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <AlertCircle size={48} className="mx-auto text-error mb-4" />
            <h1 className="card-title text-2xl justify-center">
              Idee nicht gefunden
            </h1>
            <p className="text-base-content/70">
              Die gesuchte Idee existiert nicht oder wurde gelöscht.
            </p>
            <div className="card-actions justify-center mt-4">
              <Link href="/dashboard" className="btn btn-primary gap-2">
                <ArrowLeft size={16} />
                Zurück zum Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
