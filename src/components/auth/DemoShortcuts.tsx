import { Avatar } from "@/components/Avatar";
import { DEMO_ACCOUNTS, type DemoAccount } from "@/lib/auth/demo-accounts";
import { ROLE_DISPLAY } from "@/lib/permissions";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function DemoShortcuts({
  onSelect,
  activeEmail,
}: {
  onSelect: (account: DemoAccount) => void;
  activeEmail?: string;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Sparkles className="h-3.5 w-3.5" />
        Coba demo cepat
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Klik akun untuk mengisi email & password otomatis.
      </p>
      <div className="mt-3 space-y-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.agentId}
            type="button"
            onClick={() => onSelect(account)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
              activeEmail === account.email
                ? "border-[#16A34A] bg-[#16A34A]/5 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <Avatar
              name={account.name}
              color={account.color}
              initials={account.initials}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">{account.name}</div>
              <div className="truncate text-xs text-slate-500">
                {ROLE_DISPLAY[account.role as Role].subtitle}
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                ROLE_DISPLAY[account.role as Role].badgeClass,
              )}
            >
              {account.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
