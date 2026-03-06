"use client";

import { useState } from "react";
import { ServerOff } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { ServiceCard } from "./ServiceCard";
import { DashboardHeader } from "./DashboardHeader";
import { ServiceDialog } from "./ServiceDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SettingsDialog } from "./SettingsDialog";
import type { Service, ServiceFormData } from "@/types/service";

type Props = {
  initialServices: Service[];
  initialBg: string;
  initialBgOpacity: number;
  initialOpenInNewTab: boolean;
};

export function ServiceGrid({ initialServices, initialBg, initialBgOpacity, initialOpenInNewTab }: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bgUrl, setBgUrl] = useState(initialBg);
  const [bgOpacity, setBgOpacity] = useState(initialBgOpacity ?? 1);
  const [openInNewTab, setOpenInNewTab] = useState(initialOpenInNewTab);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleAdd = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleSave = async (data: ServiceFormData) => {
    if (editingService) {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated: Service = await res.json();
        setServices((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
      }
    } else {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: Service = await res.json();
        setServices((prev) => [...prev, created]);
      }
    }
    setDialogOpen(false);
    setEditingService(null);
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    const res = await fetch(`/api/services/${deletingService.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== deletingService.id));
    }
    setDeletingService(null);
  };

  const handleSaveSettings = async (url: string, opacity: number, newOpenInNewTab: boolean) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundImage: url, bgOpacity: opacity, openInNewTab: newOpenInNewTab ? 1 : 0 }),
    });
    if (res.ok) {
      setBgUrl(url);
      setBgOpacity(opacity);
      setOpenInNewTab(newOpenInNewTab);
    }
    setSettingsOpen(false);
  };

  const handleToggleHide = async (service: Service) => {
    const newHidden = service.hidden ? 0 : 1;
    const res = await fetch(`/api/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: service.name,
        url: service.url,
        icon: service.icon,
        color: service.color,
        hidden: newHidden,
        glassEffect: service.glassEffect,
      }),
    });
    if (res.ok) {
      const updated: Service = await res.json();
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(services, oldIndex, newIndex);

    // Optimistic update
    setServices(reordered);

    // Persist new order
    await fetch("/api/services/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        reordered.map((s, i) => ({ id: s.id, sortOrder: i }))
      ),
    });
  };

  return (
    <>
      {bgUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            backgroundImage: `url("${bgUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bgOpacity,
          }}
        />
      )}

      <DashboardHeader
        editMode={editMode}
        onToggleEditMode={() => setEditMode(!editMode)}
        onAddService={handleAdd}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <ServerOff size={48} className="mb-4 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">
            Noch keine Dienste
          </p>
          <p className="text-sm mt-1">
            Klicke auf &ldquo;Dienst hinzufügen&rdquo; um loszulegen.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={services.filter((s) => editMode || !s.hidden).map((s) => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {services.filter((s) => editMode || !s.hidden).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  editMode={editMode}
                  openInNewTab={openInNewTab}
                  onEdit={handleEdit}
                  onDelete={setDeletingService}
                  onToggleHide={handleToggleHide}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ServiceDialog
        open={dialogOpen}
        service={editingService}
        onSave={handleSave}
        onClose={() => {
          setDialogOpen(false);
          setEditingService(null);
        }}
      />

      <DeleteConfirmDialog
        open={!!deletingService}
        service={deletingService}
        onConfirm={handleDelete}
        onClose={() => setDeletingService(null)}
      />

      <SettingsDialog
        open={settingsOpen}
        currentBg={bgUrl}
        currentBgOpacity={bgOpacity}
        currentOpenInNewTab={openInNewTab}
        onSave={handleSaveSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
