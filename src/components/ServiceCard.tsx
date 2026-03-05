"use client";

import { getLucideIcon, getFaviconUrl } from "@/lib/icons";
import { Globe, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import type { Service } from "@/types/service";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  service: Service;
  editMode: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggleHide: (service: Service) => void;
};

function ServiceIcon({
  icon,
  url,
  color,
}: {
  icon: string;
  url: string;
  color: string;
}) {
  if (icon.startsWith("http") || icon.startsWith("/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        className="w-10 h-10 rounded"
        onError={(e) => {
          const fallback = getFaviconUrl(url);
          if (fallback) {
            (e.target as HTMLImageElement).src = fallback;
          }
        }}
      />
    );
  }

  const LucideIcon = getLucideIcon(icon);
  if (LucideIcon) {
    return <LucideIcon size={40} style={{ color }} />;
  }

  return <Globe size={40} style={{ color }} />;
}

export function ServiceCard({ service, editMode, onEdit, onDelete, onToggleHide }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : (service.hidden && editMode ? 0.4 : 1),
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <a
        href={service.url}
        target="_self"
        rel="noopener noreferrer"
        className={`flex flex-col items-center gap-3 rounded-xl p-6 border transition-all hover:scale-[1.03] hover:shadow-lg ${
          service.glassEffect
            ? "bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-black/30"
            : "bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700 hover:shadow-black/20"
        }`}
        style={{ borderTopColor: service.color, borderTopWidth: "3px" }}
      >
        <ServiceIcon
          icon={service.icon}
          url={service.url}
          color={service.color}
        />
        <span className="text-sm font-medium text-gray-200 text-center truncate w-full">
          {service.name}
        </span>
      </a>

      {editMode && (
        <>
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 p-1.5 rounded-lg bg-gray-800/90 text-gray-500 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical size={14} />
          </div>

          {/* Edit / Hide / Delete */}
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(service);
              }}
              className="p-1.5 rounded-lg bg-gray-800/90 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleHide(service);
              }}
              title={service.hidden ? "Einblenden" : "Ausblenden"}
              className="p-1.5 rounded-lg bg-gray-800/90 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {service.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(service);
              }}
              className="p-1.5 rounded-lg bg-gray-800/90 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
