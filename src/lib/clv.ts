import type { Customer } from "@/types";

const NOW = new Date("2026-06-18T10:00:00Z");

export interface CLVResult {
  totalSpent: number;
  avgOrderValue: number;
  monthsSinceJoin: number;
  purchaseFrequencyPerMonth: number;
  projectedMonthlyValue: number;
  clv12months: number;
}

export function calculateCLV(customer: Customer, now: Date = NOW): CLVResult {
  const totalSpent = customer.purchases.reduce((s, p) => s + p.price, 0);
  const n = customer.purchases.length;
  const avgOrderValue = n > 0 ? totalSpent / n : 0;
  const joined = new Date(customer.joinDate);
  const monthsSinceJoin = Math.max(
    1,
    (now.getFullYear() - joined.getFullYear()) * 12 +
      (now.getMonth() - joined.getMonth()),
  );
  const purchaseFrequencyPerMonth = n / monthsSinceJoin;
  const projectedMonthlyValue = avgOrderValue * purchaseFrequencyPerMonth;
  const clv12months = projectedMonthlyValue * 12;
  return {
    totalSpent,
    avgOrderValue,
    monthsSinceJoin,
    purchaseFrequencyPerMonth,
    projectedMonthlyValue,
    clv12months,
  };
}