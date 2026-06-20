import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AGENTS } from "@/data/agents";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ROLE_DISPLAY } from "@/lib/permissions";
import type { Role } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk — ChatCRM" },
      { name: "description", content: "Masuk ke ChatCRM untuk kelola inbox WA dan customer." },
      { property: "og:title", content: "Masuk — ChatCRM" },
      { property: "og:description", content: "Inbox & CRM untuk laundry & salon." },
    ],
  }),
  component: LoginPage,
});

const FEATURES = [
  "Inbox WA terpusat untuk seluruh tim CS",
  "Segmentasi RFM otomatis dari data transaksi",
  "Proteksi data customer dari CS",
];

function LoginPage() {
  const { login, currentAgent } = useStore();
  const router = useRouter();
  const [selected, setSelected] = useState<string>(AGENTS[0].id);

  useEffect(() => {
    if (currentAgent) router.navigate({ to: "/dashboard" });
  }, [currentAgent, router]);

  const handleLogin = () => {
    const agent = AGENTS.find((a) => a.id === selected)!;
    login(agent.id);
    toast.success(`Selamat datang, ${agent.name}!`);
    router.navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left brand panel */}
      <div className="hidden w-[45%] flex-col justify-between bg-[#111B21] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">ChatCRM</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Kelola customer & chat dalam satu platform
          </h1>
          <p className="mt-4 text-slate-400">
            Inbox WhatsApp, segmentasi RFM, dan proteksi data — semua dalam satu workspace untuk tim CS Anda.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-slate-200">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366]">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-slate-500">© 2026 ChatCRM · Demo</div>
      </div>
      {/* Right login panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-[55%]">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">ChatCRM</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Masuk ke ChatCRM</h2>
          <p className="mt-1 text-sm text-slate-500">Pilih akun untuk masuk ke workspace demo.</p>

          <div className="mt-6 space-y-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                  selected === a.id
                    ? "border-[#25D366] bg-[#25D366]/5 shadow-sm"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <Avatar name={a.name} color={a.color} initials={a.initials} size={40} />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{a.name}</div>
                  <div className="text-xs text-slate-500">
                    {ROLE_DISPLAY[a.role as Role].subtitle}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    ROLE_DISPLAY[a.role as Role].badgeClass,
                  )}
                >
                  {a.role}
                </span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleLogin}
            className="mt-6 h-11 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#128C7E]"
          >
            Masuk
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="mt-4 text-center text-xs text-slate-500">
            Demo mode — pilih role untuk melihat perbedaan akses.
          </p>
        </div>
      </div>
    </div>
  );
}
