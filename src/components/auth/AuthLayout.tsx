import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen w-full bg-[#0A0A0C]">
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#050506] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.35), transparent 70%)" }}
        />
        <div className="relative flex items-center gap-3 animate-fade-in-up">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
            style={{
              background: "linear-gradient(180deg,#22C55E,#16A34A)",
              boxShadow: "0 8px 22px rgba(22,163,74,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <MessageCircle className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">ChatCRM</span>
        </div>
        <div className="relative animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#22C55E]">
            Customer · WhatsApp · Pipeline
          </div>
          <h1 className="text-[44px] font-semibold leading-[1.05] tracking-tight text-white">
            Kelola customer<br />& chat dalam<br />satu platform.
          </h1>
          <div className="mt-10 flex items-center gap-3">
            <div className="h-3 w-40 rounded-full bg-white/[0.04]" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-3 w-24 rounded-full bg-white/[0.04]" />
            <div
              className="h-3 w-32 rounded-full"
              style={{ background: "linear-gradient(180deg,#22C55E,#16A34A)" }}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="ml-40 h-3 w-28 rounded-full"
              style={{ background: "linear-gradient(180deg,#16A34A,#0F5F32)" }}
            />
          </div>
        </div>
        <div className="relative flex items-center gap-8 text-xs text-slate-500">
          <span>2.400+ percakapan / bulan</span>
          <span>98% terbalas</span>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-[#0A0A0C] px-6 py-12 lg:w-[55%]">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(180deg,#22C55E,#16A34A)" }}
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">ChatCRM</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#F4F4F5]">{title}</h2>
          <p className="mt-2 text-sm text-[#8B8B93]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
