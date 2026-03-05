import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOADS_PATH =
  process.env.UPLOADS_PATH ?? path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  let url: string;
  try {
    const body = await request.json();
    url = body.url;
    new URL(url); // validate
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const parsed = new URL(url);
  const domain = parsed.hostname;
  const sanitized = `${domain.replace(/[^a-zA-Z0-9.-]/g, "_")}${parsed.port ? `_${parsed.port}` : ""}`;
  const filename = `favicon-${sanitized}.png`;

  const isLocal =
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(domain) ||
    /^\d+\.\d+\.\d+\.\d+$/.test(domain);

  // Fetch an image URL and return its buffer if it's a valid image
  async function fetchImage(imageUrl: string): Promise<Buffer | null> {
    try {
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const ct = res.headers.get("content-type") ?? "";
      if (ct.startsWith("image/") || ct.includes("icon") || ct.includes("svg")) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch { /* ignore */ }
    return null;
  }

  // Parse HTML and extract the best icon href from <link rel="icon|shortcut icon|apple-touch-icon">
  function extractIconHref(html: string, base: string): string | null {
    const rels = ["icon", "shortcut icon", "apple-touch-icon"];
    for (const rel of rels) {
      const pattern = new RegExp(
        `<link[^>]+rel=["']${rel}["'][^>]*href=["']([^"']+)["']|<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${rel}["']`,
        "i"
      );
      const match = html.match(pattern);
      const href = match?.[1] ?? match?.[2];
      if (href) {
        // Resolve relative URLs
        try { return new URL(href, base).toString(); } catch { /* skip */ }
      }
    }
    return null;
  }

  // Try fetching favicon directly from the server (required for local IPs)
  async function tryFetchDirect(): Promise<Buffer | null> {
    const base = `${parsed.protocol}//${parsed.host}`;

    // Step 1: Fetch HTML and look for <link rel="icon">
    try {
      const htmlRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (htmlRes.ok) {
        const ct = htmlRes.headers.get("content-type") ?? "";
        if (ct.includes("html")) {
          const html = await htmlRes.text();
          const iconUrl = extractIconHref(html, base);
          if (iconUrl) {
            const buf = await fetchImage(iconUrl);
            if (buf) return buf;
          }
        }
      }
    } catch { /* fall through to candidates */ }

    // Step 2: Fallback — try common paths
    for (const candidate of [`${base}/favicon.ico`, `${base}/favicon.png`, `${base}/favicon.svg`]) {
      const buf = await fetchImage(candidate);
      if (buf) return buf;
    }
    return null;
  }

  // Try Google favicon service (only works for public domains)
  async function tryGoogle(): Promise<Buffer | null> {
    try {
      const res = await fetch(
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch { /* ignore */ }
    return null;
  }

  try {
    const buffer = isLocal
      ? (await tryFetchDirect())
      : ((await tryGoogle()) ?? (await tryFetchDirect()));

    if (!buffer) {
      return NextResponse.json({ error: "Failed to fetch favicon" }, { status: 502 });
    }

    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_PATH, filename), buffer);

    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "Failed to cache favicon" }, { status: 502 });
  }
}
