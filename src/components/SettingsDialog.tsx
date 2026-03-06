"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload } from "lucide-react";

type Props = {
  open: boolean;
  currentBg: string;
  currentBgOpacity: number;
  currentOpenInNewTab: boolean;
  onSave: (url: string, opacity: number, openInNewTab: boolean) => void;
  onClose: () => void;
};

export function SettingsDialog({ open, currentBg, currentBgOpacity, currentOpenInNewTab, onSave, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentBg);
  const [opacity, setOpacity] = useState(Math.round((currentBgOpacity ?? 1) * 100));
  const [openInNewTab, setOpenInNewTab] = useState(currentOpenInNewTab);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUrl(currentBg);
    setOpacity(Math.round((currentBgOpacity ?? 1) * 100));
    setOpenInNewTab(currentOpenInNewTab);
  }, [currentBg, currentBgOpacity, currentOpenInNewTab, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url, opacity / 100, openInNewTab);
  };

  const handleRemove = () => {
    onSave("", 1, openInNewTab);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data: { url: string } = await res.json();
        setUrl(`${data.url}?t=${Date.now()}`);
      }
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-0 w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Einstellungen</h2>
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
            <label className="block text-sm text-gray-400 mb-1.5">
              Hintergrundbild
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/background.jpg"
                className="flex-1 min-w-0 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Datei hochladen"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
              >
                <Upload size={15} />
                {uploading ? "…" : "Upload"}
              </button>
            </div>
          </div>

          {url && (
            <div className="rounded-lg overflow-hidden border border-gray-700 h-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Vorschau"
                className="w-full h-full object-cover"
                style={{ opacity: opacity / 100 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-gray-400">Deckkraft</label>
              <span className="text-sm text-white font-mono">{opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <hr className="border-gray-700" />

        <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 rounded-full bg-gray-700 peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </div>
          <span className="text-sm text-gray-400">Links in neuem Tab öffnen</span>
        </label>

        <div className="flex gap-3 justify-between pt-2">
          <button
            type="button"
            onClick={handleRemove}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Entfernen
          </button>
          <div className="flex gap-3">
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
              Speichern
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
