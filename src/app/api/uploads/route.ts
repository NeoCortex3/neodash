import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOADS_PATH =
  process.env.UPLOADS_PATH ?? path.join(process.cwd(), "public", "uploads");

export async function GET() {
  try {
    if (!fs.existsSync(UPLOADS_PATH)) {
      return NextResponse.json([]);
    }
    const files = fs.readdirSync(UPLOADS_PATH).filter((f) =>
      (f.startsWith("favicon-") || f.startsWith("icon-")) &&
      /\.(png|jpg|jpeg|webp|svg|ico)$/i.test(f)
    );
    const result = files.map((f) => ({
      filename: f,
      url: `/api/uploads/${f}`,
      label: f.replace(/^(favicon-|icon-)/, "").replace(/\.[^.]+$/, ""),
    }));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
