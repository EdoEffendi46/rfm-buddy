import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useCustomers } from "@/hooks/useCustomers";
import { useConversations } from "@/hooks/useConversations";
import { SEGMENT_META } from "@/lib/rfm";
import { formatRupiah, formatDate } from "@/lib/format";
import { SegmentBadge } from "@/components/SegmentBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend,
} from "recharts";
import type { RFMSegment } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ChatCRM" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { enriched, agents } = useCustomers();
  const { conversations } = useConversations();

  const segmentData = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach((e) => (map[e.rfm.segment] = (map[e.rfm.segment] ?? 0) + 1));
    return (Object.entries(map) as [RFMSegment, number][]).map(([seg, count]) => ({
      name: SEGMENT_META[seg].label,
      value: count,
      color: SEGMENT_META[seg].color,
      segment: seg,
    }));
  }, [enriched]);

  const monthlySpending = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date("2026-06-18");
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({ key, label: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][d.getMonth()] });
    }
    const totals = Object.fromEntries(months.map((m) => [m.key, 0])) as Record<string, number>;
    enriched.forEach((e) =>
      e.customer.purchases.forEach((p) => {
        const d = new Date(p.date);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (k in totals) totals[k] += p.price;
      }),
    );
    return months.map((m) => ({ month: m.label, total: totals[m.key] }));
  }, [enriched]);

  const openConvs = conversations.filter((c) => c.customer.conversationStatus === "open").length;
  const awaitingReply = conversations.filter((c) => c.unreadCount > 0).length;
  const championsCount = segmentData.find((s) => s.segment === "champions")?.value ?? 0;
  const atRiskCount = segmentData.find((s) => s.segment === "at_risk")?.value ?? 0;

  const followUpList = useMemo(
    () => enriched.filter((e) => e.rfm.segment === "at_risk" || e.rfm.segment === "dormant"),
    [enriched],
  );
  const [followTab, setFollowTab] = useState<"at_risk" | "dormant" | "all">("at_risk");
  const followFiltered = followUpList
    .filter((e) => followTab === "all" || e.rfm.segment === followTab)
    .sort((a, b) => b.rfm.recencyDays - a.rfm.recencyDays);

  const csStats = agents.filter((a) => a.role === "cs").map((a) => {
    const assigned = enriched.filter((e) => e.customer.assignedAgentId === a.id);
    const open = conversations.filter(
      (c) => c.customer.assignedAgentId === a.id && c.customer.conversationStatus === "open",
    ).length;
    return { agent: a, assigned: assigned.length, open };
  });

  const totalCLV = enriched.reduce((s, e) => s + e.clv.clv12months, 0);
  const topCLV = [...enriched].sort((a, b) => b.clv.clv12months - a.clv.clv12months).slice(0, 5);

  return (
    <AppShell supervisorOnly>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard & Analitik</h1>
          <p className="text-sm text-slate-500">Ringkasan performa CS, segmentasi RFM, dan tren pengeluaran.</p>
        </div>

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="Total Customer" value={enriched.length.toString()} sub={`${enriched.filter((e) => e.rfm.segment === "new").length} baru bulan ini`} />
          <Kpi title="Open Conversations" value={openConvs.toString()} sub={`${awaitingReply} belum dibalas`} />
          <Kpi title="Champions 👑" value={championsCount.toString()} sub={`${Math.round((championsCount / enriched.length) * 100)}% dari total customer`} color="#7C3AED" />
          <Kpi title="At Risk ⚠️" value={atRiskCount.toString()} sub="Perlu follow up segera" color="#EF4444" />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Distribusi Segment RFM</div>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={segmentData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {segmentData.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {segmentData.map((s) => (
                <div key={s.segment} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                  <span className="ml-auto font-mono">{s.value} ({Math.round((s.value / enriched.length) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Tren Pengeluaran Bulanan</div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={monthlySpending}>
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Bar dataKey="total" fill="#25D366" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Follow Up */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">🚨 Customer Prioritas Follow Up</div>
          </div>
          <Tabs value={followTab} onValueChange={(v) => setFollowTab(v as any)} className="mt-2">
            <TabsList>
              <TabsTrigger value="at_risk">At Risk</TabsTrigger>
              <TabsTrigger value="dormant">Dormant</TabsTrigger>
              <TabsTrigger value="all">Semua</TabsTrigger>
            </TabsList>
            <TabsContent value={followTab} className="mt-2">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="text-left">Nama</th>
                    <th className="text-left">No HP</th>
                    <th className="text-left">Segment</th>
                    <th className="text-right">RFM</th>
                    <th className="text-right">Hari Tidak Order</th>
                    <th className="text-right">CLV Est.</th>
                    <th className="text-left">CS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {followFiltered.map((e) => {
                    const ag = agents.find((a) => a.id === e.customer.assignedAgentId);
                    return (
                      <tr key={e.customer.id} className="border-t border-slate-100">
                        <td className="py-2 font-medium">{e.customer.name}</td>
                        <td className="font-mono text-xs">{e.customer.phone}</td>
                        <td><SegmentBadge segment={e.rfm.segment} /></td>
                        <td className="text-right font-mono text-xs">{e.rfm.total}/15</td>
                        <td className="text-right font-mono text-xs">{e.rfm.recencyDays}</td>
                        <td className="text-right font-mono text-xs">{formatRupiah(e.clv.clv12months)}</td>
                        <td>{ag?.name ?? "-"}</td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            className="h-7 bg-[#25D366] text-xs text-white hover:bg-[#128C7E]"
                            onClick={() => navigate({ to: "/chat/$customerId", params: { customerId: e.customer.id } })}
                          >
                            Buka Chat
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {followFiltered.length === 0 && (
                    <tr><td colSpan={8} className="py-4 text-center text-xs text-slate-400">Tidak ada customer dalam segment ini.</td></tr>
                  )}
                </tbody>
              </table>
            </TabsContent>
          </Tabs>
        </div>

        {/* CS Performance */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Performa CS</div>
            <table className="mt-2 w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="text-left">CS</th><th>Online</th><th className="text-right">Assigned</th><th className="text-right">Open</th><th className="text-right">Avg Resp.</th></tr>
              </thead>
              <tbody>
                {csStats.map((s) => (
                  <tr key={s.agent.id} className="border-t border-slate-100">
                    <td className="py-2">{s.agent.name}</td>
                    <td className="text-center"><span className={`inline-block h-2 w-2 rounded-full ${s.agent.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} /></td>
                    <td className="text-right font-mono text-xs">{s.assigned}</td>
                    <td className="text-right font-mono text-xs">{s.open}</td>
                    <td className="text-right font-mono text-xs">~{Math.floor(Math.random() * 8 + 2)} mnt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">💰 CLV Overview</div>
              <div className="text-xs text-slate-500">Total: <span className="font-semibold">{formatRupiah(totalCLV)}</span></div>
            </div>
            <table className="mt-2 w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="text-left">Customer</th><th className="text-left">Segment</th><th className="text-right">CLV 12 bln</th></tr>
              </thead>
              <tbody>
                {topCLV.map((e) => (
                  <tr key={e.customer.id} className="border-t border-slate-100">
                    <td className="py-2">{e.customer.name}</td>
                    <td><SegmentBadge segment={e.rfm.segment} /></td>
                    <td className="text-right font-mono text-xs">{formatRupiah(e.clv.clv12months)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ title, value, sub, color = "#0F172A" }: { title: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase text-slate-500">{title}</div>
      <div className="mt-1 text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}