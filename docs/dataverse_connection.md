# Microsoft Dataverse Integration - Implementierungsanleitung

Diese Dokumentation beschreibt die vollständige Integration der Microsoft Dataverse Web API in die CRM-Anwendung, einschließlich OAuth-Authentifizierung mit automatischer Token-Erneuerung, CRUD-Operationen und einer beispielhaften Implementierung anhand der Testtabelle `scep_loeschmich`.

## Inhaltsverzeichnis

1. [Zielsetzung](#zielsetzung)
2. [Architektur-Übersicht](#architektur-übersicht)
3. [Technologie-Stack](#technologie-stack)
4. [Dateistruktur](#dateistruktur)
5. [Implementierungs-Reihenfolge](#implementierungs-reihenfolge)
   - [Mensch: Schritt 1](#mensch-schritt-1---umgebungsvariablen-einrichten)
   - [LLM: Schritte 2-11](#llm-schritt-2---typescript-interfaces-definieren)
6. [API-Referenz](#api-referenz)
7. [Testing-Anleitung](#testing-anleitung)

---

## Zielsetzung

### Was ist Microsoft Dataverse?

Microsoft Dataverse ist eine cloud-basierte NoSQL-Datenplattform, die als Backend für Power Platform-Anwendungen (Power Apps, Power Automate) dient. Sie bietet eine OData-basierte REST-API für CRUD-Operationen auf Entitäten (Tabellen).

### Ziel dieser Integration

Die Integration ermöglicht es, unsere Next.js-CRM-Anwendung direkt mit Dataverse zu verbinden, um:

- **Daten lesen**: Bestehende Dataverse-Tabellen abfragen und in der Next.js-UI anzeigen
- **Daten schreiben**: Neue Datensätze erstellen und bestehende aktualisieren
- **Authentifizierung**: OAuth 2.0-basierte Authentifizierung mit **automatischer Token-Erneuerung**
- **Typsicherheit**: TypeScript-basierte Client-Klassen für type-safe API-Zugriffe
- **Wiederverwendbarkeit**: Generische Service-Layer-Architektur für beliebige Dataverse-Tabellen

### Use Cases

1. **Beispiel-Tabelle `scep_loeschmich`**: Demo-Implementierung für CRUD-Operationen
2. **Wiederverwendbare Clients**: Generische Dataverse-Client-Klassen für zukünftige Tabellen
3. **Serverseitige API-Calls**: Sichere Token-Verwaltung ohne Browser-Exposition
4. **Automatische Token-Erneuerung**: Nahtlose Authentifizierung ohne manuelles Token-Kopieren

---

## Architektur-Übersicht

Das Dataverse-Feature basiert auf einer mehrschichtigen Architektur mit Trennung zwischen generischen Clients und spezifischen Implementierungen.

### Architektur-Schema

**Flow 1: OAuth-Authentifizierung mit Device Code Flow**

Der **Device Code Flow** ist ideal für diese Integration, da er:
- **Keine eigene Azure AD App-Registrierung** erfordert
- **Keine Redirect URIs** benötigt (funktioniert auf localhost UND Vercel)
- Mit dem **öffentlichen Azure CLI Client** (`04b07795-8ddb-461a-bbee-02f9e1bf7b46`) arbeitet

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BENUTZER (Browser)                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  1. Öffnet /dataverse Seite                                                     │
│  2. Kein Token → Klickt "Mit Microsoft anmelden"                               │
│  3. App zeigt User Code (z.B. "ABCD1234") + Link                               │
│  4. Neuer Tab öffnet sich: microsoft.com/devicelogin                           │
│  5. Benutzer gibt Code ein und meldet sich an                                  │
│  6. App pollt im Hintergrund → Token kommt automatisch                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Device Code Flow (kein Redirect!)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     MICROSOFT IDENTITY PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐                                       │
│  │ Azure AD OAuth v1 Endpoints         │                                       │
│  │ • /oauth2/devicecode → user_code    │                                       │
│  │ • /oauth2/token → Access Token      │                                       │
│  │ • Public Client (Azure CLI)         │                                       │
│  │ • Resource: Dataverse Base URL      │                                       │
│  └─────────────────────────────────────┘                                       │
│                                                                                 │
│  WICHTIG: Azure AD v1 verwendet "verification_url" (nicht "verification_uri")! │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Access Token + Refresh Token
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TOKEN SERVICE                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Token Service (lib/services/dataverse/tokenService.ts)                         │
│  ┌─────────────────────────────────────┐                                       │
│  │ • initiateDeviceCodeFlow()          │  ← Holt user_code + device_code       │
│  │ • pollForToken(device_code)         │  ← Pollt bis Token kommt              │
│  │ • getValidToken()                   │  ← Prüft & erneuert automatisch       │
│  │ • refreshAccessToken()              │  ← Nutzt Refresh Token                │
│  │ • isAuthenticated()                 │  ← Prüft ob Token vorhanden           │
│  └─────────────────────────────────────┘                                       │
│                                                                                 │
│  Token Cache (File-basiert für Persistenz):                                     │
│  • Lokal: .next/dataverse-token-cache.json                                      │
│  • Vercel: /tmp/dataverse-token-cache.json (NICHT persistent!)                  │
│  • access_token: JWT (~1 Stunde gültig)                                         │
│  • refresh_token: für Erneuerung (~90 Tage gültig)                              │
│  • Automatische Erneuerung 5 Min vor Ablauf                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Flow 2: Dataverse CRUD-Operationen (Next.js App)**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Dataverse-Demo-Seite (app/dataverse/page.tsx)                                  │
│  ┌─────────────────────────────────────┐                                       │
│  │ • WhoAmI-Info anzeigen             │                                       │
│  │ • Tabelle der Datensätze           │                                       │
│  │ • Formular: Neuer Datensatz        │                                       │
│  │ • Formular: Datensatz aktualisieren│                                       │
│  └─────────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Server Actions / API Routes
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐                                       │
│  │ /api/dataverse/loeschmich/route.ts  │                                       │
│  │ • GET: Liste aller Datensätze       │                                       │
│  │ • POST: Neuen Datensatz erstellen   │                                       │
│  └─────────────────────────────────────┘                                       │
│  ┌─────────────────────────────────────┐                                       │
│  │ /api/dataverse/loeschmich/[id]/route.ts│                                    │
│  │ • GET: Einzelnen Datensatz lesen    │                                       │
│  │ • PATCH: Datensatz aktualisieren    │                                       │
│  │ • DELETE: Datensatz löschen         │                                       │
│  └─────────────────────────────────────┘                                       │
│  ┌─────────────────────────────────────┐                                       │
│  │ /api/dataverse/whoami/route.ts      │                                       │
│  │ • GET: WhoAmI-Informationen         │                                       │
│  └─────────────────────────────────────┘                                       │
│  ┌─────────────────────────────────────┐                                       │
│  │ /api/dataverse/auth/route.ts        │                                       │
│  │ • GET: OAuth Callback Handler       │                                       │
│  │ • POST: Token-Status prüfen         │                                       │
│  └─────────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ GENERISCHE KLASSEN                                                          │ │
│  │ lib/services/dataverse/                                                      │ │
│  │ ┌─────────────────────────────────────┐                                     │ │
│  │ │ tokenService.ts                     │                                     │ │
│  │ │ • getValidToken()                   │                                     │ │
│  │ │ • refreshToken()                    │                                     │ │
│  │ │ • isTokenExpired()                  │                                     │ │
│  │ │ • Token-Cache-Management            │                                     │ │
│  │ └─────────────────────────────────────┘                                     │ │
│  │ ┌─────────────────────────────────────┐                                     │ │
│  │ │ dataverseClient.ts                  │                                     │ │
│  │ │ • BaseDataverseClient<T>            │                                     │ │
│  │ │ • list(select?, filter?, top?)      │                                     │ │
│  │ │ • get(id)                           │                                     │ │
│  │ │ • create(data)                      │                                     │ │
│  │ │ • update(id, data)                  │                                     │ │
│  │ │ • delete(id)                        │                                     │ │
│  │ │ • getWhoAmI()                       │                                     │ │
│  │ └─────────────────────────────────────┘                                     │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ SPEZIFISCHE KLASSEN (Beispiel: scep_loeschmich)                            │ │
│  │ lib/services/dataverse/                                                      │ │
│  │ ┌─────────────────────────────────────┐                                     │ │
│  │ │ scepLoeschmichService.ts            │                                     │ │
│  │ │ • ScepLoeschmichService extends     │                                     │ │
│  │ │   BaseDataverseClient<ScepRecord>   │                                     │ │
│  │ │ • Typisierte Methoden               │                                     │ │
│  │ │ • Business-Logik                    │                                     │ │
│  │ └─────────────────────────────────────┘                                     │ │
│  │ ┌─────────────────────────────────────┐                                     │ │
│  │ │ types.ts                            │                                     │ │
│  │ │ • ScepLoeschmichRecord interface    │                                     │ │
│  │ │   - scep_loeschmichid: string       │                                     │ │
│  │ │   - scep_name: string               │                                     │ │
│  │ │   - scep_remarks: string            │                                     │ │
│  │ │   - scep_validated: boolean         │                                     │ │
│  │ │   - scep_count: number              │                                     │ │
│  │ └─────────────────────────────────────┘                                     │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ OData REST API (mit Auto-Token)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICE                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐                                       │
│  │ Microsoft Dataverse Web API         │                                       │
│  │ • Endpoint: /api/data/v9.2/...      │                                       │
│  │ • OData 4.0 Protokoll               │                                       │
│  │ • Bearer Token Authentication       │                                       │
│  │ • CRUD auf EntitySets               │                                       │
│  └─────────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Datenspeicherung
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATAVERSE STORAGE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Tabelle: scep_loeschmich (EntitySetName: scep_loeschmichs)                     │
│  ┌─────────────────────────────────────┐                                       │
│  │ Felder:                             │                                       │
│  │ • scep_loeschmichid (Primary Key)   │                                       │
│  │ • scep_name (Text, Primary Name)    │                                       │
│  │ • scep_remarks (Memo, langer Text)  │                                       │
│  │ • scep_validated (Boolean)          │                                       │
│  │ • scep_count (Integer)              │                                       │
│  │ • createdby, modifiedby, etc.       │                                       │
│  └─────────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Konfigurations-Layer**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         KONFIGURATION                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  .env Datei:                                       │
│  • DATAVERSE_BASE_URL          → Dataverse Environment URL                      │
│  • DATAVERSE_CLIENT_ID         → Azure AD Client ID (public)                    │
│  • DATAVERSE_TENANT_ID         → Azure AD Tenant ID (oder "common")             │
│                          │
│                                    │                                           │
│  Sicherheit:                                                                      │
│  • Tokens NIEMALS im Client-Code                                                │
│  • Nur Server Components / API Routes                                          │
│  • Automatische Token-Erneuerung via Refresh Token                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↔ Beeinflusst alle API Calls
```

---

## Technologie-Stack

### Frontend
- **Next.js 16** - React Framework mit App Router
- **React**, **TypeScript**, **TailwindCSS**, **DaisyUI**

### Dataverse Integration
- **Microsoft Dataverse Web API v9.2** - OData-basierte REST-API
- **OAuth 2.0 (v1 Endpoints)** - Interaktiver Authorization Code Flow
- **Native Fetch API** - HTTP-Requests (serverseitig)

### Entwicklungs-Tools
- **Azure AD** - Identity Provider (Microsofts öffentlicher Multi-Tenant Client)

---

## Dateistruktur

```
app/
├── lib/
│   └── services/
│       └── dataverse/
│           ├── tokenService.ts              # OAuth Token Management mit interaktivem Login
│           ├── dataverseClient.ts           # Generischer Base Client für beliebige Tabellen
│           ├── scepLoeschmichService.ts     # Spezifischer Service für scep_loeschmich
│           └── types.ts                     # TypeScript-Interfaces für Dataverse-Entities
├── components/
│   └── dataverse/
│       ├── LoeschmichTable.tsx              # Tabellen-Komponente zur Anzeige
│       ├── LoeschmichForm.tsx               # Formular für Create/Update
│       ├── LoginPrompt.tsx                  # Aufforderung zur Anmeldung
│       ├── CurlCommandPanel.tsx             # Anzeige des curl-Befehls
│       └── WhoAmICard.tsx                   # Anzeige der WhoAmI-Informationen
├── api/
│   └── dataverse/
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts                 # Startet Device Code Flow
│       │   ├── poll/
│       │   │   └── route.ts                 # Pollt Token-Endpoint
│       │   └── route.ts                     # Token-Status prüfen & Logout
│       ├── whoami/
│       │   └── route.ts                     # API-Endpoint für WhoAmI
│       └── loeschmich/
│           ├── setup/
│           │   └── route.ts                 # Prüft/erstellt Tabelle automatisch
│           ├── route.ts                     # API-Endpoints für List & Create
│           └── [id]/
│               └── route.ts                 # API-Endpoints für Get, Update & Delete
└── dataverse/
    └── page.tsx                             # Demo-Seite mit Auto-Login & Tabellen-Erstellung
```

---

## Implementierungs-Reihenfolge

---

### Mensch: Schritt 1 - Umgebungsvariablen einrichten

**Keine Azure AD App-Registrierung erforderlich!** Wir verwenden den **Device Code Flow** mit dem öffentlichen Azure CLI Client. Das funktioniert genau wie bei Postman/Hoppscotch.

Erstelle eine `.env`-Datei im Projekt-Root:

```env
# Microsoft Dataverse Configuration
DATAVERSE_BASE_URL=https://scepdevteacher.crm17.dynamics.com
DATAVERSE_CLIENT_ID=04b07795-8ddb-461a-bbee-02f9e1bf7b46
DATAVERSE_TENANT_ID=common
```

**Werte**:
- `DATAVERSE_BASE_URL`: Deine Dataverse-Umgebungs-URL
- `DATAVERSE_CLIENT_ID`: Der öffentliche Azure CLI Client (immer gleich!)
- `DATAVERSE_TENANT_ID`: `common` für Multi-Tenant

**Sicherheitshinweise:**
- `.env` ist in `.gitignore` und wird NICHT committet

**Vercel-Deployment:**
Die gleichen Umgebungsvariablen müssen in Vercel unter Project Settings → Environment Variables gesetzt werden:
- `DATAVERSE_BASE_URL`
- `DATAVERSE_CLIENT_ID` 
- `DATAVERSE_TENANT_ID`

**WICHTIG für Vercel:**
- Die Variable `VERCEL=1` wird automatisch gesetzt
- Token-Cache liegt dann in `/tmp` (nicht persistent über Funktionsaufrufe!)
- Bei jedem Cold Start muss sich der Benutzer neu anmelden
- Für produktive Nutzung: Token in Datenbank speichern (z.B. Redis, Vercel KV)

---

### LLM: Schritt 2 - TypeScript-Interfaces definieren

**Datei**: `lib/services/dataverse/types.ts`

**Ziel**: Type-safe Interfaces für alle Dataverse-Entities und API-Responses definieren.

**Funktionalität**:
- `DataverseEntity`: Generisches Base-Interface für alle Entities (enthält OData-Metadaten)
- `WhoAmIResponse`: Interface für die WhoAmI-API (UserId, BusinessUnitId, OrganizationId)
- `DataverseListResponse<T>`: Generisches Interface für OData-Listen-Responses mit Pagination
- `TokenResponse`: Interface für OAuth Token-Responses (access_token, refresh_token, expires_in)
- `TokenCache`: Interface für den In-Memory Token-Cache
- `ScepLoeschmichRecord`: Spezifisches Interface für die Tabelle mit allen Feldern:
  - `scep_loeschmichid` (GUID, Primary Key)
  - `scep_name` (string, Primary Name)
  - `scep_remarks` (string, Memo)
  - `scep_validated` (boolean)
  - `scep_count` (number)
  - System-Felder: `createdon`, `modifiedon`, `_createdby_value`, `_modifiedby_value`
- `ScepLoeschmichInput`: DTO für Create/Update ohne System-Felder

---

### LLM: Schritt 3 - Token Service mit interaktivem Login

**Datei**: `lib/services/dataverse/tokenService.ts`

**Ziel**: OAuth-Token-Verwaltung mit interaktivem Login-Flow und automatischer Erneuerung.

**Funktionalität**:
- **Token Cache**: Speichert Access Token, Refresh Token und Ablaufzeit (In-Memory oder File-basiert)
- `isAuthenticated()`: Prüft, ob ein gültiges Token vorhanden ist
- `getValidToken()`: Gibt gültiges Token zurück; erneuert automatisch wenn nötig
- `refreshAccessToken()`: Ruft Azure AD Token-Endpoint mit Refresh Token auf
- `isTokenExpired()`: Prüft, ob Token abgelaufen oder in den nächsten 5 Minuten abläuft
- `initiateDeviceCodeFlow()`: Startet Device Code Flow, gibt `user_code` und `device_code` zurück
- `pollForToken(deviceCode)`: Pollt Token-Endpoint bis Benutzer autorisiert hat
- `saveTokens(tokens)`: Speichert Tokens im Cache
- `clearTokens()`: Löscht alle Tokens (Logout)
- **Error Handling**: Bei ungültigem Refresh Token → neuer Device Code Flow

**OAuth-Endpunkte (Device Code Flow)**:
- Device Code URL: `https://login.microsoftonline.com/{tenant}/oauth2/devicecode`
- Token URL: `https://login.microsoftonline.com/{tenant}/oauth2/token`
- Parameters: `client_id`, `resource`, `grant_type=device_code`, `code`

**Device Code Flow**:
1. App ruft `/devicecode` auf → erhält `user_code`, `device_code`, `verification_url` (ACHTUNG: v1 nutzt "url", nicht "uri"!)
2. Benutzer geht zu `microsoft.com/devicelogin` und gibt `user_code` ein
3. App pollt Token-Endpoint mit `device_code` bis Token kommt
4. Kein Redirect nötig - funktioniert mit dem öffentlichen Azure CLI Client!

**Token-Persistenz (KRITISCH für Next.js)**:
- Next.js startet mehrere Worker-Prozesse mit eigenem RAM
- In-Memory-Cache funktioniert NICHT zuverlässig
- Lösung: File-basierter Cache, bei JEDEM Zugriff aus Datei laden
- Lokal: `.next/dataverse-token-cache.json`
- Vercel: `/tmp/dataverse-token-cache.json` (nicht persistent über Cold Starts!)

---

### LLM: Schritt 4 - Generischer Dataverse Base Client

**Datei**: `lib/services/dataverse/dataverseClient.ts`

**Ziel**: Wiederverwendbare Base-Klasse für CRUD-Operationen auf beliebigen Dataverse-Tabellen.

**Funktionalität**:
- **Konstruktor**: Nimmt `entitySetName` und nutzt `tokenService` für Authentifizierung
- `getWhoAmI()`: Ruft `/api/data/v9.2/WhoAmI` auf
- `list(select?, filter?, top?)`: OData-Query mit `$select`, `$filter`, `$top`
- `get(id, select?)`: Einzelnen Datensatz nach GUID abrufen
- `create(data)`: POST mit `Prefer: return=representation`
- `update(id, data)`: PATCH mit partiellen Daten
- `delete(id)`: DELETE eines Datensatzes
- **Header-Management**: `Authorization`, `OData-Version`, `Accept`, `Content-Type`
- **Error Handling**: HTTP-Status auswerten, OData-Fehlermeldungen parsen
- **Token-Integration**: Vor jedem Request `tokenService.getValidToken()` aufrufen

---

### LLM: Schritt 5 - Spezifischer Service für scep_loeschmich

**Datei**: `lib/services/dataverse/scepLoeschmichService.ts`

**Ziel**: Type-safe Service-Klasse für die `scep_loeschmich`-Tabelle.

**Funktionalität**:
- **Extends** `BaseDataverseClient<ScepLoeschmichRecord>` mit `entitySetName = "scep_loeschmichs"`
- `listAll()`: Alle Datensätze mit allen relevanten Feldern abrufen
- `getById(id)`: Einzelnen Datensatz mit Typ-Garantie
- `createRecord(input: ScepLoeschmichInput)`: Type-safe Create
- `updateRecord(id, input: Partial<ScepLoeschmichInput>)`: Type-safe Update
- `deleteRecord(id)`: Delete mit ID-Validierung
- `listValidated()`: Nur Datensätze mit `scep_validated = true`
- `searchByName(name)`: OData `contains()` Filter
- **Factory-Funktion**: `createScepLoeschmichService()` für einfache Instanziierung

---

### LLM: Schritt 6 - API Routes: Auth (Login, Poll, Status)

**Dateien**:
- `app/api/dataverse/auth/login/route.ts`
- `app/api/dataverse/auth/poll/route.ts`
- `app/api/dataverse/auth/route.ts`

**Ziel**: Device Code Flow für Microsoft-Anmeldung (keine App-Registrierung nötig!).

**Funktionalität `/api/dataverse/auth/login`**:
- **GET**: Startet Device Code Flow
- Ruft Microsoft's `/devicecode` Endpoint auf
- Response: `{ user_code, verification_url, device_code, expires_in, interval }` (ACHTUNG: v1 nutzt `verification_url`!)
- Der Client zeigt `user_code` an und öffnet `verification_url` in neuem Tab

**Funktionalität `/api/dataverse/auth/poll`**:
- **POST**: Pollt Token-Endpoint mit Device Code
- Body: `{ device_code: string }`
- Response: `{ status: 'success' | 'pending' | 'expired' | 'error' }`
- Bei `success`: Token wird gespeichert
- Bei `pending`: Client soll weiter pollen
- Bei `expired`: Neuer Flow starten

**Funktionalität `/api/dataverse/auth`**:
- **GET**: Token-Status prüfen
  - Response: `{ isAuthenticated, expiresIn, userId }`
- **DELETE**: Logout (löscht alle Tokens)

---

### LLM: Schritt 7 - API Route: WhoAmI

**Datei**: `app/api/dataverse/whoami/route.ts`

**Ziel**: API-Endpoint für Dataverse-Verbindungstest.

**Funktionalität**:
- **GET**: Ruft `dataverseClient.getWhoAmI()` auf
- Response: `{ UserId, BusinessUnitId, OrganizationId }`
- **Error Handling**: Bei Token-Fehler → 401 mit Anleitung
- **Use Case**: Verbindungstest beim Laden der Dataverse-Seite

---

### LLM: Schritt 8 - API Route: Tabellen-Setup

**Datei**: `app/api/dataverse/loeschmich/setup/route.ts`

**Ziel**: Automatische Prüfung und Erstellung der `scep_loeschmich`-Tabelle.

**Funktionalität**:
- **GET**: Prüft ob Tabelle existiert, erstellt sie bei Bedarf
  - Ruft `EntityDefinitions(LogicalName='scep_loeschmich')` auf
  - ACHTUNG: Dataverse gibt nicht immer 404 zurück! Auch Fehlercode `0x80060888` oder Message "does not exist" prüfen!
  - Wenn nicht vorhanden → erstellt Tabelle mit allen 4 Feldern (scep_name, scep_remarks, scep_validated, scep_count)
  - Wartet auf Tabellen-Verfügbarkeit (Polling alle 5 Sekunden, max 300 Sekunden / 5 Minuten)
  - Response: `{ tableExists: boolean, entitySetName: string, created?: boolean }`
- **Tabellen-Definition**: Enthält komplette EntityMetadata mit allen Attributen (siehe Abschnitt "Kritische Implementierungsdetails")
- **Error Handling**: Timeout bei Tabellen-Erstellung, Berechtigungsfehler (403)

---

### LLM: Schritt 9 - API Routes: CRUD für loeschmich

**Dateien**:
- `app/api/dataverse/loeschmich/route.ts`
- `app/api/dataverse/loeschmich/[id]/route.ts`

**Ziel**: RESTful API-Endpoints für CRUD-Operationen auf `scep_loeschmich`.

**Funktionalität `/api/dataverse/loeschmich`**:
- **GET**: Liste aller Datensätze (ruft `scepLoeschmichService.listAll()`)
- **POST**: Neuen Datensatz erstellen
  - Validierung: `scep_name` required
  - Response: Erstellter Datensatz mit ID (201 Created)

**Funktionalität `/api/dataverse/loeschmich/[id]`**:
- **GET**: Einzelnen Datensatz nach ID
- **PATCH**: Datensatz aktualisieren (partielle Daten)
- **DELETE**: Datensatz löschen (200 OK mit `{ success: true }`)
- **Error Handling**: 404 bei nicht gefundener ID, 400 bei Validierungsfehlern

---

### LLM: Schritt 10 - React Components

**Dateien**:
- `app/components/dataverse/LoginPrompt.tsx`
- `app/components/dataverse/WhoAmICard.tsx`
- `app/components/dataverse/LoeschmichTable.tsx`
- `app/components/dataverse/LoeschmichForm.tsx`
- `app/components/dataverse/CurlCommandPanel.tsx`

**Ziel**: UI-Komponenten für die Dataverse-Demo-Seite.

**LoginPrompt**:
- Wird angezeigt, wenn kein gültiges Token vorhanden ist
- Button: "Mit Microsoft anmelden" → Startet Device Code Flow
- Zeigt User Code (z.B. "ABCD1234") prominent an
- Öffnet automatisch `microsoft.com/devicelogin` in neuem Tab
- Pollt im Hintergrund auf Token (alle 5 Sekunden)
- Zeigt Countdown bis Code abläuft
- Copy-Button für User Code
- Zeigt Dataverse-Environment-URL zur Bestätigung

**WhoAmICard**:
- Zeigt Verbindungsstatus zu Dataverse
- Displays: UserId, BusinessUnitId, OrganizationId
- Loading-State, Error-State
- Badge: "Connected" / "Error"
- Button: "Abmelden" → Logout-Funktion

**LoeschmichTable**:
- Tabelle mit allen `scep_loeschmich`-Datensätzen
- Spalten: Name, Remarks (truncated), Validated (Badge), Count, Created
- Actions pro Zeile: Edit, Delete
- Loading-State, Empty-State
- **Delete mit Doppelklick-Bestätigung**: Erster Klick → Button wird rot, zweiter Klick → Löscht (Reset nach 3 Sekunden)

**LoeschmichForm**:
- Formular für Create und Edit
- Felder: Name (required), Remarks (textarea), Validated (checkbox), Count (number)
- Props: `editRecord?` (für Edit-Modus), `onSubmit`, `onCancel`
- Validierung, Loading-State während Submit
- Reset nach erfolgreichem Create

**CurlCommandPanel**:
- Collapsible Panel zur Anzeige des letzten curl-Befehls
- Props: `command` (string), `isOpen` (boolean)
- "Copy to Clipboard" Button
- Syntax-Highlighting für bessere Lesbarkeit
- Zeigt Methode, URL, Headers und Body

---

### LLM: Schritt 11 - Demo-Seite mit automatischer Tabellen-Erstellung

**Datei**: `app/dataverse/page.tsx`

**Ziel**: Vollständige Demo-Seite für die Dataverse-Integration mit automatischem Login-Flow und Tabellen-Erstellung.

**Funktionalität**:
- **Auth-Check beim Laden**:
  - Prüft `/api/dataverse/auth` ob Token vorhanden
  - Wenn nicht authentifiziert → zeigt `LoginPrompt`
  - Wenn authentifiziert → prüft ob Tabelle existiert
- **Automatische Tabellen-Erstellung**:
  - Nach erfolgreichem Login: Prüft ob `scep_loeschmich` Tabelle existiert
  - Wenn nicht vorhanden → erstellt Tabelle automatisch mit allen 4 Feldern
  - Zeigt Fortschritts-Indikator während Erstellung
  - Wartet auf Tabellen-Verfügbarkeit (bis zu 5 Minuten - Dataverse ist langsam!)
- **Layout (nach Login + Tabelle bereit)**: 
  - Oben: WhoAmICard (Verbindungsstatus + Logout)
  - Mitte: LoeschmichTable (Datensätze) mit **curl-Befehl-Anzeige**
  - Unten: LoeschmichForm (Create/Edit) mit **curl-Befehl-Anzeige**
- **curl-Befehl-Anzeige (DevTools-Panel)**:
  - Bei jeder API-Operation wird der entsprechende curl-Befehl angezeigt
  - Collapsible Panel unter der Hauptaktion
  - Copy-to-Clipboard Button
  - Beispiel: Nach "Datensatz erstellen" zeigt Panel:
    ```
    curl -X POST http://localhost:3000/api/dataverse/loeschmich \
      -H "Content-Type: application/json" \
      -d '{"scep_name":"Test","scep_remarks":"Demo",...}'
    ```
- **State Management**:
  - `isAuthenticated`: boolean
  - `tableReady`: boolean (Tabelle existiert und ist verfügbar)
  - `whoAmI`: WhoAmI-Daten
  - `records`: Liste der Datensätze
  - `editRecord`: Aktuell bearbeiteter Datensatz (null = Create-Modus)
  - `lastCurlCommand`: Letzter ausgeführter curl-Befehl
  - Loading/Error States
- **API-Calls**:
  - `checkAuth()` → `/api/dataverse/auth`
  - `checkTable()` → `/api/dataverse/loeschmich/setup` (prüft/erstellt Tabelle)
  - `fetchWhoAmI()` → `/api/dataverse/whoami`
  - `fetchRecords()` → `/api/dataverse/loeschmich`
  - `handleCreate(data)` → POST `/api/dataverse/loeschmich`
  - `handleUpdate(id, data)` → PATCH `/api/dataverse/loeschmich/[id]`
  - `handleDelete(id)` → DELETE `/api/dataverse/loeschmich/[id]`
  - `handleLogout()` → DELETE `/api/dataverse/auth`
- **UX**:
  - Auto-Refresh der Liste nach Create/Update/Delete
  - Edit-Modus: Formular scrollt in View, zeigt "Cancel"-Button
  - Success/Error Toasts
  - curl-Befehl wird nach jeder Operation aktualisiert

---

## API-Referenz

### Auth Endpoints
| Methode | URL | Beschreibung |
|---------|-----|--------------|
| GET | `/api/dataverse/auth` | Token-Status prüfen |
| GET | `/api/dataverse/auth/login` | Startet Device Code Flow |
| POST | `/api/dataverse/auth/poll` | Pollt Token-Endpoint |
| DELETE | `/api/dataverse/auth` | Logout (löscht Tokens) |

### WhoAmI Endpoint
| Methode | URL | Beschreibung |
|---------|-----|--------------|
| GET | `/api/dataverse/whoami` | Verbindungstest |

### Loeschmich Endpoints
| Methode | URL | Beschreibung |
|---------|-----|--------------|
| GET | `/api/dataverse/loeschmich/setup` | Prüft/erstellt Tabelle automatisch |
| GET | `/api/dataverse/loeschmich` | Alle Datensätze auflisten |
| POST | `/api/dataverse/loeschmich` | Neuen Datensatz erstellen |
| GET | `/api/dataverse/loeschmich/[id]` | Einzelnen Datensatz abrufen |
| PATCH | `/api/dataverse/loeschmich/[id]` | Datensatz aktualisieren |
| DELETE | `/api/dataverse/loeschmich/[id]` | Datensatz löschen |

---

## Testing-Anleitung

**Wichtig**: Alle Tests werden direkt in der Dataverse-Demo-Seite durchgeführt. Die UI zeigt bei jeder Operation den entsprechenden curl-Befehl an, sodass du nachvollziehen kannst, was im Hintergrund passiert.

### 1. Dev-Server starten
```bash
npm run dev
```

### 2. Dataverse-Seite öffnen
Navigiere zu `http://localhost:3000/dataverse`

### 3. Erster Login (interaktiv in der UI)
1. Die App zeigt **LoginPrompt** mit Button "Mit Microsoft anmelden"
2. Klicke auf den Button → Microsoft-Login-Fenster öffnet sich
3. Melde dich mit deinem Microsoft-Konto an
4. Nach erfolgreicher Anmeldung: Redirect zurück zur App
5. **WhoAmI-Card** zeigt deine User-ID → Verbindung erfolgreich!

**curl-Befehl wird angezeigt:**
```
curl http://localhost:3000/api/dataverse/auth
# Response: { "isAuthenticated": true, "expiresIn": 3500, "userId": "..." }
```

### 4. Automatische Tabellen-Erstellung
Nach dem Login prüft die App automatisch, ob die Tabelle `scep_loeschmich` existiert:
- **Tabelle existiert nicht** → App erstellt sie automatisch (30-120 Sek. warten)
- **Tabelle existiert** → Datensätze werden geladen

**curl-Befehl wird angezeigt:**
```
curl http://localhost:3000/api/dataverse/loeschmich/setup
# Response: { "tableExists": true, "entitySetName": "scep_loeschmichs" }
```

### 5. CRUD-Operationen testen (alles in der UI)

**Datensätze auflisten:**
- Die Tabelle zeigt alle vorhandenen Datensätze
- curl-Befehl: `curl http://localhost:3000/api/dataverse/loeschmich`

**Neuen Datensatz erstellen:**
1. Fülle das Formular aus (Name, Remarks, Validated, Count)
2. Klicke "Erstellen"
3. curl-Befehl wird angezeigt:
   ```
   curl -X POST http://localhost:3000/api/dataverse/loeschmich \
     -H "Content-Type: application/json" \
     -d '{"scep_name":"Test","scep_remarks":"Demo","scep_validated":true,"scep_count":42}'
   ```

**Datensatz bearbeiten:**
1. Klicke "Edit" bei einem Datensatz
2. Ändere die Werte im Formular
3. Klicke "Speichern"
4. curl-Befehl wird angezeigt:
   ```
   curl -X PATCH http://localhost:3000/api/dataverse/loeschmich/{id} \
     -H "Content-Type: application/json" \
     -d '{"scep_count":100}'
   ```

**Datensatz löschen:**
1. Klicke "Delete" bei einem Datensatz
2. Bestätige im Dialog
3. curl-Befehl wird angezeigt:
   ```
   curl -X DELETE http://localhost:3000/api/dataverse/loeschmich/{id}
   ```

### 6. Logout testen
1. Klicke "Abmelden" in der WhoAmI-Card
2. App zeigt wieder LoginPrompt
3. curl-Befehl wird angezeigt:
   ```
   curl -X DELETE http://localhost:3000/api/dataverse/auth
   # Response: { "success": true }
   ```

### 7. Re-Login nach Token-Ablauf
Wenn der Refresh Token nach ~90 Tagen abläuft:
1. Die App erkennt automatisch, dass kein gültiges Token vorhanden ist
2. Zeigt "LoginPrompt" → erneut "Mit Microsoft anmelden" klicken
3. Kein manuelles Token-Kopieren erforderlich!

---

## Kritische Implementierungsdetails für LLMs

Dieser Abschnitt beschreibt die wichtigsten technischen Details, die bei einer Neuimplementierung beachtet werden müssen.

### Device Code Flow - Kritische Punkte

1. **Azure AD v1 vs v2 Endpoints**
   - Diese Implementierung nutzt **v1 Endpoints** (`/oauth2/devicecode`, `/oauth2/token`)
   - v1 verwendet `verification_url`, v2 verwendet `verification_uri`
   - v1 benötigt `resource` Parameter, v2 benötigt `scope`

2. **Token-Endpoint Request Format**
   ```
   grant_type=device_code&client_id={client_id}&resource={dataverse_url}&code={device_code}
   ```

3. **Polling-Verhalten**
   - Microsoft gibt `interval` zurück (Sekunden zwischen Polls)
   - Mindestens 5 Sekunden zwischen Anfragen
   - Response `authorization_pending` → weiter pollen
   - Response mit `access_token` → fertig

### Token-Persistenz - Next.js Worker-Problem

Next.js startet mehrere Worker-Prozesse. Ein In-Memory-Cache funktioniert nicht zuverlässig.

**Lösung**: File-basierter Cache mit Laden bei jedem Zugriff:
```typescript
// Bei JEDEM Zugriff aus Datei laden, nicht nur beim Modulstart!
function loadTokenCache(): void {
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    const data = fs.readFileSync(TOKEN_CACHE_FILE, 'utf8');
    tokenCache = JSON.parse(data);
  }
}

// VOR jeder isAuthenticated() oder getValidToken() Prüfung aufrufen!
export function isAuthenticated(): boolean {
  loadTokenCache(); // <- KRITISCH!
  return tokenCache !== null && !isTokenExpired();
}
```

**Vercel-Pfad**: `/tmp` ist das einzige beschreibbare Verzeichnis, aber NICHT persistent über Cold Starts.

### Tabellenerstellung in Dataverse

1. **Timeout erhöhen**: Dataverse benötigt oft 2-5 Minuten für neue Tabellen
2. **Fehlercode für nicht-existierende Tabelle**: `0x80060888` (nicht nur 404!)
3. **Polling auf EntitySet**: Nach Erstellung auf `{entitySetName}?$top=0` pollen

```typescript
// Erkenne "Tabelle existiert nicht" auch über Fehlermeldung
if (error.message.includes('does not exist') || error.code === '0x80060888') {
  return false; // Tabelle existiert nicht
}
```

### Lösch-Funktion UI-Pattern

Die Tabelle verwendet ein **Doppelklick-Bestätigungs-Pattern**:
1. Erster Klick → Button wird rot, zeigt "Bestätigen"
2. Zweiter Klick innerhalb 3 Sekunden → Löscht tatsächlich
3. Nach 3 Sekunden → Reset auf normalen Zustand

### OData-Felder für scep_loeschmich

| Feldname | Typ | Dataverse-Typ | Hinweise |
|----------|-----|---------------|----------|
| `scep_loeschmichid` | string (GUID) | Primary Key | Auto-generiert |
| `scep_name` | string | String (200) | Primary Name, Required |
| `scep_remarks` | string | Memo (4000) | Optional |
| `scep_validated` | boolean | Boolean | Default: false |
| `scep_count` | number | Integer | Optional |
| `createdon` | string | DateTime | System-Feld, ReadOnly |
| `modifiedon` | string | DateTime | System-Feld, ReadOnly |

### API-Header für Dataverse

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'OData-Version': '4.0',
  'OData-MaxVersion': '4.0',
  'Accept': 'application/json',
  'Content-Type': 'application/json; charset=utf-8',
  'Prefer': 'return=representation', // Nur bei POST/PATCH für Response-Body
};
```

### Fehlerbehandlung Best Practices

- **401 Unauthorized**: Token ungültig → Refresh versuchen oder neu anmelden
- **403 Forbidden**: Keine Berechtigung → Admin kontaktieren
- **404 Not Found**: Datensatz/Tabelle existiert nicht
- **400 Bad Request**: Validierungsfehler → OData-Fehlermeldung parsen