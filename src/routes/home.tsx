import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { useConversations } from "@/hooks/useConversations";
import { formatDateLong } from "@/lib/format";
import { SEGMENT_META } from "@/lib/rfm";
import type { RFMSegment } from "@/types";
import { MessageSquare, Users, BarChart3, Settings as SettingsIcon, Lock, AlertTriangle, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Beranda — ChatCRM" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { agent, role } = useAuth();
  const { enriched } = useCustomers();
  const { conversations } = useConversations();

  const segmentCounts = enriched.reduce<Record<RFMSegment, number>>(
    (acc, e) => {
      acc[e.rfm.segment] = (acc[e.rfm.segment] ?? 0) + 1;
      return acc;
    },
    { champions: 0, loyal: 0, promising: 0, at_risk: 0, new: 0, dormant: 0 },
  );
  const totalCustomers = enriched.length;

  const myConvs = conversations.filter(
    (c) => role === "supervisor" || c.customer.assignedAgentId === agent?.id,
  );
  const openCount = myConvs.filter((c) => c.customer.conversationStatus === "open").length;
  const snoozedCount = myConvs.filter((c) => c.customer.conversationStatus === "snoozed").length;
  const awaitingReply = myConvs.filter((c) => c.unreadCount > 0).length;

  const atRiskCount = segmentCounts.at_risk;
  const championsCount = segmentCounts.champions;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">{formatDateLong(new Date().toISOString())}</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{agent?.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
              {role}
            </span>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
          Halo {agent?.name}! 👋
        </h1>
        <p className="mt-1 text-slate-500">
          Ringkasan aktivitas tim CS dan customer hari ini.
        </p>

        {role === "supervisor" && atRiskCount > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="text-sm">
              <span className="font-semibold">🚨 {atRiskCount} customer At Risk</span> — terakhir order lebih dari 60 hari lalu. Segera follow up.
            </div>
          </div>
        )}
        {role === "supervisor" && championsCount > 0 && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <Crown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="text-sm">
              <span className="font-semibold">👑 {championsCount} customer Champions</span> — pastikan tetap dijaga relasinya minggu ini.
            </div>
          </div>
        )}

        <div className={cn("mt-8 grid gap-4", role === "supervisor" ? "md:grid-cols-2" : "md:grid-cols-2")}>
          <FeatureCard
            to="/chat"
            icon={<MessageSquare className="h-6 w-6 text-emerald-600" />}
            iconBg="bg-emerald-100"
            title="Chat Inbox"
            subtitle={`${openCount} percakapan terbuka · ${awaitingReply} menutggu balasan`}
            cta="Buka Inbox"
          >
            <div className="mt-3 flex gap-2">
              <Pill color="emerald">{openCount} open</Pill>
              <Pill color="amber">{snoozedCount} snoozed</Pill>
            </div>
          </FeatureCard>

          <FeatureCard
            to="/customers"
            icon={<Users className="h-6 w-6 text-sky-600" />}
            iconBg="bg-sky-100"
            title="Customer"
            subtitle={`${totalCustomers} total customer`}
            cta="Lihat Customer"
          >
            <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              {(Object.entries(segmentCounts) as [RFMSegment, number][]).map(([seg, count]) =>
                count > 0 ? (
                  <div
                    key={seg}
                    style={{
                      width: `${(count / totalCustomers) * 100}%`,
                      backgroundColor: SEGMENT_META[seg].color,
                    }}
                    title={`${SEGMENT_META[seg].label}: ${count}`}
                  />
                ) : null,
              )}
            </div>
          </FeatureCard>

          {role === "supervisor" ? (
            <FeatureCard
              to="/dashboard"
              icon={<BarChart3 className="h-6 w-6 text-violet-600" />}
              iconBg="bg-violet-100"
              title="Dashboard & Analitik"
              subtitle="RFM distribution · CS performance · Spending trend"
              cta="Buka Dashboard"
            />
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm opacity-60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Dashboard & Analitik</h3>
                <p className="mt-1 text-sm text-slate-500">Akses terbatas — khusus Supervisor.</p>
              </div>
            </div>
          )}

          <FeatureCard
            to="/settings"
            icon={<SettingsIcon className="h-6 w-6 text-slate-600" />}
            iconBg="bg-slate-100"
            title="Pengaturan"
            subtitle="Agent, template, layanan & preferensi"
            cta="Buka Pengaturan"
          />
        </div>
      </div>
    </AppShell>
  );
}

function FeatureCard({
  to,
  icon,
  iconBg,
  title,
  subtitle,
  cta,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  cta: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
      <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-emerald-600 group-hover:gap-2 transition-all">
        {cta}
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function Pill({ color, children }: { color: "emerald" | "amber"; children: React.ReactNode }) {
  const styles =
    color === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", styles)}>
      {children}
    </span>
  );
}