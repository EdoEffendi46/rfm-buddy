import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useCustomers } from "@/hooks/useCustomers";
import { calculateRFM, SEGMENT_META } from "@/lib/rfm";
import { calculateCLV } from "@/lib/clv";
import { cadenceFor, CADENCE_LABEL_TEXT, type CadenceResult } from "@/lib/cadence";
import { maskPhone } from "@/lib/mask";
import { formatTime, formatRupiah, formatDate, relativeDay, relativeTime, minutesBetween } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { SegmentBadge } from "@/components/SegmentBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Send, Zap, Tag as TagIcon, Paperclip, MoreVertical, Clock,
  CheckCheck, Check as CheckIcon, AlertTriangle, Crown, X, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Customer, ConversationStatus, OrderStatus, Priority, RFMSegment } from "@/types";

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "mine", label: "Mine" },
  { id: "unassigned", label: "Unassigned" },
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "snoozed", label: "Snoozed" },
];

const SEGMENT_TABS: { id: "all" | RFMSegment; label: string }[] = [
  { id: "all", label: "All" },
  { id: "champions", label: "Champions 👑" },
  { id: "loyal", label: "Loyal 🔥" },
  { id: "promising", label: "Promising 🌱" },
  { id: "at_risk", label: "At Risk ⚠️" },
  { id: "new", label: "New 🆕" },
  { id: "dormant", label: "Dormant 😴" },
];

function orderStatusLabel(s: OrderStatus) {
  return s === "dalam_proses" ? "Dalam Proses" : s === "siap_diambil" ? "Siap Diambil" : "Selesai";
}

export function ChatPage({ initialCustomerId }: { initialCustomerId?: string }) {
  const { agent, role } = useAuth();
  const store = useConversations();
  const { customers, enriched, templates, tags, agents } = useCustomers();

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [segmentTab, setSegmentTab] = useState<"all" | RFMSegment>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialCustomerId ?? null);
  const [inputMode, setInputMode] = useState<"text" | "internal_note">("text");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => {
    if (initialCustomerId) setSelectedId(initialCustomerId);
  }, [initialCustomerId]);

  // mark read on select
  useEffect(() => {
    if (selectedId) store.markRead(selectedId);
  }, [selectedId]); // eslint-disable-line

  // typing indicator demo
  useEffect(() => {
    if (!selectedId) return;
    const conv = store.conversations.find((c) => c.customer.id === selectedId);
    if (!conv?.lastMessage) return;
    if (conv.lastMessage.senderId === selectedId) {
      setTyping(true);
      const t = setTimeout(() => setTyping(false), 3000);
      return () => clearTimeout(t);
    }
    setTyping(false);
  }, [selectedId, store.conversations]);

  const conversations = useMemo(() => {
    let list = store.conversations;
    // role visibility
    if (role === "cs") list = list.filter((c) => c.customer.assignedAgentId === agent?.id);
    // status tab
    if (statusTab === "mine") list = list.filter((c) => c.customer.assignedAgentId === agent?.id);
    if (statusTab === "unassigned") list = list.filter((c) => !c.customer.assignedAgentId);
    if (statusTab === "open") list = list.filter((c) => c.customer.conversationStatus === "open");
    if (statusTab === "resolved") list = list.filter((c) => c.customer.conversationStatus === "resolved");
    if (statusTab === "snoozed") list = list.filter((c) => c.customer.conversationStatus === "snoozed");
    // segment tab
    if (segmentTab !== "all") {
      const map = new Map(enriched.map((e) => [e.customer.id, e.rfm.segment]));
      list = list.filter((c) => map.get(c.customer.id) === segmentTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.customer.name.toLowerCase().includes(q) ||
          c.customer.phone.includes(q) ||
          (c.lastMessage?.content.toLowerCase().includes(q) ?? false),
      );
    }
    return list.sort((a, b) => {
      const at = a.lastMessage?.timestamp ?? "";
      const bt = b.lastMessage?.timestamp ?? "";
      return bt.localeCompare(at);
    });
  }, [store.conversations, role, agent, statusTab, segmentTab, enriched, search]);

  const statusCounts = useMemo(() => {
    const base = store.conversations.filter(
      (c) => role !== "cs" || c.customer.assignedAgentId === agent?.id,
    );
    return {
      all: base.length,
      mine: base.filter((c) => c.customer.assignedAgentId === agent?.id).length,
      unassigned: base.filter((c) => !c.customer.assignedAgentId).length,
      open: base.filter((c) => c.customer.conversationStatus === "open").length,
      resolved: base.filter((c) => c.customer.conversationStatus === "resolved").length,
      snoozed: base.filter((c) => c.customer.conversationStatus === "snoozed").length,
    } as Record<string, number>;
  }, [store.conversations, role, agent]);

  const segmentCounts = useMemo(() => {
    const m: Record<string, number> = { all: enriched.length };
    enriched.forEach((e) => (m[e.rfm.segment] = (m[e.rfm.segment] ?? 0) + 1));
    return m;
  }, [enriched]);

  const selectedConv = store.conversations.find((c) => c.customer.id === selectedId);
  const selectedCustomer = selectedConv?.customer;
  const selectedRfm = selectedCustomer ? calculateRFM(selectedCustomer) : null;
  const selectedClv = selectedCustomer ? calculateCLV(selectedCustomer) : null;

  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedId, selectedConv?.messages.length]);

  const handleSend = () => {
    if (!selectedId || !draft.trim()) return;
    store.sendMessage(selectedId, draft.trim(), inputMode);
    setDraft("");
    toast.success(inputMode === "internal_note" ? "Catatan internal disimpan" : "Pesan terkirim");
  };

  return (
    <div className="flex h-screen">
      {/* LEFT: list */}
      <div className="flex w-[300px] flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari customer atau pesan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="scrollbar-thin mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  statusTab === t.id
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {t.label}
                <span className="text-[10px] opacity-70">{statusCounts[t.id] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="scrollbar-thin mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {SEGMENT_TABS.map((t) => {
              const color = t.id === "all" ? "#64748B" : SEGMENT_META[t.id].color;
              return (
                <button
                  key={t.id}
                  onClick={() => setSegmentTab(t.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    segmentTab === t.id
                      ? "border-slate-400 bg-slate-100 text-slate-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {t.label}
                  <span className="opacity-60">{segmentCounts[t.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Tidak ada percakapan yang cocok dengan filter.
            </div>
          ) : (
            conversations.map((c) => {
              const rfm = calculateRFM(c.customer);
              const isSelected = c.customer.id === selectedId;
              const ag = agents.find((a) => a.id === c.customer.assignedAgentId);
              return (
                <button
                  key={c.customer.id}
                  onClick={() => setSelectedId(c.customer.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors",
                    isSelected ? "border-l-2 border-l-emerald-500 bg-emerald-50/60" : "hover:bg-slate-50",
                  )}
                >
                  <Avatar
                    name={c.customer.name}
                    color={SEGMENT_META[rfm.segment].color}
                    size={40}
                    ringColor={SEGMENT_META[rfm.segment].color}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {c.customer.name}
                      </div>
                      <div className="ml-2 shrink-0 font-mono text-[10px] text-slate-400">
                        {c.lastMessage ? formatTime(c.lastMessage.timestamp) : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="truncate text-xs text-slate-500">
                        {c.customer.conversationStatus === "snoozed" && (
                          <span className="mr-1 inline-flex items-center gap-0.5 text-amber-600">
                            <Clock className="h-3 w-3" /> Snoozed
                          </span>
                        )}
                        {c.lastMessage?.content ?? "Belum ada pesan"}
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {ag && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {ag.name}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {orderStatusLabel(c.customer.orderStatus)}
                      </span>
                      {c.customer.priority === "high" && (
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Prioritas tinggi" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER */}
      <div className="flex flex-1 flex-col bg-[#F0F2F5]">
        {!selectedCustomer ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Send className="h-8 w-8" />
            </div>
            <p className="mt-4 max-w-xs text-sm">
              Pilih percakapan dari daftar kiri untuk mulai membalas customer.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar
                  name={selectedCustomer.name}
                  color={SEGMENT_META[selectedRfm!.segment].color}
                  size={40}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{selectedCustomer.name}</span>
                    <SegmentBadge segment={selectedRfm!.segment} />
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    {maskPhone(selectedCustomer.phone, role)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    selectedCustomer.conversationStatus === "open"
                      ? "bg-emerald-100 text-emerald-700"
                      : selectedCustomer.conversationStatus === "snoozed"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-600",
                  )}
                >
                  {selectedCustomer.conversationStatus === "open"
                    ? "Open"
                    : selectedCustomer.conversationStatus === "snoozed"
                      ? "Snoozed"
                      : "Resolved"}
                </span>
                <Select
                  value={selectedCustomer.orderStatus}
                  onValueChange={(v) => {
                    store.setOrderStatus(selectedCustomer.id, v as OrderStatus);
                    toast.success("Status order diperbarui");
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dalam_proses">Dalam Proses</SelectItem>
                    <SelectItem value="siap_diambil">Siap Diambil</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCustomer.priority}
                  onValueChange={(v) => store.setPriority(selectedCustomer.id, v as Priority)}
                >
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Tinggi</SelectItem>
                    <SelectItem value="normal">⚪ Normal</SelectItem>
                    <SelectItem value="low">🔵 Rendah</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTransferOpen(true)}>
                      Transfer ke CS lain
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSnoozeOpen(true)}>
                      Snooze percakapan
                    </DropdownMenuItem>
                    {selectedCustomer.conversationStatus !== "resolved" ? (
                      <DropdownMenuItem
                        onClick={() => {
                          store.setConversationStatus(selectedCustomer.id, "resolved");
                          toast.success("Percakapan ditandai selesai");
                        }}
                      >
                        Tandai Selesai
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          store.setConversationStatus(selectedCustomer.id, "open");
                          toast.success("Percakapan dibuka kembali");
                        }}
                      >
                        Buka Kembali
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tags row */}
            {selectedCustomer.conversationTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-white px-4 py-2">
                {selectedCustomer.conversationTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700"
                  >
                    {t}
                    <button
                      onClick={() => store.removeConversationTag(selectedCustomer.id, t)}
                      className="hover:text-violet-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Messages */}
            <div ref={chatScrollRef} className="scrollbar-thin flex-1 overflow-y-auto p-4">
              <MessagesList conv={selectedConv!} typing={typing} agentId={agent!.id} customerId={selectedCustomer.id} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 bg-white p-3">
              <div className="mb-2 flex gap-1">
                <button
                  onClick={() => setInputMode("text")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium",
                    inputMode === "text" ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100",
                  )}
                >
                  💬 Balas
                </button>
                <button
                  onClick={() => setInputMode("internal_note")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium",
                    inputMode === "internal_note" ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100",
                  )}
                >
                  📝 Catatan Internal
                </button>
              </div>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  inputMode === "text"
                    ? "Ketik balasan..."
                    : "Tulis catatan internal (tidak terlihat customer)..."
                }
                rows={2}
                className={cn(
                  "min-h-[60px] resize-none",
                  inputMode === "internal_note" && "bg-amber-50 border-amber-200",
                )}
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <Zap className="h-3.5 w-3.5" /> Quick Reply
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3" align="start">
                      <div className="text-sm font-semibold">Template Balasan Cepat</div>
                      <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
                        {templates.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setDraft((d) => (d ? d + " " : "") + t.text)}
                            className="w-full rounded-md p-2 text-left text-xs hover:bg-slate-50"
                          >
                            {t.text}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <TagIcon className="h-3.5 w-3.5" /> Label
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <div className="text-sm font-semibold">Label Percakapan</div>
                      <div className="mt-2 space-y-1">
                        {tags.filter((t) => t.scope === "conversation").map((t) => {
                          const active = selectedCustomer.conversationTags.includes(t.name);
                          return (
                            <button
                              key={t.id}
                              onClick={() =>
                                active
                                  ? store.removeConversationTag(selectedCustomer.id, t.name)
                                  : store.addConversationTag(selectedCustomer.id, t.name)
                              }
                              className="flex w-full items-center justify-between rounded-md p-2 text-left text-xs hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                                {t.name}
                              </span>
                              {active && <CheckIcon className="h-3 w-3 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => toast.info("Fitur segera hadir")}
                  >
                    <Paperclip className="h-3.5 w-3.5" /> Lampiran
                  </Button>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="h-9 gap-1 bg-[#25D366] text-white hover:bg-[#128C7E]"
                >
                  <Send className="h-4 w-4" /> Kirim
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Membalas sebagai {agent?.name}</p>
            </div>
          </>
        )}
      </div>

      {/* RIGHT */}
      {selectedCustomer && selectedRfm && selectedClv && (
        <CustomerSidePanel
          customer={selectedCustomer}
          rfm={selectedRfm}
          clv={selectedClv}
          role={role}
        />
      )}

      {/* Snooze dialog */}
      <Dialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze Percakapan</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "1 Jam", hours: 1 },
              { label: "3 Jam", hours: 3 },
              { label: "Besok Pagi (08.00)", hours: 24 },
              { label: "Minggu Depan", hours: 24 * 7 },
            ].map((o) => (
              <Button
                key={o.label}
                variant="outline"
                onClick={() => {
                  if (!selectedCustomer) return;
                  const d = new Date(Date.now() + o.hours * 3600 * 1000);
                  store.setConversationStatus(selectedCustomer.id, "snoozed", d.toISOString());
                  setSnoozeOpen(false);
                  toast.success(`Percakapan di-snooze untuk ${o.label}`);
                }}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer ke CS Lain</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {agents
              .filter((a) => a.role === "cs" && a.id !== selectedCustomer?.assignedAgentId)
              .map((a) => {
                const load = customers.filter((c) => c.assignedAgentId === a.id).length;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      if (!selectedCustomer) return;
                      store.assignCustomer(selectedCustomer.id, a.id);
                      store.sendMessage(
                        selectedCustomer.id,
                        `Percakapan ditransfer ke ${a.name}`,
                        "internal_note",
                      );
                      setTransferOpen(false);
                      toast.success(`Transfer ke ${a.name} berhasil`);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <Avatar name={a.name} color={a.color} initials={a.initials} size={36} online={a.isOnline} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-slate-500">
                        {a.isOnline ? "Online" : "Offline"} · {load} customer
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessagesList({
  conv,
  typing,
  agentId,
  customerId,
}: {
  conv: { customer: Customer; messages: any[] };
  typing: boolean;
  agentId: string;
  customerId: string;
}) {
  const groups: { day: string; items: any[] }[] = [];
  conv.messages.forEach((m) => {
    const day = relativeDay(m.timestamp);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  });

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.day}>
          <div className="flex justify-center">
            <span className="rounded-full bg-slate-200 px-3 py-0.5 text-[11px] font-medium text-slate-600">
              {g.day}
            </span>
          </div>
          <div className="mt-2 space-y-2">
            {g.items.map((m) => {
              if (m.type === "internal_note") {
                return (
                  <div key={m.id} className="mx-auto max-w-[70%] rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-[10px] font-semibold uppercase text-amber-700">📝 Catatan Internal</div>
                    <div className="mt-1 text-sm italic text-amber-900">{m.content}</div>
                    <div className="mt-1 text-right font-mono text-[10px] text-amber-600">
                      {m.senderName} · {formatTime(m.timestamp)}
                    </div>
                  </div>
                );
              }
              const isAgent = m.senderId !== customerId;
              return (
                <div key={m.id} className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg p-2.5 text-sm shadow-sm",
                      isAgent
                        ? "rounded-tr-none bg-[#25D366] text-white"
                        : "rounded-tl-none bg-white text-slate-900",
                    )}
                  >
                    {isAgent && (
                      <div className="mb-0.5 text-right text-[10px] opacity-80">{m.senderName}</div>
                    )}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-1 font-mono text-[10px]",
                        isAgent ? "justify-end text-emerald-50/80" : "justify-end text-slate-400",
                      )}
                    >
                      <span>{formatTime(m.timestamp)}</span>
                      {isAgent && (
                        m.readStatus === "read" ? (
                          <CheckCheck className="h-3 w-3 text-sky-200" />
                        ) : m.readStatus === "delivered" ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <CheckIcon className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {typing && (
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
            <span className="text-xs text-slate-500">Customer sedang mengetik</span>
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerSidePanel({
  customer,
  rfm,
  clv,
  role,
}: {
  customer: Customer;
  rfm: ReturnType<typeof calculateRFM>;
  clv: ReturnType<typeof calculateCLV>;
  role: "cs" | "supervisor";
}) {
  const store = useConversations();
  const [notesDraft, setNotesDraft] = useState(customer.notes);
  useEffect(() => setNotesDraft(customer.notes), [customer.id, customer.notes]);
  const meta = SEGMENT_META[rfm.segment];
  const [showAll, setShowAll] = useState(false);
  const purchases = showAll ? customer.purchases : customer.purchases.slice(0, 4);
  const total = customer.purchases.reduce((s, p) => s + p.price, 0);
  const lastP = customer.purchases.length
    ? customer.purchases.reduce((a, b) => (a.date > b.date ? a : b))
    : null;

  return (
    <aside className="scrollbar-thin w-[300px] overflow-y-auto border-l border-slate-200 bg-white p-4">
      <div className="flex flex-col items-center text-center">
        <Avatar name={customer.name} size={72} color={meta.color} ringColor={meta.color} />
        <h3 className="mt-3 text-lg font-semibold">{customer.name}</h3>
        <div className="font-mono text-xs text-slate-500">{maskPhone(customer.phone, role)}</div>
        <div className="text-[11px] text-slate-400">Bergabung {formatDate(customer.joinDate)}</div>
        <div className="mt-2"><SegmentBadge segment={rfm.segment} size="md" /></div>
      </div>

      {/* RFM Bars */}
      <div className="mt-4 rounded-xl border border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-700">Skor RFM</div>
        <ScoreRow label="R" score={rfm.r} />
        <ScoreRow label="F" score={rfm.f} />
        <ScoreRow label="M" score={rfm.m} />
        <div className="mt-1 text-right text-xs font-medium">
          Total: <span className="text-emerald-600">{rfm.total}</span>/15
        </div>
      </div>

      {/* CLV */}
      <div className="mt-3 rounded-xl border border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-700">💰 Nilai Customer</div>
        <div className="mt-1 text-sm">
          Total Spent: <span className="font-semibold">{formatRupiah(clv.totalSpent)}</span>
        </div>
        <div className="text-xs italic text-slate-500">
          Estimasi CLV 12 bln: {formatRupiah(clv.clv12months)}
        </div>
        <div className="text-[10px] text-slate-400">Berdasarkan pola pembelian historis</div>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-sm font-semibold">{rfm.frequency}x</div>
          <div className="text-[10px] text-slate-500">Pembelian</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-[11px] font-semibold">
            {lastP ? formatDate(lastP.date) : "-"}
          </div>
          <div className="text-[10px] text-slate-500">Terakhir</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-[11px] font-semibold">{formatRupiah(total)}</div>
          <div className="text-[10px] text-slate-500">Total</div>
        </div>
      </div>

      {/* Alerts */}
      {rfm.segment === "at_risk" && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertTriangle className="mb-1 inline h-3.5 w-3.5" /> Pernah aktif, kini sudah {rfm.recencyDays} hari tidak order.
        </div>
      )}
      {rfm.segment === "dormant" && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          😴 Tidak ada transaksi selama {rfm.recencyDays} hari.
        </div>
      )}
      {rfm.segment === "champions" && (
        <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
          <Crown className="mb-1 inline h-3.5 w-3.5" /> Customer terbaik — jaga hubungan ini.
        </div>
      )}

      {/* Tags */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-700">Tag Customer</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {customer.tags.length === 0 && (
            <span className="text-[11px] text-slate-400">Belum ada tag</span>
          )}
          {customer.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700">
              {t}
              <button onClick={() => store.removeCustomerTag(customer.id, t)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Purchase history */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-700">Riwayat Pembelian</div>
        <div className="mt-1 space-y-1">
          {purchases.length === 0 && (
            <div className="text-[11px] text-slate-400">Belum ada transaksi</div>
          )}
          {purchases.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-xs">
              <div>
                <div className="font-medium">{p.serviceName}</div>
                <div className="font-mono text-[10px] text-slate-400">{formatDate(p.date)}</div>
              </div>
              <div className="font-semibold text-emerald-600">{formatRupiah(p.price)}</div>
            </div>
          ))}
          {customer.purchases.length > 4 && (
            <button onClick={() => setShowAll((s) => !s)} className="text-[11px] text-emerald-600">
              {showAll ? "Sembunyikan" : `+ lihat semua (${customer.purchases.length})`}
            </button>
          )}
          {customer.purchases.length > 0 && (
            <div className="mt-1 flex justify-between rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
              <span>Total {customer.purchases.length}x</span>
              <span>{formatRupiah(total)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Segment history */}
      {customer.segmentHistory.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-slate-700">
            📊 Riwayat Perubahan Segment
          </summary>
          <div className="mt-2 space-y-2 border-l-2 border-slate-200 pl-3">
            {customer.segmentHistory.map((h, i) => (
              <div key={i} className="text-[11px]">
                <div className="font-mono text-slate-400">{formatDate(h.date)}</div>
                <div>
                  {h.fromSegment ? `${SEGMENT_META[h.fromSegment].label} → ` : ""}
                  <span style={{ color: SEGMENT_META[h.toSegment].color }} className="font-semibold">
                    {SEGMENT_META[h.toSegment].label}
                  </span>
                </div>
                <div className="text-slate-500">{h.reason}</div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Internal notes */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-700">Catatan Internal</div>
        <Textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => {
            if (notesDraft !== customer.notes) {
              store.saveNotes(customer.id, notesDraft);
              toast.success("Catatan disimpan");
            }
          }}
          placeholder="Catatan internal CS..."
          rows={3}
          className="mt-1 text-xs"
        />
        <div className="mt-1 text-[10px] text-slate-400">🔒 Hanya terlihat oleh tim internal</div>
      </div>
    </aside>
  );
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="mt-1 flex items-center gap-2 text-xs">
      <span className="w-3 font-mono font-semibold">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={cn(
              "h-2 w-3 rounded-sm",
              n <= score ? "bg-emerald-500" : "bg-slate-200",
            )}
          />
        ))}
      </div>
      <span className="ml-auto font-mono text-slate-500">{score}/5</span>
    </div>
  );
}
