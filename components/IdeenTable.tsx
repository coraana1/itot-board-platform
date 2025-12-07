/**
 * IdeenTable – Sortierbare Tabelle für alle Ideen
 * 
 * Client Component Wrapper für die SortableTable.
 * Zeigt alle Ideen mit Status-Badges und Sortier-Funktion.
 */

"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import SortableTable, { Column } from "./SortableTable";
import type { IdeenListeItem, LifecycleStatus } from "@/lib/types";

interface IdeenTableProps {
  ideen: IdeenListeItem[];
}

// Hilfsfunktion für Status-Badge-Farbe
function getStatusBadgeClass(status: LifecycleStatus): string {
  switch (status) {
    case "Idee eingereicht":
      return "badge-neutral";
    case "Idee wird ITOT-Board vorgestellt":
      return "badge-warning";
    case "ITOT-Board Bewertung abgeschlossen":
      return "badge-success";
    case "In Umsetzung":
      return "badge-info";
    case "Abgeschlossen":
      return "badge-success badge-outline";
    case "Abgelehnt":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

export default function IdeenTable({ ideen }: IdeenTableProps) {
  // Spalten-Definition
  const columns: Column<IdeenListeItem>[] = [
    {
      key: "titel",
      header: "Titel",
      getValue: (idee) => idee.titel,
      getSortValue: (idee) => idee.titel,
      className: "font-medium",
    },
    {
      key: "typ",
      header: "Typ",
      getValue: (idee) => (
        <span className="badge badge-ghost">{idee.typ}</span>
      ),
      getSortValue: (idee) => idee.typ,
    },
    {
      key: "lifecyclestatus",
      header: "Status",
      getValue: (idee) => (
        <span className={`badge ${getStatusBadgeClass(idee.lifecyclestatus)}`}>
          {idee.lifecyclestatus}
        </span>
      ),
      getSortValue: (idee) => idee.lifecyclestatus,
    },
    {
      key: "verantwortlicher",
      header: "Verantwortlich",
      getValue: (idee) => idee.verantwortlicher,
      getSortValue: (idee) => idee.verantwortlicher,
    },
    {
      key: "ideengeber",
      header: "Ideengeber",
      getValue: (idee) => idee.ideengeber,
      getSortValue: (idee) => idee.ideengeber,
    },
  ];

  return (
    <SortableTable
      data={ideen}
      columns={columns}
      getRowKey={(idee) => idee.id}
      emptyMessage="Keine Ideen gefunden"
      renderActions={(idee) => (
        <Link
          href={`/ideen/${idee.id}`}
          className="btn btn-sm btn-outline gap-1"
        >
          <Eye size={16} />
          Details
        </Link>
      )}
    />
  );
}
