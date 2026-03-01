import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { services } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .update(services)
    .set({
      name: body.name,
      url: body.url,
      icon: body.icon,
      color: body.color,
      ...(body.hidden !== undefined && { hidden: body.hidden }),
    })
    .where(eq(services.id, parseInt(id)))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = db
    .delete(services)
    .where(eq(services.id, parseInt(id)))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
