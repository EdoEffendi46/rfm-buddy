import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AgentAvatar } from "@/components/Avatar";
import { ChevronDown, ChevronRight, Lock, RotateCcw, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getEffectivePermissions, hasFlag, canGrantFlag,
} from "@/lib/permissions";
import { ROLE_DEFAULTS, FLAG_LABELS, FLAG_GROUPS, ALL_FLAGS } from "@/data/roleDefaults";
import type { Agent, PermissionFlag, PermissionFlags } from "@/types";

type Draft = Partial<PermissionFlags>;

const ROLE_LABEL: Record<string, string> = { cs: "CS", supervisor: "Supervisor", owner: "Owner" };

export function PermissionManager({
  agent, open, onClose,
}: {
  agent: Agent | null;
  open: boolean;
  onClose: () => void;
}) {
  const { agent: viewer } = useAuth();
  const { setAgentPermissionOverrides, resetAgentPermissionOverrides } = useStore();

  const roleDefault = agent ? ROLE_DEFAULTS[agent.role] : ROLE_DEFAULTS.cs;
  const [draft, setDraft] = useState<Draft>(agent?.permissionOverrides ?? {});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    chat: true, customer: false, dashboard: false, settings: false,
  });

  // Reset draft when opening a different agent.
  const draftKey = agent?.id ?? "";
  const [lastKey, setLastKey] = useState("");
  if (draftKey !== lastKey) {
    setLastKey(draftKey);
    setDraft(agent?.permissionOverrides ?? {});
  }

  const effective = useMemo<PermissionFlags>(() => ({ ...roleDefault, ...draft }), [roleDefault, draft]);

  if (!agent) return null;

  const overrideCount = Object.keys(draft).filter(
    (k) => draft[k as PermissionFlag] !== roleDefault[k as PermissionFlag],
  ).length;
  const defaultCount = ALL_FLAGS.length - overrideCount;
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(agent.permissionOverrides ?? {});

  const setFlag = (flag: PermissionFlag, value: boolean) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (value === roleDefault[flag]) {
        delete next[flag];
      } else {
        next[flag] = value;
      }
      return next;
    });
  };

  const resetFlag = (flag: PermissionFlag) => {
    setDraft((prev) => {
      const next = { ...prev };
      delete next[flag];
      return next;
    });
  };

  const applyPreset = (preset: "readonly" | "trainee" | "full") => {
    const next: Draft = {};
    if (preset === "readonly") {
      ALL_FLAGS.forEach((f) => {
        const writeish = /^(chat_(reply|write|delete|add|remove|change|assign|reassign|transfer|snooze|mark|reopen)|customer_(create|edit|delete|add|remove|override|create_manual|revoke)|settings_(create|edit|delete|change|deactivate|override|toggle|reorder|approve|request|export)|dashboard_)/.test(f);
        if (writeish && roleDefault[f]) next[f] = false;
      });
    } else if (preset === "trainee") {
      // CS baseline minus dangerous ops.
      ["chat_delete_any_message","chat_transfer","chat_reassign_to_others",
        "customer_delete","customer_edit_assigned_cs"].forEach((f) => {
        if (roleDefault[f as PermissionFlag]) next[f as PermissionFlag] = false;
      });
    } else if (preset === "full") {
      // Reset to role default.
    }
    setDraft(next);
    toast.info("Preset diterapkan - tinjau sebelum simpan");
  };

  const handleSave = () => {
    // Filter draft to only changes that the viewer is allowed to grant.
    const allowed: Draft = {};
    const blocked: PermissionFlag[] = [];
    (Object.keys(draft) as PermissionFlag[]).forEach((f) => {
      const v = draft[f]!;
      if (canGrantFlag(viewer, f, v)) allowed[f] = v;
      else blocked.push(f);
    });
    const changedFlags = (Object.keys(allowed) as PermissionFlag[]).filter(
      (f) => (agent.permissionOverrides?.[f] ?? roleDefault[f]) !== allowed[f],
    );
    const summary = changedFlags.length
      ? `Mengubah ${changedFlags.length} izin untuk ${agent.name}: ` +
        changedFlags.slice(0, 3).map((f) => {
          const before = (agent.permissionOverrides?.[f] ?? roleDefault[f]) ? "Aktif" : "Nonaktif";
          const after = allowed[f] ? "Aktif" : "Nonaktif";
          return `${FLAG_LABELS[f]} (${before}→${after})`;
        }).join(", ") + (changedFlags.length > 3 ? "…" : "")
      : `Izin ${agent.name} tidak berubah`;
    setAgentPermissionOverrides(agent.id, allowed, summary);
    toast.success(`Izin ${agent.name} berhasil diperbarui`);
    if (blocked.length) {
      toast.warning(`${blocked.length} izin diabaikan - di luar kewenangan Anda`);
    }
    onClose();
  };

  const handleResetAll = () => {
    if (!confirm(`Reset semua izin ${agent.name} ke default role ${ROLE_LABEL[agent.role]}?`)) return;
    resetAgentPermissionOverrides(agent.id);
    toast.success(`Izin ${agent.name} direset`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AgentAvatar agent={agent} size={40} />
            <div className="flex-1">
              <div>Kelola Izin - {agent.name}</div>
              <div className="mt-1 text-xs font-normal text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase">{ROLE_LABEL[agent.role]}</span>
                <span className="ml-2">Menggunakan: {defaultCount} default, {overrideCount} override manual</span>
              </div>
            </div>
            <Select onValueChange={(v) => applyPreset(v as "readonly" | "trainee" | "full")}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Preset cepat..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="readonly">Read-Only Observer</SelectItem>
                <SelectItem value="trainee">Trainee CS</SelectItem>
                <SelectItem value="full">Full Access (role default)</SelectItem>
              </SelectContent>
            </Select>
          </DialogTitle>
        </DialogHeader>

        {agent.internalNote && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{agent.internalNote}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {FLAG_GROUPS.map((group) => {
            const isOpen = openGroups[group.id];
            const groupOverrides = group.flags.filter(
              (f) => draft[f] !== undefined && draft[f] !== roleDefault[f],
            ).length;
            return (
              <div key={group.id} className="rounded-xl border border-slate-200 bg-white">
                <button
                  onClick={() => setOpenGroups((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="font-semibold text-sm">{group.label}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    {groupOverrides > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                        {groupOverrides} override
                      </span>
                    )}
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {group.flags.map((flag) => {
                      const value = effective[flag];
                      const isOverridden = draft[flag] !== undefined && draft[flag] !== roleDefault[flag];
                      const wouldBeNext = !value;
                      const lockedByCeiling = !canGrantFlag(viewer, flag, wouldBeNext);
                      return (
                        <div key={flag} className="flex items-center justify-between gap-3 px-4 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm">{FLAG_LABELS[flag]}</div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                              {isOverridden ? (
                                <>
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">
                                    Override
                                  </span>
                                  <button
                                    onClick={() => resetFlag(flag)}
                                    className="inline-flex items-center gap-0.5 text-slate-500 hover:text-slate-700"
                                  >
                                    <RotateCcw className="h-2.5 w-2.5" /> Reset ke default
                                  </button>
                                </>
                              ) : (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-500">
                                  Default {ROLE_LABEL[agent.role]}
                                </span>
                              )}
                              <span className="font-mono text-slate-300">{flag}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lockedByCeiling && (
                              <span title="Anda tidak punya izin ini, tidak bisa memberikannya">
                                <Lock className="h-3.5 w-3.5 text-slate-400" />
                              </span>
                            )}
                            <Switch
                              checked={value}
                              disabled={lockedByCeiling}
                              onCheckedChange={(v) => setFlag(flag, v)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={handleResetAll} className="text-red-600 hover:bg-red-50">
            <RotateCcw className="h-4 w-4" /> Reset Semua ke Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button
              disabled={!hasChanges}
              onClick={handleSave}
              className={cn("bg-[#25D366] text-white hover:bg-[#128C7E]", !hasChanges && "opacity-50")}
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}