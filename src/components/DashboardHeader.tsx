"use client";

import { Plus, Settings, Pencil } from "lucide-react";

type Props = {
  editMode: boolean;
  onToggleEditMode: () => void;
  onAddService: () => void;
  onOpenSettings: () => void;
};

export function DashboardHeader({
  editMode,
  onToggleEditMode,
  onAddService,
  onOpenSettings,
}: Props) {
  return (
    <header className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold text-white">Neodash</h1>
      <div className="flex gap-2">
        <button
          onClick={onToggleEditMode}
          className={`p-2.5 rounded-xl transition-colors ${
            editMode
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
          title={editMode ? "Bearbeitungsmodus beenden" : "Bearbeiten"}
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Einstellungen"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={onAddService}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} />
          Dienst hinzufügen
        </button>
      </div>
    </header>
  );
}
