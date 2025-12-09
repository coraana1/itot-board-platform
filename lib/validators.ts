/**
 * validators.ts – Zod-Schemas für Datenvalidierung
 * 
 * Zod ist eine Bibliothek zur Validierung von Daten.
 * Diese Schemas werden sowohl client- als auch serverseitig verwendet,
 * um sicherzustellen, dass die Daten korrekt sind.
 */

import { z } from "zod";

/**
 * Schema für Komplexität
 * Erlaubt nur die drei definierten Werte
 */
export const komplexitaetSchema = z.enum(["gering", "mittel", "hoch"], {
  message: "Bitte wähle eine Komplexität aus",
});

/**
 * Schema für Kritikalität
 * Erlaubt nur die drei definierten Werte
 */
export const kritikalitaetSchema = z.enum(["gering", "mittel", "hoch"], {
  message: "Bitte wähle eine Kritikalität aus",
});

/**
 * Schema für Lifecycle-Status
 * Alle möglichen Status-Werte einer Idee (Dataverse Picklist)
 * 
 * Werte:
 * 562520000 = eingereicht
 * 562520001 = Idee in Qualitätsprüfung
 * 562520002 = Idee zur Überarbeitung an Ideengeber
 * 562520003 = Genehmigt
 * 562520004 = Abgelehnt
 * 562520005 = Idee wird ITOT-Board vorgestellt
 * 562520006 = Idee in Projektportfolio aufgenommen
 * 562520007 = Idee in Quartalsplanung aufgenommen
 * 562520008 = Idee in Wochenplanung aufgenommen
 * 562520009 = Idee in Detailanalyse
 * 562520010 = In Umsetzung
 * 562520011 = Abgeschlossen
 */
export const lifecycleStatusSchema = z.enum([
  "eingereicht",
  "Idee in Qualitätsprüfung",
  "Idee zur Überarbeitung an Ideengeber",
  "Genehmigt",
  "Abgelehnt",
  "Idee wird ITOT-Board vorgestellt",
  "Idee in Projektportfolio aufgenommen",
  "Idee in Quartalsplanung aufgenommen",
  "Idee in Wochenplanung aufgenommen",
  "Idee in Detailanalyse",
  "In Umsetzung",
  "Abgeschlossen",
]);

/**
 * Schema für die ITOT Board Bewertung
 * Dies ist das Formular, das ITOT Board Mitglieder ausfüllen
 */
export const itotBewertungSchema = z.object({
  komplexitaet: komplexitaetSchema,
  kritikalitaet: kritikalitaetSchema,
  itotBoard_begruendung: z
    .string()
    .min(10, "Die Begründung muss mindestens 10 Zeichen lang sein")
    .max(2000, "Die Begründung darf maximal 2000 Zeichen lang sein"),
});

/**
 * TypeScript-Typ aus dem Zod-Schema ableiten
 * So sind Schema und Typ immer synchron
 */
export type ITOTBewertungFormData = z.infer<typeof itotBewertungSchema>;

/**
 * Schema für eine vollständige Idee (zur Validierung von API-Antworten)
 */
export const ideeSchema = z.object({
  id: z.string(),
  titel: z.string(),
  beschreibung: z.string(),
  typ: z.string(),
  verantwortlicher: z.string(),
  ideengeber: z.string(),
  detailanalyse_ergebnis: z.string().optional(),
  detailanalyse_personentage: z.number().optional(),
  detailanalyse_nutzen: z.string().optional(),
  komplexitaet: komplexitaetSchema.optional(),
  kritikalitaet: kritikalitaetSchema.optional(),
  itotBoard_begruendung: z.string().optional(),
  lifecyclestatus: lifecycleStatusSchema,
  erstelltAm: z.coerce.date().optional(),
  aktualisiertAm: z.coerce.date().optional(),
});

/**
 * Schema für die Listenansicht (nur benötigte Felder)
 */
export const ideenListeItemSchema = z.object({
  id: z.string(),
  titel: z.string(),
  typ: z.string(),
  verantwortlicher: z.string(),
  ideengeber: z.string(),
  lifecyclestatus: lifecycleStatusSchema,
});

/**
 * Schema für ein Array von Ideen (Listenansicht)
 */
export const ideenListeSchema = z.array(ideenListeItemSchema);
