import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useConversations } from "@/hooks/useConversations";
import { SEGMENT_META } from "@/lib/rfm";
import { CADENCE_LABEL_TEXT } from "@/lib/cadence";
import { formatRupiah, formatDateLong, formatDate } from "@/lib/format";
import { demoNowMs } from "@/lib/demo";
import { isTeamView, ROLE_DISPLAY } from "@/lib/permissions";
import { getFieldDisplay } from "@/lib/fieldVisibility";
import { useStore } from "@/lib/store";
import { SegmentBadge } from "@/components/SegmentBadge";
import { SegmentIcon } from "@/components/SegmentIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { RFMSegment } from "@/types";
import {
  AlertTriangle,
  Crown,
  Clock,
  MessageSquare,
  Users,
  Settings as SettingsIcon,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ChatCRM" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { agent, role } = useAuth();
  const { enriched, agents } = useCustomers();
  const { conversations } = useConversations();
  const { fieldRules } = useStore();
  const teamView = isTeamView(role);
  const roleDisplay = role ? ROLE_DISPLAY[role] : ROLE_DISPLAY.cs;

  const myEnriched = teamView
    ? enriched
    : enriched.filter((e) => e.customer.assignedAgentId === agent?.id);
  const myConvs = teamView
    ? conversations
    : conversations.filter((c) => c.customer.assignedAgentId === agent?.id);

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
      months.push({
        key,
        label: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][
          d.getMonth()
        ],
      });
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

  const openConvs = myConvs.filter((c) => c.customer.conversationStatus === "open").length;
  const awaitingReply = myConvs.filter((c) => c.unreadCount > 0).length;
  const slaBreach = myConvs.filter((c) => {
    if (c.unreadCount === 0 || !c.lastMessage) return false;
    const last = new Date(c.lastMessage.timestamp).getTime();
    return demoNowMs() - last > 2 * 60 * 60 * 1000;
  }).length;
  const championsCount = segmentData.find((s) => s.segment === "champions")?.value ?? 0;
  const atRiskCount = segmentData.find((s) => s.segment === "at_risk")?.value ?? 0;

  // Cadence-based follow-up (personalized, separate from RFM)
  const cadenceFollowUp = useMemo(
    () =>
      myEnriched
        .filter((e) => e.cadence.daysUntilPredicted !== null)
        .map((e) => ({
          ...e,
          status:
            e.cadence.daysUntilPredicted! < 0
              ? ("overdue" as const)
              : e.cadence.daysUntilPredicted! <= 3
                ? ("due_soon" as const)
                : ("on_track" as const),
        }))
        .sort((a, b) => (a.cadence.daysUntilPredicted ?? 0) - (b.cadence.daysUntilPredicted ?? 0)),
    [myEnriched],
  );
  const overdueCount = cadenceFollowUp.filter((e) => e.status === "overdue").length;

  const followUpList = useMemo(
    () => enriched.filter((e) => e.rfm.segment === "at_risk" || e.rfm.segment === "dormant"),
    [enriched],
  );
  const [followTab, setFollowTab] = useState<"at_risk" | "dormant" | "all">("at_risk");
  const followFiltered = followUpList
    .filter((e) => followTab === "all" || e.rfm.segment === followTab)
    .sort((a, b) => b.rfm.recencyDays - a.rfm.recencyDays);

  const csStats = agents
    .filter((a) => a.role === "cs")
    .map((a) => {
      const assigned = enriched.filter((e) => e.customer.assignedAgentId === a.id);
      const open = conversations.filter(
        (c) => c.customer.assignedAgentId === a.id && c.customer.conversationStatus === "open",
      ).length;
      return { agent: a, assigned: assigned.length, open };
    });

  const totalCLV = enriched.reduce((s, e) => s + e.clv.clv12months, 0);
  const topCLV = [...enriched].sort((a, b) => b.clv.clv12months - a.clv.clv12months).slice(0, 5);

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-slate-500">{formatDateLong(new Date().toISOString())}</div>
            <h1 className="text-2xl font-bold tracking-tight">Halo, {agent?.name}</h1>
            <p className="text-sm text-slate-500">{roleDisplay.dashboardSubtitle}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${roleDisplay.badgeClass}`}
          >
            {role === "owner" ? "Owner" : role === "supervisor" ? "Supervisor" : "CS"}
          </span>
        </div>

        {/* Alert Banners */}
        <div className="space-y-2">
          {teamView && atRiskCount > 0 && (
            <button
              onClick={() => navigate({ to: "/customers" })}
              className="flex w-full items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-red-800 hover:bg-red-100"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="text-sm">
                <span className="font-semibold">{atRiskCount} customer At Risk</span> - terakhir
                order &gt;60 hari. Segera follow up.
              </div>
            </button>
          )}
          {teamView && championsCount > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-violet-800">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div className="text-sm">
                <span className="font-semibold">{championsCount} customer Champions</span> -
                pastikan tetap dijaga relasinya.
              </div>
            </div>
          )}
          {slaBreach > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <span className="font-semibold">{slaBreach} percakapan</span> menunggu balasan &gt;2
                jam (SLA breach).
              </div>
            </div>
          )}
          {overdueCount > 0 && (
            <a
              href="#cadence-followup"
              className="flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-amber-800 hover:bg-amber-100"
            >
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <span className="font-semibold">{overdueCount} customer</span> melewati siklus order
                biasanya - peluang follow up proaktif.
              </div>
            </a>
          )}
        </div>

        {/* KPI */}
        <div className="grid gap-4 md:grid-cols-4">
          {teamView ? (
            <>
              <Kpi
                title="Total Customer"
                value={enriched.length.toString()}
                sub={`${enriched.filter((e) => e.rfm.segment === "new").length} baru bulan ini`}
              />
              <Kpi
                title="Open Conversations"
                value={openConvs.toString()}
                sub={`${awaitingReply} belum dibalas`}
              />
              <Kpi
                title="Champions"
                value={championsCount.toString()}
                sub={`${Math.round((championsCount / Math.max(enriched.length, 1)) * 100)}% dari total`}
                color="#7C3AED"
              />
              <Kpi
                title="At Risk"
                value={atRiskCount.toString()}
                sub="Perlu follow up segera"
                color="#EF4444"
              />
            </>
          ) : (
            <>
              <Kpi
                title="Customer Saya"
                value={myEnriched.length.toString()}
                sub="Ditugaskan untukmu"
              />
              <Kpi
                title="Chat Terbuka"
                value={openConvs.toString()}
                sub={`${awaitingReply} belum dibalas`}
              />
              <Kpi
                title="Resolved Hari Ini"
                value={myConvs
                  .filter((c) => c.customer.conversationStatus === "resolved")
                  .length.toString()}
                sub="Percakapan selesai"
                color="#22C55E"
              />
              <Kpi title="Avg Response" value="~4 mnt" sub="Target SLA: 30 mnt" color="#3B82F6" />
            </>
          )}
        </div>

        {/* Charts — Supervisor only */}
        {teamView && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Distribusi Segment RFM</div>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {segmentData.map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {segmentData.map((s) => (
                  <div key={s.segment} className="flex items-center gap-1.5">
                    <SegmentIcon segment={s.segment} />
                    <span>{s.name}</span>
                    <span className="ml-auto font-mono">
                      {s.value} ({Math.round((s.value / enriched.length) * 100)}%)
                    </span>
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
                    <YAxis fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => formatRupiah(v)} />
                    <Bar dataKey="total" fill="#16A34A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Follow Up */}
        {teamView && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Customer Prioritas Follow Up</div>
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
                          <td className="font-mono text-xs">
                            {getFieldDisplay("phone", e.customer.phone, role, fieldRules)}
                          </td>
                          <td>
                            <SegmentBadge segment={e.rfm.segment} />
                          </td>
                          <td className="text-right font-mono text-xs">{e.rfm.total}/15</td>
                          <td className="text-right font-mono text-xs">{e.rfm.recencyDays}</td>
                          <td className="text-right font-mono text-xs">
                            {formatRupiah(e.clv.clv12months)}
                          </td>
                          <td>{ag?.name ?? "-"}</td>
                          <td className="text-right">
                            <Button
                              size="sm"
                              className="h-7 bg-[#16A34A] text-xs text-white hover:bg-[#15803D]"
                              onClick={() =>
                                navigate({
                                  to: "/chat/$customerId",
                                  params: { customerId: e.customer.id },
                                })
                              }
                            >
                              Buka Chat
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {followFiltered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-xs text-slate-400">
                          Tidak ada customer dalam segment ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* CS Performance */}
        {teamView && (
          <div
            id="cadence-followup"
            className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="h-4 w-4 text-amber-600" />
                Customer Perlu Di-follow Up (Berdasarkan Siklus)
              </div>
              <div className="text-xs text-slate-500">
                {overdueCount} overdue · berbeda dengan At Risk RFM - ini berdasarkan pola personal
                per customer
              </div>
            </div>
            <table className="mt-3 w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="text-left">Nama</th>
                  <th className="text-left">Segment (RFM)</th>
                  <th className="text-left">Siklus</th>
                  <th className="text-left">Terakhir Order</th>
                  <th className="text-left">Prediksi</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">CS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cadenceFollowUp.slice(0, 10).map((e) => {
                  const ag = agents.find((a) => a.id === e.customer.assignedAgentId);
                  const lastP = e.customer.purchases.length
                    ? e.customer.purchases.reduce((a, b) => (a.date > b.date ? a : b))
                    : null;
                  const statusBadge =
                    e.status === "overdue" ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Overdue {Math.abs(e.cadence.daysUntilPredicted!)}d
                      </span>
                    ) : e.status === "due_soon" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Due {e.cadence.daysUntilPredicted}d
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        On Track
                      </span>
                    );
                  return (
                    <tr key={e.customer.id} className="border-t border-slate-100">
                      <td className="py-2 font-medium">{e.customer.name}</td>
                      <td>
                        <SegmentBadge segment={e.rfm.segment} />
                      </td>
                      <td className="text-xs">
                        {CADENCE_LABEL_TEXT[e.cadence.label]}
                        <span className="ml-1 font-mono text-[10px] text-slate-400">
                          (~{e.cadence.avgDaysBetweenOrders}d)
                        </span>
                      </td>
                      <td className="font-mono text-xs">{lastP ? formatDate(lastP.date) : "-"}</td>
                      <td className="font-mono text-xs">
                        {e.cadence.predictedNextOrderDate
                          ? formatDate(e.cadence.predictedNextOrderDate)
                          : "-"}
                      </td>
                      <td>{statusBadge}</td>
                      <td className="text-xs">{ag?.name ?? "-"}</td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          className="h-7 bg-[#16A34A] text-xs text-white hover:bg-[#15803D]"
                          onClick={() =>
                            navigate({
                              to: "/chat/$customerId",
                              params: { customerId: e.customer.id },
                            })
                          }
                        >
                          Follow Up
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {cadenceFollowUp.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-xs text-slate-400">
                      Belum ada customer dengan data siklus yang cukup.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {teamView && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Performa CS</div>
              <table className="mt-2 w-full text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="text-left">CS</th>
                    <th>Online</th>
                    <th className="text-right">Assigned</th>
                    <th className="text-right">Open</th>
                    <th className="text-right">Avg Resp.</th>
                  </tr>
                </thead>
                <tbody>
                  {csStats.map((s) => (
                    <tr key={s.agent.id} className="border-t border-slate-100">
                      <td className="py-2">{s.agent.name}</td>
                      <td className="text-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${s.agent.isOnline ? "bg-emerald-500" : "bg-slate-300"}`}
                        />
                      </td>
                      <td className="text-right font-mono text-xs">{s.assigned}</td>
                      <td className="text-right font-mono text-xs">{s.open}</td>
                      <td className="text-right font-mono text-xs">
                        ~{Math.floor(Math.random() * 8 + 2)} mnt
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">CLV Overview</div>
                <div className="text-xs text-slate-500">
                  Total: <span className="font-semibold">{formatRupiah(totalCLV)}</span>
                </div>
              </div>
              <table className="mt-2 w-full text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Segment</th>
                    <th className="text-right">CLV 12 bln</th>
                  </tr>
                </thead>
                <tbody>
                  {topCLV.map((e) => (
                    <tr key={e.customer.id} className="border-t border-slate-100">
                      <td className="py-2">{e.customer.name}</td>
                      <td>
                        <SegmentBadge segment={e.rfm.segment} />
                      </td>
                      <td className="text-right font-mono text-xs">
                        {formatRupiah(e.clv.clv12months)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid gap-4 md:grid-cols-3">
          <QuickLink
            to="/chat"
            icon={<MessageSquare className="h-5 w-5 text-emerald-600" />}
            bg="bg-emerald-100"
            title="Chat Inbox"
            stat={`${openConvs} percakapan terbuka`}
            cta="Buka Inbox"
          />
          <QuickLink
            to="/customers"
            icon={<Users className="h-5 w-5 text-sky-600" />}
            bg="bg-sky-100"
            title="Customer"
            stat={`${myEnriched.length} customer`}
            cta="Lihat Customer"
          />
          <QuickLink
            to="/settings"
            icon={<SettingsIcon className="h-5 w-5 text-slate-600" />}
            bg="bg-slate-100"
            title="Pengaturan"
            stat="Profil, tim, template"
            cta="Buka Pengaturan"
          />
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({
  title,
  value,
  sub,
  color = "#0F172A",
}: {
  title: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase text-slate-500">{title}</div>
      <div className="mt-1 text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  bg,
  title,
  stat,
  cta,
}: {
  to: string;
  icon: React.ReactNode;
  bg: string;
  title: string;
  stat: string;
  cta: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{stat}</div>
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 group-hover:gap-2 transition-all">
        {cta}
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
