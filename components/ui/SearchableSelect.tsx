/**
 * SearchableSelect – Durchsuchbares Multi-Select Dropdown
 * 
 * Eine Combobox-Komponente, die es ermöglicht, mehrere Optionen zu durchsuchen
 * und per Checkbox auszuwählen.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string[];  // Array für Multi-Select
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Auswählen...",
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ausserhalb klicken schliesst das Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gefilterte Optionen basierend auf Suche
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ausgewählte Optionen finden
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  // Option togglen (hinzufügen/entfernen)
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  // Alle löschen
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchQuery("");
  };

  // Einzelne Option entfernen
  const removeOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  // Display-Text generieren
  const getDisplayText = () => {
    if (selectedOptions.length === 0) return null;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions.length} ausgewählt`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-2 py-2 text-sm rounded-lg border transition-colors cursor-pointer text-left
          ${value.length > 0 
            ? "bg-violet-50 border-violet-300 text-violet-700" 
            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
      >
        <div className="flex-1 flex items-center gap-1 flex-wrap min-w-0">
          {value.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : value.length <= 2 ? (
            // Zeige einzelne Badges wenn 1-2 ausgewählt
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => removeOption(e, opt.value)}
                  className="hover:bg-violet-200 rounded"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            // Zeige Anzahl wenn mehr als 2
            <span>{selectedOptions.length} ausgewählt</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-violet-200 rounded"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Suchfeld */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Optionen-Liste */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Keine Ergebnisse
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors
                      ${isSelected ? "bg-violet-50" : ""}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                      ${isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"}`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className={isSelected ? "text-violet-700 font-medium" : "text-gray-700"}>
                      {option.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer mit Aktionen */}
          {value.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  onChange([]);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-violet-600 transition-colors"
              >
                Alle abwählen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
