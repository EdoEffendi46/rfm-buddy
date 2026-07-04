import { Building2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/lib/store";
import { hasPermission } from "@/lib/permissions";
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
    const branch = branches.find((b) => b.id === agent.branchId);
    if (!branch) return null;
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600">
        <MapPin className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium text-slate-700">{branch.name}</span>
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