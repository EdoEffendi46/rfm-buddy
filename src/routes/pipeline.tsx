import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { AppShell } from "@/components/layout/AppShell";
import { useCustomers } from "@/hooks/useCustomers";
import { useStore } from "@/lib/store";
import { SEGMENT_META } from "@/lib/rfm";
import { formatRupiah, relativeTime } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { SegmentBadge } from "@/components/SegmentBadge";
import { toast } from "sonner";
import type { Customer, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — ChatCRM" }] }),
  component: PipelinePage,
});

const COLUMNS: { id: OrderStatus; label: string; color: string }[] = [
  { id: "order_masuk", label: "Order Masuk", color: "#64748B" },
  { id: "konfirmasi", label: "Konfirmasi", color: "#8B5CF6" },
  { id: "dalam_proses", label: "Dalam Proses", color: "#F59E0B" },
  { id: "siap_diambil", label: "Siap Diambil", color: "#3B82F6" },
  { id: "selesai", label: "Selesai", color: "#22C55E" },
];

function PipelinePage() {
  const { enriched } = useCustomers();
  const { setOrderStatus } = useStore();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const columns = useMemo(() => {
    const map: Record<OrderStatus, typeof enriched> = {
      order_masuk: [],
      konfirmasi: [],
      dalam_proses: [],
      siap_diambil: [],
      selesai: [],
    };
    enriched.forEach((e) => {
      const s = (e.customer.orderStatus as OrderStatus) ?? "order_masuk";
      (map[s] ?? map.order_masuk).push(e);
    });
    return map;
  }, [enriched]);

  const activeCustomer = activeId
    ? enriched.find((e) => e.customer.id === activeId)?.customer
    : null;

  const handleDragEnd = (ev: DragEndEvent) => {
    setActiveId(null);
    const overId = ev.over?.id as OrderStatus | undefined;
    const custId = ev.active.id as string;
    if (!overId) return;
    const cust = enriched.find((e) => e.customer.id === custId)?.customer;
    if (!cust || cust.orderStatus === overId) return;
    setOrderStatus(custId, overId);
    const col = COLUMNS.find((c) => c.id === overId);
    toast.success(`${cust.name} → ${col?.label}`);
  };

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline Order</h1>
          <p className="text-sm text-slate-500">
            Drag kartu customer antar kolom untuk memperbarui status order.
          </p>
        </div>
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                items={columns[col.id]}
                onCardClick={(id) =>
                  navigate({ to: "/chat/$customerId", params: { customerId: id } })
                }
              />
            ))}
          </div>
          <DragOverlay>
            {activeCustomer ? (
              <div className="kanban-card-dragging w-[260px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <div className="text-sm font-semibold">{activeCustomer.name}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppShell>
  );
}

function Column({
  id,
  label,
  color,
  items,
  onCardClick,
}: {
  id: OrderStatus;
  label: string;
  color: string;
  items: ReturnType<typeof useCustomers>["enriched"];
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const total = items.reduce((s, e) => s + e.rfm.monetary, 0);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50/60 transition-all",
        isOver && "kanban-column-drop-target",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold">{label}</span>
          <span className="rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600">
            {items.length}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">{formatRupiah(total)}</span>
      </div>
      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-2">
        {items.map((e) => (
          <Card key={e.customer.id} customer={e.customer} segment={e.rfm.segment} onClick={onCardClick} />
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
            Tidak ada order
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  customer,
  segment,
  onClick,
}: {
  customer: Customer;
  segment: import("@/types").RFMSegment;
  onClick: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: customer.id });
  const lastP = customer.purchases.length
    ? customer.purchases.reduce((a, b) => (a.date > b.date ? a : b))
    : null;
  const changed = customer.orderStatusChangedAt;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (isDragging) return;
        if ((e.target as HTMLElement).closest("button")) return;
        onClick(customer.id);
      }}
      className={cn(
        "cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <div className="flex items-start gap-2">
        <Avatar name={customer.name} size={28} color={SEGMENT_META[segment].color} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{customer.name}</div>
          <div className="mt-0.5">
            <SegmentBadge segment={segment} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{lastP ? formatRupiah(lastP.price) : "—"}</span>
        {changed && <span>{relativeTime(changed)}</span>}
      </div>
    </div>
  );
}