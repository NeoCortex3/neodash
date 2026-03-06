import { db } from "@/lib/db";
import { services, settings } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";
import { ServiceGrid } from "@/components/ServiceGrid";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const allServices = db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder))
    .all();

  let settingsRow = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!settingsRow) {
    db.insert(settings).values({ id: 1, backgroundImage: "", bgOpacity: 1, openInNewTab: 0 }).run();
    settingsRow = { id: 1, backgroundImage: "", bgOpacity: 1, openInNewTab: 0 };
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ServiceGrid
          initialServices={allServices}
          initialBg={settingsRow.backgroundImage}
          initialBgOpacity={settingsRow.bgOpacity ?? 1}
          initialOpenInNewTab={Boolean(settingsRow.openInNewTab)}
        />
      </div>
    </main>
  );
}
