import { Building2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/lib/store";
import { hasPermission, getAgentBranchIds } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BranchSwitcher() {
  const { agent } = useAuth();
  const { branches, selectedBranchId, setSelectedBranchId } = useStore();
  if (!agent) return null;
  const canViewAll = hasPermission(agent, "branch_view_all");

  if (!canViewAll) {
    const ids = getAgentBranchIds(agent);
    const list = branches.filter((b) => ids.includes(b.id));
    if (list.length === 0) return null;
    const label = list.length === 1 ? list[0].name : `${list.length} Cabang`;
    const title = list.map((b) => b.name).join(", ");
    return (
      <div
        title={title}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"
      >
        <MapPin className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium text-slate-700">{label}</span>
      </div>
    );
  }

  return (
    <Select value={selectedBranchId} onValueChange={(v) => setSelectedBranchId(v)}>
      <SelectTrigger className="h-8 w-[180px] text-xs">
        <Building2 className="mr-1 h-3.5 w-3.5 text-slate-500" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua Cabang</SelectItem>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}