import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { MessageSquare, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { AgentAvatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";
import { isTeamView } from "@/lib/permissions";
import { toast } from "sonner";

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
  active,
}: {
  to: string;
  icon: typeof MessageSquare;
  label: string;
  badge?: number;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-150",
        active
          ? "bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-x-2 before:-translate-y-1/2 before:rounded-r-full before:bg-[#16A34A]"
          : "text-slate-400 hover:bg-white/5 hover:text-white",
      )}
      title={label}
    >
      <Icon className="h-5 w-5" />
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-semibold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
      <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-md group-hover:block">
        {label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const { agent, logout, role } = useAuth();
  const { conversations } = useConversations();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = conversations
    .filter((c) => isTeamView(role) || c.customer.assignedAgentId === agent?.id)
    .reduce((s, c) => s + c.unreadCount, 0);

  return (
    <aside className="flex h-screen w-16 flex-col items-center bg-[var(--sidebar-bg)] py-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A34A] text-sm font-semibold text-white">
        CC
      </div>
      <nav className="flex flex-1 flex-col items-center gap-2">
        <NavItem
          to="/dashboard"
          icon={BarChart3}
          label="Dashboard"
          active={pathname === "/dashboard"}
        />
        <NavItem
          to="/chat"
          icon={MessageSquare}
          label="Chat Inbox"
          active={pathname.startsWith("/chat")}
          badge={unread}
        />
        <NavItem to="/customers" icon={Users} label="Customer" active={pathname === "/customers"} />
        <NavItem
          to="/settings"
          icon={Settings}
          label="Pengaturan"
          active={pathname === "/settings"}
        />
      </nav>
      <div className="flex flex-col items-center gap-3">
        {agent && <AgentAvatar agent={agent} size={36} online />}
        <button
          onClick={async () => {
            await logout();
            toast.success("Berhasil keluar");
            router.navigate({ to: "/" });
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"
          title="Keluar"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
