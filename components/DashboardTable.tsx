/**
 * DashboardTable – Sortierbare Tabelle für das Dashboard
 * 
 * Client Component Wrapper für die SortableTable.
 * Zeigt Ideen zur Bewertung mit Sortier-Funktion.
 */

"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import SortableTable, { Column } from "./SortableTable";
import type { IdeenListeItem } from "@/lib/types";

interface DashboardTableProps {
  ideen: IdeenListeItem[];
}

export default function DashboardTable({ ideen }: DashboardTableProps) {
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
      emptyMessage="Keine Ideen zur Bewertung gefunden"
      renderActions={(idee) => (
        <Link
          href={`/ideen/${idee.id}`}
          className="btn btn-sm btn-primary gap-1"
        >
          <Eye size={16} />
          Ansehen
        </Link>
      )}
    />
  );
}
