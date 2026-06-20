import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { calculateRFM } from "@/lib/rfm";
import { calculateCLV } from "@/lib/clv";
import { cadenceFor } from "@/lib/cadence";
import { canAccessCustomer } from "@/lib/permissions";

export function useCustomers() {
  const store = useStore();
  const agent = store.currentAgent;
  const enriched = useMemo(
    () =>
      store.customers
        .filter((c) => canAccessCustomer(agent, c))
        .map((c) => ({
          customer: c,
          rfm: calculateRFM(c),
          clv: calculateCLV(c),
          cadence: cadenceFor(c.purchases, c.cadenceOverrideDays),
        })),
    [store.customers, agent],
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