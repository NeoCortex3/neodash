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

  const domain = new URL(url).hostname;
  const sanitized = domain.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `favicon-${sanitized}.png`;

  try {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    const res = await fetch(faviconUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch favicon" }, { status: 502 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_PATH, filename), buffer);

    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "Failed to cache favicon" }, { status: 502 });
  }
}
