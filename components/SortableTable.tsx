/**
 * SortableTable – Wiederverwendbare Tabelle mit Sortier-Funktion
 * 
 * Client Component, die Sortierung über die Tabellenköpfe ermöglicht.
 * Klick auf Header sortiert aufsteigend, nochmal klicken sortiert absteigend.
 */

"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// Typ für eine Spalten-Definition
export interface Column<T> {
  key: keyof T | string;
  header: string;
  // Funktion um den Wert für die Anzeige zu holen
  getValue: (item: T) => string | React.ReactNode;
  // Funktion um den Wert für die Sortierung zu holen (optional)
  getSortValue?: (item: T) => string | number;
  // Ist diese Spalte sortierbar? (Standard: true)
  sortable?: boolean;
  // CSS-Klassen für die Zelle
  className?: string;
}

// Sortier-Richtung
type SortDirection = "asc" | "desc" | null;

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  // Eindeutiger Schlüssel für jede Zeile
  getRowKey: (item: T) => string;
  // Optionale Aktion am Ende jeder Zeile
  renderActions?: (item: T) => React.ReactNode;
  // Leerer Zustand
  emptyMessage?: string;
}

export default function SortableTable<T>({
  data,
  columns,
  getRowKey,
  renderActions,
  emptyMessage = "Keine Einträge gefunden",
}: SortableTableProps<T>) {
  // Aktuelle Sortierung
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Sortierte Daten berechnen
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    const column = columns.find((c) => String(c.key) === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      // Wert für Sortierung holen
      const aValue = column.getSortValue 
        ? column.getSortValue(a) 
        : String(column.getValue(a) || "");
      const bValue = column.getSortValue 
        ? column.getSortValue(b) 
        : String(column.getValue(b) || "");

      // Vergleichen
      let comparison = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), "de");
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  // Sortierung umschalten
  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      // Neue Spalte: aufsteigend sortieren
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      // Gleiche Spalte, war aufsteigend: absteigend
      setSortDirection("desc");
    } else {
      // Gleiche Spalte, war absteigend: Sortierung aufheben
      setSortKey(null);
      setSortDirection(null);
    }
  };

  // Icon für Sortier-Zustand
  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={14} className="opacity-40" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp size={14} className="text-primary" />;
    }
    return <ArrowDown size={14} className="text-primary" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra bg-base-100 shadow">
        <thead>
          <tr>
            {columns.map((col) => {
              const key = String(col.key);
              const isSortable = col.sortable !== false;
              const isActive = sortKey === key;

              return (
                <th key={key}>
                  {isSortable ? (
                    <button
                      onClick={() => toggleSort(key)}
                      className={`flex items-center gap-1 hover:text-primary transition-colors cursor-pointer ${
                        isActive ? "text-primary font-bold" : ""
                      }`}
                    >
                      {col.header}
                      {getSortIcon(key)}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
            {renderActions && <th className="text-right">Aktion</th>}
          </tr>
        </thead>

        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (renderActions ? 1 : 0)}
                className="text-center text-base-content/50 py-8"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item) => (
              <tr key={getRowKey(item)} className="hover">
                {columns.map((col) => (
                  <td key={String(col.key)} className={col.className}>
                    {col.getValue(item)}
                  </td>
                ))}
                {renderActions && (
                  <td className="text-right">{renderActions(item)}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
