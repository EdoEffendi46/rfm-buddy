import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useStore } from "@/lib/store";
import { hasPermission, shareBadgeFor, canEditCustomer, hasFlag } from "@/lib/permissions";
import { getFieldDisplay } from "@/lib/fieldVisibility";
import { SEGMENT_META } from "@/lib/rfm";
import { CADENCE_LABEL_TEXT } from "@/lib/cadence";
import { formatDate, formatRupiah } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { SegmentBadge } from "@/components/SegmentBadge";
import { SegmentIcon } from "@/components/SegmentIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Table as TableIcon,
  LayoutGrid,
  MessageSquare,
  Eye,
  Plus,
  X,
  CalendarClock,
  Users,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  customerCreateSchema,
  parseCustomerCreateTags,
  type CustomerCreateInput,
} from "@/lib/schemas/customer";
import type { RFMSegment, Customer, Agent, ManualShare } from "@/types";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customer — ChatCRM" }] }),
  component: CustomersPage,
});

const SEGMENT_FILTERS: { id: "all" | RFMSegment; label: string }[] = [
  { id: "all", label: "Semua" },
  ...(["champions", "loyal", "promising", "at_risk", "new", "dormant"] as RFMSegment[]).map(
    (id) => ({ id, label: SEGMENT_META[id].label }),
  ),
];

type SortKey = "recency" | "monetary" | "rfm" | "clv" | "name" | "cadence_overdue";

function CustomersPage() {
  const { role, agent } = useAuth();
  const { enriched, agents, addCustomer } = useCustomers();
  const { createManualShare, revokeManualShare, logAudit, fieldRules, googleContacts, markCustomerGoogleSynced } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"all" | RFMSegment>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recency");
  const [view, setView] = useState<"table" | "card">("table");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...enriched];
    if (segment !== "all") list = list.filter((e) => e.rfm.segment === segment);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) => e.customer.name.toLowerCase().includes(q) || e.customer.phone.includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "recency":
          return a.rfm.recencyDays - b.rfm.recencyDays;
        case "monetary":
          return b.rfm.monetary - a.rfm.monetary;
        case "rfm":
          return b.rfm.total - a.rfm.total;
        case "clv":
          return b.clv.clv12months - a.clv.clv12months;
        case "name":
          return a.customer.name.localeCompare(b.customer.name);
        case "cadence_overdue": {
          const av = a.cadence.daysUntilPredicted ?? 99999;
          const bv = b.cadence.daysUntilPredicted ?? 99999;
          return av - bv; // most overdue (most negative) first
        }
      }
    });
    return list;
  }, [enriched, segment, query, sortKey]);

  const segmentCounts = enriched.reduce<Record<string, number>>(
    (acc, e) => ((acc[e.rfm.segment] = (acc[e.rfm.segment] ?? 0) + 1), acc),
    { all: enriched.length },
  );

  const detail = detailId ? enriched.find((e) => e.customer.id === detailId) : null;

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer</h1>
            <p className="text-sm text-slate-500">{enriched.length} total customer</p>
          </div>
          {hasFlag(agent, "customer_create") && (
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-[#16A34A] text-white hover:bg-[#15803D]"
            >
              <Plus className="h-4 w-4" /> Customer Baru
            </Button>
          )}
        </div>

        {/* filter bar */}
        <div className="mt-6 rounded-xl border border-[var(--border-soft)] bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, no HP..."
                className="pl-9"
              />
            </div>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recency">Terakhir Order</SelectItem>
                <SelectItem value="monetary">Total Pembelian</SelectItem>
                <SelectItem value="rfm">RFM Score</SelectItem>
                <SelectItem value="clv">CLV</SelectItem>
                <SelectItem value="cadence_overdue">Paling Overdue (Siklus)</SelectItem>
                <SelectItem value="name">Nama</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-md border">
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center",
                  view === "table" ? "bg-slate-100" : "",
                )}
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("card")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center border-l",
                  view === "card" ? "bg-slate-100" : "",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="scrollbar-thin mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {SEGMENT_FILTERS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSegment(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
                  segment === s.id
                    ? "border-slate-400 bg-slate-100"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                {s.id === "all" ? (
                  <Users className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
                ) : (
                  <SegmentIcon segment={s.id} />
                )}
                {s.label}
                <span className="opacity-60">{segmentCounts[s.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {view === "table" ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">No HP</th>
                    <th className="px-3 py-2 text-left">Segment</th>
                    <th className="px-3 py-2 text-left">RFM</th>
                    <th className="px-3 py-2 text-left">Siklus</th>
                    <th className="px-3 py-2 text-left">Prediksi Order</th>
                    <th className="px-3 py-2 text-right">CLV Est.</th>
                    <th className="px-3 py-2 text-right">Pembelian</th>
                    <th className="px-3 py-2 text-left">Terakhir</th>
                    <th className="px-3 py-2 text-left">CS</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => {
                    const ag = agents.find((a) => a.id === e.customer.assignedAgentId);
                    const share = shareBadgeFor(agent, e.customer);
                    const sharedBy = share
                      ? agents.find((a) => a.id === share.sharedByAgentId)
                      : null;
                    const lastP = e.customer.purchases.length
                      ? e.customer.purchases.reduce((a, b) => (a.date > b.date ? a : b))
                      : null;
                    const cad = e.cadence;
                    const days = cad.daysUntilPredicted;
                    const predCls =
                      days === null
                        ? "text-slate-400"
                        : days < 0
                          ? "text-red-600 font-semibold"
                          : days <= 3
                            ? "text-amber-600 font-semibold"
                            : "text-slate-600";
                    return (
                      <tr
                        key={e.customer.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={e.customer.name}
                              color={SEGMENT_META[e.rfm.segment].color}
                              size={28}
                            />
                            <span className="font-medium">{e.customer.name}</span>
                            {share && (
                              <span
                                className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700"
                                title={`Dibagikan oleh ${sharedBy?.name ?? ""}`}
                              >
                                Dibagikan · {sharedBy?.name ?? "-"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {getFieldDisplay("phone", e.customer.phone, role, fieldRules)}
                        </td>
                        <td className="px-3 py-2">
                          <SegmentBadge segment={e.rfm.segment} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${(e.rfm.total / 15) * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs">{e.rfm.total}/15</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <div className="inline-flex flex-col">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {CADENCE_LABEL_TEXT[cad.label]}
                            </span>
                            <span className="mt-0.5 font-mono text-[10px] text-slate-400">
                              {cad.avgDaysBetweenOrders ? `~${cad.avgDaysBetweenOrders}d` : "—"}
                            </span>
                          </div>
                        </td>
                        <td className={cn("px-3 py-2 text-xs font-mono", predCls)}>
                          {cad.predictedNextOrderDate ? (
                            <>
                              {formatDate(cad.predictedNextOrderDate)}
                              {days !== null && days < 0 && (
                                <div className="text-[10px]">Overdue {Math.abs(days)}d</div>
                              )}
                              {days !== null && days >= 0 && days <= 3 && (
                                <div className="text-[10px]">Due {days}d</div>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {formatRupiah(e.clv.clv12months)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {e.rfm.frequency}x
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {lastP ? formatDate(lastP.date) : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {ag ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: ag.color }}
                              />
                              {ag.name}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              navigate({
                                to: "/chat/$customerId",
                                params: { customerId: e.customer.id },
                              })
                            }
                          >
                            <MessageSquare className="h-3 w-3" /> Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDetailId(e.customer.id)}
                          >
                            <Eye className="h-3 w-3" /> Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  Tidak ada customer cocok dengan filter.
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((e) => {
                const ag = agents.find((a) => a.id === e.customer.assignedAgentId);
                const lastP = e.customer.purchases.length
                  ? e.customer.purchases.reduce((a, b) => (a.date > b.date ? a : b))
                  : null;
                return (
                  <div
                    key={e.customer.id}
                    className="rounded-xl border border-[var(--border-soft)] bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={e.customer.name}
                          color={SEGMENT_META[e.rfm.segment].color}
                          size={44}
                          ringColor={SEGMENT_META[e.rfm.segment].color}
                        />
                        <div>
                          <div className="font-semibold">{e.customer.name}</div>
                          <div className="font-mono text-xs text-slate-500">
                            {getFieldDisplay("phone", e.customer.phone, role, fieldRules)}
                          </div>
                        </div>
                      </div>
                      <SegmentBadge segment={e.rfm.segment} />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(e.rfm.total / 15) * 100}%`,
                            backgroundColor: SEGMENT_META[e.rfm.segment].color,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs">{e.rfm.total}/15</span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-600">
                      <span>{e.rfm.frequency}x</span>
                      <span>{formatRupiah(e.rfm.monetary)}</span>
                      <span>{lastP ? formatDate(lastP.date) : "-"}</span>
                    </div>
                    <div className="mt-2 rounded-full bg-emerald-50 px-2 py-0.5 text-center text-[11px] text-emerald-700">
                      CLV est. {formatRupiah(e.clv.clv12months)}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{ag?.name ?? "-"}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDetailId(e.customer.id)}
                        >
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 bg-[#16A34A] px-2 text-xs text-white hover:bg-[#15803D]"
                          onClick={() =>
                            navigate({
                              to: "/chat/$customerId",
                              params: { customerId: e.customer.id },
                            })
                          }
                        >
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <CustomerDetailModal
          enriched={detail}
          role={role}
          open={!!detailId}
          onClose={() => setDetailId(null)}
          onOpenChat={(id) => {
            setDetailId(null);
            navigate({ to: "/chat/$customerId", params: { customerId: id } });
          }}
          agents={agents}
          agent={agent}
          fieldRules={fieldRules}
          currentAgentId={agent?.id ?? ""}
          onShare={(input) => {
            createManualShare(input);
            toast.success("Akses dibagikan");
          }}
          onRevoke={(customerId, shareId) => {
            revokeManualShare(customerId, shareId);
            toast.success("Akses dicabut");
          }}
          onPhoneViewed={(c) => {
            if (hasPermission(role, "view_all_customers")) {
              logAudit({
                action: "phone_viewed_full",
                targetType: "customer",
                targetId: c.id,
                targetLabel: c.name,
                details: "Membuka detail customer (no HP penuh terlihat)",
              });
            }
          }}
        />
      )}

      <AddCustomerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        agents={agents}
        onAdd={(d) => {
          const c = addCustomer({
            name: d.name,
            phone: d.phone,
            joinDate: new Date().toISOString(),
            assignedAgentId: d.agentId,
            tags: d.tags,
            notes: d.notes,
            orderStatus: "dalam_proses",
            conversationStatus: "open",
            priority: "normal",
          });
          toast.success(`Customer ${c.name} berhasil ditambahkan`);
          setAddOpen(false);
        }}
      />
    </AppShell>
  );
}

function CustomerDetailModal({
  enriched,
  role,
  open,
  onClose,
  onOpenChat,
  agents,
  agent,
  fieldRules,
  currentAgentId,
  onShare,
  onRevoke,
  onPhoneViewed,
}: {
  enriched: ReturnType<typeof useCustomers>["enriched"][number];
  role: import("@/types").Role;
  open: boolean;
  onClose: () => void;
  onOpenChat: (id: string) => void;
  agents: Agent[];
  agent: Agent | null;
  fieldRules: import("@/types").FieldVisibilityRule[];
  currentAgentId: string;
  onShare: (input: Omit<ManualShare, "id" | "createdAt" | "sharedByAgentId">) => void;
  onRevoke: (customerId: string, shareId: string) => void;
  onPhoneViewed: (c: Customer) => void;
}) {
  const { customer, rfm, clv } = enriched;
  const cad = enriched.cadence;
  const { saveNotes } = useCustomers();
  const [notes, setNotes] = useState(customer.notes);
  const canEdit = canEditCustomer(agent, customer);
  const meta = SEGMENT_META[rfm.segment];
  const lastP = customer.purchases.length
    ? customer.purchases.reduce((a, b) => (a.date > b.date ? a : b))
    : null;
  const avg = customer.purchases.length ? rfm.monetary / customer.purchases.length : 0;
  const canShare = role === "supervisor" || role === "owner";
  useEffect(() => {
    if (open) onPhoneViewed(customer);
    // eslint-disable-next-line
  }, [open, customer.id]);

  // Share form state
  const csAgents = agents.filter((a) => a.role === "cs" && a.id !== customer.assignedAgentId);
  const [shareAgentId, setShareAgentId] = useState(csAgents[0]?.id ?? "");
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view");
  const [shareReason, setShareReason] = useState("");
  const [shareDuration, setShareDuration] = useState<"permanent" | "24h" | "7d">("7d");
  const activeShares = (customer.manualShares ?? []).filter(
    (s) => !s.expiresAt || new Date(s.expiresAt).getTime() > Date.now(),
  );
  const primaryAg = agents.find((a) => a.id === customer.assignedAgentId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Customer</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="purchases">Riwayat Pembelian</TabsTrigger>
            <TabsTrigger value="segments">Riwayat Segment</TabsTrigger>
            <TabsTrigger value="notes">Catatan</TabsTrigger>
            {canShare && <TabsTrigger value="access">Akses & Berbagi</TabsTrigger>}
          </TabsList>
          <TabsContent value="profile" className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={customer.name} color={meta.color} size={56} ringColor={meta.color} />
              <div>
                <div className="text-lg font-semibold">{customer.name}</div>
                <div className="font-mono text-xs text-slate-500">
                  {getFieldDisplay("phone", customer.phone, role, fieldRules)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Bergabung {formatDate(customer.joinDate)}
                </div>
              </div>
              <div className="ml-auto">
                <SegmentBadge segment={rfm.segment} size="md" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <ScoreCard
                label="Recency"
                score={rfm.r}
                desc={`Terakhir beli ${rfm.recencyDays} hari lalu`}
              />
              <ScoreCard label="Frequency" score={rfm.f} desc={`${rfm.frequency} transaksi`} />
              <ScoreCard label="Monetary" score={rfm.m} desc={formatRupiah(rfm.monetary)} />
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="font-semibold">CLV</div>
              <div>
                Total Spent: <span className="font-semibold">{formatRupiah(clv.totalSpent)}</span>
              </div>
              <div className="text-xs text-slate-500">
                Estimasi 12 bln: {formatRupiah(clv.clv12months)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CalendarClock className="h-4 w-4 text-emerald-600" /> Siklus Pembelian
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {CADENCE_LABEL_TEXT[cad.label]} · Konsistensi{" "}
                  {cad.confidence === "high"
                    ? "Tinggi"
                    : cad.confidence === "medium"
                      ? "Sedang"
                      : "Rendah"}
                </span>
              </div>
              {cad.avgDaysBetweenOrders ? (
                <div className="mt-1 text-xs text-slate-600">
                  Rata-rata tiap{" "}
                  <span className="font-semibold">{cad.avgDaysBetweenOrders} hari</span>
                  {cad.isManualOverride && (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                      Manual: {cad.manualOverrideDays}d
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-400 italic">Belum cukup data</div>
              )}
              {cad.predictedNextOrderDate && (
                <div
                  className={cn(
                    "mt-1 text-xs",
                    cad.daysUntilPredicted! < 0
                      ? "text-red-700 font-semibold"
                      : cad.daysUntilPredicted! <= 3
                        ? "text-amber-700 font-semibold"
                        : "text-slate-600",
                  )}
                >
                  Prediksi order berikutnya: {formatDate(cad.predictedNextOrderDate)}
                  {cad.daysUntilPredicted! < 0 &&
                    ` · Overdue ${Math.abs(cad.daysUntilPredicted!)} hari`}
                  {cad.daysUntilPredicted! >= 0 &&
                    cad.daysUntilPredicted! <= 3 &&
                    ` · Due ${cad.daysUntilPredicted} hari`}
                </div>
              )}
              {cad.gaps.length > 0 && (
                <div className="mt-2 text-[11px] text-slate-500">
                  Pola gap:{" "}
                  {cad.gaps.map((g, i) => (
                    <span key={i}>
                      <span className="font-mono">{`Order ${i + 1}→${i + 2}: ${g} hari`}</span>
                      {i < cad.gaps.length - 1 && <span className="mx-1 text-slate-300">·</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600">{meta.description}</p>
          </TabsContent>
          <TabsContent value="purchases">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="text-left">No</th>
                  <th className="text-left">No. Pesanan</th>
                  <th className="text-left">Layanan</th>
                  <th className="text-left">Tanggal</th>
                  <th className="text-left">Jenis</th>
                  <th className="text-left">Bayar</th>
                  <th className="text-right">Harga</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {customer.purchases.map((p, i) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-400">{i + 1}</td>
                    <td className="font-mono text-[11px]">{p.orderNumber ?? "-"}</td>
                    <td>{p.serviceName}</td>
                    <td className="font-mono text-xs">{formatDate(p.date)}</td>
                    <td className="text-xs">
                      {p.transactionType === "penjualan_langsung"
                        ? "Langsung"
                        : p.transactionType === "reservasi"
                          ? "Reservasi"
                          : p.transactionType === "pesanan_proses"
                            ? "Pesanan"
                            : "-"}
                    </td>
                    <td className="text-xs">{p.paymentMethod ?? "-"}</td>
                    <td className="text-right font-mono text-xs">{formatRupiah(p.price)}</td>
                    <td className="text-xs text-slate-500">{p.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-slate-500">
              {customer.purchases.length} transaksi · Total {formatRupiah(rfm.monetary)} · Rata-rata{" "}
              {formatRupiah(avg)}
            </div>
          </TabsContent>
          <TabsContent value="segments">
            <div className="space-y-2 border-l-2 border-slate-200 pl-4">
              {customer.segmentHistory.map((h, i) => (
                <div key={i} className="text-sm">
                  <div className="font-mono text-xs text-slate-400">{formatDate(h.date)}</div>
                  <div>
                    {h.fromSegment ? `${SEGMENT_META[h.fromSegment].label} → ` : "→ "}
                    <span
                      style={{ color: SEGMENT_META[h.toSegment].color }}
                      className="font-semibold"
                    >
                      {SEGMENT_META[h.toSegment].label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{h.reason}</div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              readOnly={!canEdit}
              className={!canEdit ? "bg-slate-50 text-slate-600" : undefined}
            />
            {!canEdit && (
              <p className="mt-1 text-xs text-slate-500">
                Akses lihat saja — catatan tidak bisa diedit.
              </p>
            )}
            <Button
              className="mt-2"
              disabled={!canEdit}
              onClick={() => {
                saveNotes(customer.id, notes);
                toast.success("Catatan disimpan");
              }}
            >
              Simpan Catatan
            </Button>
          </TabsContent>
          {canShare && (
            <TabsContent value="access" className="space-y-3">
              <div className="rounded-xl border p-3 text-sm">
                <div className="text-xs uppercase text-slate-500">Primary CS</div>
                <div className="font-semibold">{primaryAg?.name ?? "Belum ditugaskan"}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="mb-2 text-sm font-semibold">Bagikan ke CS lain</div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={shareAgentId} onValueChange={setShareAgentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih CS" />
                    </SelectTrigger>
                    <SelectContent>
                      {csAgents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={sharePermission}
                    onValueChange={(v) => setSharePermission(v as "view" | "edit")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Lihat saja</SelectItem>
                      <SelectItem value="edit">Bisa edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={shareDuration}
                    onValueChange={(v) => setShareDuration(v as "permanent" | "24h" | "7d")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 jam</SelectItem>
                      <SelectItem value="7d">7 hari</SelectItem>
                      <SelectItem value="permanent">Permanen</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={shareReason}
                    onChange={(e) => setShareReason(e.target.value)}
                    placeholder="Alasan (contoh: backup saat cuti)"
                  />
                </div>
                <Button
                  className="mt-2 bg-[#16A34A] text-white hover:bg-[#15803D]"
                  disabled={!shareAgentId || !shareReason.trim()}
                  onClick={() => {
                    const expiresAt =
                      shareDuration === "permanent"
                        ? undefined
                        : shareDuration === "24h"
                          ? new Date(Date.now() + 24 * 3600 * 1000).toISOString()
                          : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
                    onShare({
                      customerId: customer.id,
                      sharedWithAgentId: shareAgentId,
                      permission: sharePermission,
                      reason: shareReason.trim(),
                      expiresAt,
                    });
                    setShareReason("");
                  }}
                >
                  Bagikan Akses
                </Button>
              </div>
              <div className="rounded-xl border p-3">
                <div className="mb-2 text-sm font-semibold">
                  Akses aktif ({activeShares.length})
                </div>
                {activeShares.length === 0 ? (
                  <div className="text-xs text-slate-500">Belum ada akses manual yang aktif.</div>
                ) : (
                  <ul className="space-y-2">
                    {activeShares.map((s) => {
                      const a = agents.find((x) => x.id === s.sharedWithAgentId);
                      const by = agents.find((x) => x.id === s.sharedByAgentId);
                      return (
                        <li
                          key={s.id}
                          className="flex items-center justify-between rounded border bg-slate-50 p-2 text-xs"
                        >
                          <div>
                            <div className="font-semibold">
                              {a?.name ?? "—"} ·{" "}
                              <span className="text-slate-500">
                                {s.permission === "edit" ? "Bisa edit" : "Lihat saja"}
                              </span>
                            </div>
                            <div className="text-slate-500">
                              {s.reason} · oleh {by?.name ?? "—"} ·{" "}
                              {s.expiresAt ? `expires ${formatDate(s.expiresAt)}` : "permanen"}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRevoke(customer.id, s.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
        <DialogFooter>
          <Button
            onClick={() => onOpenChat(customer.id)}
            className="bg-[#16A34A] text-white hover:bg-[#15803D]"
          >
            Buka Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScoreCard({ label, score, desc }: { label: string; score: number; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className="text-lg font-bold">{score}/5</div>
      <div className="text-[11px] text-slate-500">{desc}</div>
    </div>
  );
}

function AddCustomerModal({
  open,
  onClose,
  agents,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  agents: ReturnType<typeof useCustomers>["agents"];
  onAdd: (d: {
    name: string;
    phone: string;
    agentId: string;
    tags: string[];
    notes: string;
  }) => void;
}) {
  const defaultAgentId = agents.find((a) => a.role === "cs")?.id ?? agents[0]?.id ?? "";

  const form = useForm<CustomerCreateInput>({
    resolver: zodResolver(customerCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      agentId: defaultAgentId,
      tagsInput: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        phone: "",
        agentId: agents.find((a) => a.role === "cs")?.id ?? agents[0]?.id ?? "",
        tagsInput: "",
        notes: "",
      });
    }
  }, [open, agents, form]);

  const onSubmit = (values: CustomerCreateInput) => {
    onAdd({
      name: values.name.trim(),
      phone: values.phone.trim(),
      agentId: values.agentId,
      tags: parseCustomerCreateTags(values.tagsInput),
      notes: values.notes?.trim() ?? "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Customer Baru</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Nama *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">No HP *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0812..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Pilih CS *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agents
                        .filter((a) => a.role === "cs")
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Tags (pisahkan koma)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="VIP, Langganan" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Catatan</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid}
                className="bg-[#16A34A] text-white hover:bg-[#15803D]"
              >
                Tambah
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
