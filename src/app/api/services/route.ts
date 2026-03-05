import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { services } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const allServices = db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder))
    .all();
  return NextResponse.json(allServices);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.url) {
    return NextResponse.json(
      { error: "Name and URL are required" },
      { status: 400 }
    );
  }

  const maxOrder = db
    .select({ sortOrder: services.sortOrder })
    .from(services)
    .orderBy(asc(services.sortOrder))
    .all();
  const nextOrder =
    maxOrder.length > 0
      ? Math.max(...maxOrder.map((s) => s.sortOrder)) + 1
      : 0;

  const result = db
    .insert(services)
    .values({
      name: body.name,
      url: body.url,
      icon: body.icon || "Globe",
      color: body.color || "#3b82f6",
      sortOrder: nextOrder,
      glassEffect: body.glassEffect === false ? 0 : 1,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
