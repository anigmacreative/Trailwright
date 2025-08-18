"use client";
import { useMemo } from "react";
import { useDroppable, DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DayPlan, Stop } from "@/types/itinerary";

function StopRow({
  stop,
  onRemove,
  onEditNote,
  onEditCost,
  id,
}: {
  stop: Stop;
  id: string;
  onRemove: (id: string) => void;
  onEditNote: (id: string, v: string) => void;
  onEditCost: (id: string, v: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-[#E5DFD0] bg-[#FEFCF8] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span {...attributes} {...listeners} className="cursor-grab select-none text-[#6B5F53]">⋮⋮</span>
          <div>
            <div className="text-[#2F2B25] text-sm font-medium">{stop.title || "Untitled"}</div>
            <div className="text-[#8A7F73] text-xs">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</div>
          </div>
        </div>
        <button onClick={() => onRemove(stop.id)} className="text-[#C85C5C] hover:text-[#A04949] text-sm">Remove</button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <textarea
          className="col-span-1 rounded-lg bg-white border border-[#E5DFD0] p-2 text-[#2F2B25] text-xs placeholder-[#8A7F73]"
          placeholder="Notes…"
          defaultValue={stop.note || ""}
          onBlur={(e) => onEditNote(stop.id, e.currentTarget.value)}
        />
        <input
          className="col-span-1 rounded-lg bg-white border border-[#E5DFD0] p-2 text-[#2F2B25] text-xs placeholder-[#8A7F73]"
          placeholder="$ Cost"
          type="number"
          defaultValue={stop.cost ?? ""}
          onBlur={(e) => onEditCost(stop.id, Number(e.currentTarget.value || 0))}
        />
      </div>
    </div>
  );
}

export default function ItineraryPanel({
  day,
  onRemoveStop,
  onReorderStops,
  onOptimize,
  onEditNote,
  onEditCost,
  activeDayCost,
  dayIndex,
  distanceText,
  durationText,
}: {
  day: DayPlan;
  onRemoveStop: (id: string) => void;
  onReorderStops: (from: number, to: number) => void;
  onOptimize: () => void;
  onEditNote: (id: string, note: string) => void;
  onEditCost: (id: string, cost: number) => void;
  activeDayCost: number;
  dayIndex: number;
  distanceText?: string;
  durationText?: string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = day.stops.map((s) => s.id);

  return (
    <aside className="w-[360px] shrink-0 border-r border-[#E5DFD0] bg-white p-4 space-y-3">
      <div className="text-[#2F2B25] text-sm font-medium">Day {dayIndex + 1}</div>

      <div className="flex items-center justify-between">
        <div className="text-[#6B5F53] text-xs">
          {distanceText ? `${distanceText}` : "—"} • {durationText ? `${durationText}` : "—"}
        </div>
        <button onClick={onOptimize} className="rounded-lg border border-[#E5DFD0] px-2 py-1 text-xs text-[#2F2B25] hover:bg-[#F5F1E8]">
          Optimize day
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const from = ids.indexOf(active.id as string);
          const to = ids.indexOf(over.id as string);
          if (from !== -1 && to !== -1) onReorderStops(from, to);
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {day.stops.map((s) => (
              <StopRow
                key={s.id}
                id={s.id}
                stop={s}
                onRemove={onRemoveStop}
                onEditNote={onEditNote}
                onEditCost={onEditCost}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="pt-2 border-t border-[#E5DFD0] text-xs text-[#6B5F53]">
        Day budget: <span className="text-[#2F2B25] font-medium">${activeDayCost.toFixed(0)}</span>
      </div>
    </aside>
  );
}