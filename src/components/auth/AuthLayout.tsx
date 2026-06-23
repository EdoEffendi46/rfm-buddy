import type { ReactNode } from "react";
import { Check, MessageCircle } from "lucide-react";

const FEATURES = [
  "Inbox WA terpusat untuk seluruh tim CS",
  "Segmentasi RFM otomatis dari data transaksi",
  "Layanan & kategori disesuaikan per bisnis",
  "Proteksi data customer dari CS",
];

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
    <div className="flex min-h-screen w-full">
      <div className="hidden w-[45%] flex-col justify-between bg-[#111B21] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A34A]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">ChatCRM</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Kelola customer & chat dalam satu platform
          </h1>
          <p className="mt-4 text-slate-400">
            Inbox WhatsApp, segmentasi RFM, dan proteksi data — fleksibel untuk bisnis apa saja,
            dalam satu workspace untuk tim CS Anda.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-slate-200">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/20 text-[#16A34A]">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-slate-500">© 2026 ChatCRM</div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-[55%]">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A34A] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">ChatCRM</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
