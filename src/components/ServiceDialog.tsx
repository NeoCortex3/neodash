"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { IconPicker } from "./IconPicker";
import type { Service, ServiceFormData } from "@/types/service";

type Props = {
  open: boolean;
  service: Service | null;
  onSave: (data: ServiceFormData) => void;
  onClose: () => void;
};

export function ServiceDialog({ open, service, onSave, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("Globe");
  const [color, setColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [glassEffect, setGlassEffect] = useState(true);

  useEffect(() => {
    const c = service?.color ?? "#3b82f6";
    setName(service?.name ?? "");
    setUrl(service?.url ?? "");
    setIcon(service?.icon ?? "Globe");
    setColor(c);
    setHexInput(c);
    setGlassEffect(service ? service.glassEffect === 1 : true);
  }, [service, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  const handleColorChange = (hex: string) => {
    setColor(hex);
    setHexInput(hex);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setColor(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, url, icon, color, glassEffect });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-0 w-full max-w-md backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {service ? "Dienst bearbeiten" : "Neuen Dienst hinzufügen"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Plex, Home Assistant"
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.100:8096"
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Icon</label>
            <IconPicker
              key={open ? (service?.id ?? "new") : "closed"}
              value={icon}
              onChange={setIcon}
              serviceUrl={url}
              onColorDetected={handleColorChange}
              initialMode={(() => {
                const ic = service?.icon ?? "";
                if (ic.startsWith("/api/uploads/favicon-") || ic.startsWith("https://www.google.com/s2/favicons")) return "favicon";
                if (ic.startsWith("http") || ic.startsWith("/api/uploads/icon-")) return "url";
                if (service) return "icons";
                return "favicon";
              })()}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Farbe</label>
            <HexColorPicker
              color={color}
              onChange={handleColorChange}
              style={{ width: "100%" }}
            />
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-8 h-8 rounded-lg border border-gray-600 shrink-0"
                style={{ backgroundColor: color }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                maxLength={7}
                placeholder="#3b82f6"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
            <div className="relative">
              <input
                type="checkbox"
                checked={glassEffect}
                onChange={(e) => setGlassEffect(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 rounded-full bg-gray-700 peer-checked:bg-blue-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-400">Glassmorphism</span>
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            {service ? "Speichern" : "Hinzufügen"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
