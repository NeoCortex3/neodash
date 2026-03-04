import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_PATH =
  process.env.UPLOADS_PATH ?? path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  let imageUrl: string;
  try {
    const body = await request.json();
    imageUrl = body.url;
    new URL(imageUrl); // validate
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Already a local path — return as-is
  if (!imageUrl.startsWith("http")) {
    return NextResponse.json({ url: imageUrl });
  }

  // Derive a stable filename from the URL
  const hash = crypto.createHash("md5").update(imageUrl).digest("hex").slice(0, 10);
  const ext = imageUrl.split("?")[0].split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "png";
  const filename = `icon-${hash}.${ext}`;
  const filePath = path.join(UPLOADS_PATH, filename);

  // Serve from cache if already downloaded
  if (fs.existsSync(filePath)) {
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  }

  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: 502 });

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "Failed to cache image" }, { status: 502 });
  }
}
