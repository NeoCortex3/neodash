"use client";

import { useState, useEffect } from "react";
import { ICON_OPTIONS, getLucideIcon, getFaviconUrl } from "@/lib/icons";
import { Globe, Link } from "lucide-react";

type Props = {
  value: string;
  onChange: (icon: string) => void;
  serviceUrl?: string;
  onColorDetected?: (color: string) => void;
  initialMode?: Mode;
};

type Mode = "icons" | "url" | "favicon";

async function getDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      let data: Uint8ClampedArray;
      try {
        data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      } catch {
        resolve(null); return; // cross-origin image without CORS headers
      }
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        const brightness = (pr + pg + pb) / 3;
        if (brightness < 20 || brightness > 235) continue;
        const max = Math.max(pr, pg, pb);
        const sat = max === 0 ? 0 : (max - Math.min(pr, pg, pb)) / max;
        if (sat < 0.2) continue;
        r += pr; g += pg; b += pb; count++;
      }
      if (count === 0) { resolve(null); return; }
      resolve(`#${Math.round(r/count).toString(16).padStart(2,"0")}${Math.round(g/count).toString(16).padStart(2,"0")}${Math.round(b/count).toString(16).padStart(2,"0")}`);
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl.startsWith("http")
      ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
  });
}

export function IconPicker({ value, onChange, serviceUrl, onColorDetected, initialMode }: Props) {
  const [mode, setMode] = useState<Mode>(() => {
    if (initialMode) return initialMode;
    if (value.startsWith("https://www.google.com/s2/favicons") ||
        value.startsWith("/api/uploads/favicon-")) return "favicon";
    if (value.startsWith("http")) return "url";
    return "favicon";
  });
  const [search, setSearch] = useState("");
  const [customUrl, setCustomUrl] = useState(
    (value.startsWith("http") && !value.startsWith("https://www.google.com/s2/favicons")) ||
    value.startsWith("/api/uploads/icon-") ? value : ""
  );
  const [faviconLoading, setFaviconLoading] = useState(false);

  // Sync customUrl when value is set externally (e.g. on dialog open before useEffect fires)
  useEffect(() => {
    const isExternalUrl = value.startsWith("http") && !value.startsWith("https://www.google.com/s2/favicons");
    const isCachedIcon = value.startsWith("/api/uploads/icon-");
    if (isExternalUrl || isCachedIcon) {
      setCustomUrl(value);
      if (onColorDetected) {
        getDominantColor(value).then((c) => { if (c) onColorDetected(c); });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Auto-download favicon when serviceUrl changes while on the favicon tab
  useEffect(() => {
    if (mode !== "favicon" || !serviceUrl) return;
    try { new URL(serviceUrl); } catch { return; }

    // Skip if we already have this favicon cached
    const domain = new URL(serviceUrl).hostname;
    const sanitized = domain.replace(/[^a-zA-Z0-9.-]/g, "_");
    if (value === `/api/uploads/favicon-${sanitized}.png`) return;

    const timer = setTimeout(() => {
      setFaviconLoading(true);
      fetch("/api/favicon-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: serviceUrl }),
      })
        .then((res) => {
          if (res.ok) {
            res.json().then((d) => {
              onChange(d.url);
              getDominantColor(d.url).then((c) => { if (c && onColorDetected) onColorDetected(c); });
            });
          } else {
            onChange(getFaviconUrl(serviceUrl));
          }
        })
        .finally(() => setFaviconLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceUrl, mode]);

  const filteredIcons = ICON_OPTIONS.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const tabClass = (tab: Mode) =>
    `flex-1 text-xs py-1.5 px-2 rounded-md transition-colors ${
      mode === tab
        ? "bg-gray-700 text-white"
        : "text-gray-400 hover:text-white"
    }`;

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        <button
          type="button"
          onClick={async () => {
            setMode("favicon");
            setSearch("");
            if (!serviceUrl) return;
            setFaviconLoading(true);
            try {
              const res = await fetch("/api/favicon-cache", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: serviceUrl }),
              });
              if (res.ok) {
                const data = await res.json();
                onChange(data.url);
                if (onColorDetected) {
                  getDominantColor(data.url).then((c) => { if (c) onColorDetected(c); });
                }
              } else {
                onChange(getFaviconUrl(serviceUrl));
              }
            } finally {
              setFaviconLoading(false);
            }
          }}
          className={tabClass("favicon")}
        >
          <span className="flex items-center justify-center gap-1">
            <Globe size={11} />
            Favicon
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setMode("icons"); setSearch(""); }}
          className={tabClass("icons")}
        >
          Icons
        </button>
        <button
          type="button"
          onClick={() => { setMode("url"); setSearch(""); }}
          className={tabClass("url")}
        >
          <span className="flex items-center justify-center gap-1">
            <Link size={11} />
            URL
          </span>
        </button>
      </div>

      {/* Icons tab */}
      {mode === "icons" && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Icon suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1">
            {filteredIcons.map((name) => {
              const Icon = getLucideIcon(name) || Globe;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange(name)}
                  title={name}
                  className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                    value === name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* URL tab */}
      {mode === "url" && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="https://example.com/icon.png"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              if (e.target.value) {
                onChange(e.target.value);
              }
            }}
            onBlur={async (e) => {
              const v = e.target.value;
              if (!v) return;
              try {
                const res = await fetch("/api/cache-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: v }),
                });
                if (res.ok) {
                  const { url: localUrl } = await res.json();
                  onChange(localUrl);
                  setCustomUrl(localUrl);
                  if (onColorDetected) {
                    getDominantColor(localUrl).then((c) => { if (c) onColorDetected(c); });
                  }
                }
              } catch { /* ignore */ }
            }}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {customUrl && (
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={customUrl}
                alt="Preview"
                className="w-8 h-8 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-xs text-gray-400">Vorschau</span>
            </div>
          )}
        </div>
      )}

      {/* Favicon tab */}
      {mode === "favicon" && (
        <div className="space-y-2">
          {faviconLoading ? (
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-8 h-8 rounded bg-gray-700 animate-pulse shrink-0" />
              <p className="text-sm text-gray-400">Favicon wird geladen...</p>
            </div>
          ) : serviceUrl && value.startsWith("/api/uploads/favicon-") ? (
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Favicon"
                className="w-8 h-8 rounded shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="min-w-0">
                <p className="text-sm text-white">Favicon von</p>
                <p className="text-xs text-gray-400 truncate">{serviceUrl}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 p-3 bg-gray-800 rounded-lg">
              Bitte zuerst eine URL eingeben.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
