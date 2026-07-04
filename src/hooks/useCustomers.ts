import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { calculateRFM } from "@/lib/rfm";
import { calculateCLV } from "@/lib/clv";
import { cadenceFor } from "@/lib/cadence";
import { canViewConversation, hasPermission } from "@/lib/permissions";

export function useCustomers() {
  const store = useStore();
  const agent = store.currentAgent;
  const branchFilter = store.selectedBranchId;
  const canFilterBranch = hasPermission(agent, "branch_view_all");
  const enriched = useMemo(
    () =>
      store.customers
        .filter((c) => canViewConversation(agent, c))
        .filter((c) =>
          canFilterBranch && branchFilter !== "all" ? c.branchId === branchFilter : true,
        )
        .map((c) => ({
          customer: c,
          rfm: calculateRFM(c),
          clv: calculateCLV(c),
          cadence: cadenceFor(c.purchases, c.cadenceOverrideDays),
        })),
    [store.customers, agent, branchFilter, canFilterBranch],
  );
  // Unfiltered for supervisor/admin views that need totals beyond own scope
  const enrichedAll = useMemo(
    () =>
      store.customers.map((c) => ({
        customer: c,
        rfm: calculateRFM(c),
        clv: calculateCLV(c),
        cadence: cadenceFor(c.purchases, c.cadenceOverrideDays),
      })),
    [store.customers],
  );
  return { enriched, enrichedAll, ...store };
}
