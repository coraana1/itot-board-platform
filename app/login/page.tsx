/**
 * Login-Seite – Mock-Authentifizierung für den Prototyp
 * 
 * Im Produktivbetrieb würde hier ein SSO-Redirect stattfinden.
 * Für den Prototyp können Test-Benutzer ausgewählt werden.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn, User, Shield } from "lucide-react";
import { getCurrentUser, getMockUsers, mockLogin } from "@/lib/auth";

export default async function LoginPage() {
  // Wenn bereits eingeloggt, zum Dashboard weiterleiten
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  // Verfügbare Test-Benutzer
  const mockUsers = getMockUsers();

  // Server Action für den Login
  async function handleLogin(formData: FormData) {
    "use server";
    
    const userId = formData.get("userId") as string;
    if (userId) {
      await mockLogin(userId);
      redirect("/dashboard");
    }
  }

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
          <div className="card-body">
            <h1 className="card-title text-2xl justify-center gap-2 mb-4">
              <LogIn size={24} />
              Anmelden
            </h1>

            {/* Info-Box */}
            <div className="alert alert-info mb-6">
              <span className="text-sm">
                <strong>Prototyp-Modus:</strong> Wähle einen Test-Benutzer aus, 
                um dich anzumelden. Im Produktivbetrieb erfolgt die Anmeldung via SSO.
              </span>
            </div>

            {/* Login-Formular */}
            <form action={handleLogin}>
              <div className="form-control w-full mb-6">
                <label className="label">
                  <span className="label-text font-medium">Benutzer auswählen</span>
                </label>
                <select 
                  name="userId" 
                  className="select select-bordered w-full"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>Bitte wählen...</option>
                  {mockUsers.map((mockUser) => (
                    <option key={mockUser.id} value={mockUser.id}>
                      {mockUser.name} ({mockUser.rolle === "itot_board" ? "ITOT Board" : "Nur Ansicht"})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-full gap-2">
                <LogIn size={18} />
                Anmelden
              </button>
            </form>

            {/* Rollen-Erklärung */}
            <div className="divider">Rollen</div>
            
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Shield size={16} className="text-primary mt-0.5" />
                <div>
                  <strong>ITOT Board:</strong> Kann Ideen bewerten und Status ändern
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User size={16} className="text-base-content/60 mt-0.5" />
                <div>
                  <strong>Nur Ansicht:</strong> Kann Ideen nur ansehen, nicht bearbeiten
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
