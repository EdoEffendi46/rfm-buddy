import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { calculateRFM } from "@/lib/rfm";
import { calculateCLV } from "@/lib/clv";
import { cadenceFor } from "@/lib/cadence";

export function useCustomers() {
  const store = useStore();
  const enriched = useMemo(
    () =>
      store.customers.map((c) => ({
        customer: c,
        rfm: calculateRFM(c),
        clv: calculateCLV(c),
        cadence: cadenceFor(c.purchases, c.cadenceOverrideDays),
      })),
    [store.customers],
  );
  return { enriched, ...store };
}