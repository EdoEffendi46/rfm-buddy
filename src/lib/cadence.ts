import type { Purchase } from "@/types";

export type CadenceLabel =
  | "harian"
  | "mingguan"
  | "dua_mingguan"
  | "bulanan"
  | "tidak_tentu";

export interface CadenceResult {
  avgDaysBetweenOrders: number | null;
  effectiveDaysBetweenOrders: number | null;
  label: CadenceLabel;
  isManualOverride: boolean;
  manualOverrideDays: number | null;
  predictedNextOrderDate: string | null;
  daysUntilPredicted: number | null;
  confidence: "high" | "medium" | "low";
  gaps: number[];
  lastOrderDate: string | null;
}

const LABELS: { max: number; label: CadenceLabel }[] = [
  { max: 3, label: "harian" },
  { max: 10, label: "mingguan" },
  { max: 20, label: "dua_mingguan" },
  { max: 45, label: "bulanan" },
];

export const CADENCE_LABEL_TEXT: Record<CadenceLabel, string> = {
  harian: "Harian",
  mingguan: "Mingguan",
  dua_mingguan: "2 Minggu",
  bulanan: "Bulanan",
  tidak_tentu: "Tidak Tentu",
};

export function labelForDays(days: number, variance: number): CadenceLabel {
  // very high variance relative to mean = unpredictable
  if (days > 0 && variance / days > 0.6 && days > 7) return "tidak_tentu";
  for (const l of LABELS) if (days <= l.max) return l.label;
  return "tidak_tentu";
}

export function calculateCadence(
  purchases: Purchase[],
  now: Date = new Date(),
): CadenceResult {
  const sorted = [...purchases].sort((a, b) => a.date.localeCompare(b.date));
  const lastOrderDate = sorted.length ? sorted[sorted.length - 1].date : null;
  const manualOverrideDays =
    typeof (purchases as any)._override === "number" ? (purchases as any)._override : null;

  if (sorted.length < 2) {
    return {
      avgDaysBetweenOrders: null,
      effectiveDaysBetweenOrders: null,
      label: "tidak_tentu",
      isManualOverride: false,
      manualOverrideDays: null,
      predictedNextOrderDate: null,
      daysUntilPredicted: null,
      confidence: "low",
      gaps: [],
      lastOrderDate,
    };
  }

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1].date).getTime();
    const b = new Date(sorted[i].date).getTime();
    gaps.push(Math.max(1, Math.round((b - a) / 86400000)));
  }
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const variance = Math.sqrt(
    gaps.reduce((s, g) => s + (g - avg) ** 2, 0) / gaps.length,
  );
  const cv = avg > 0 ? variance / avg : 1; // coefficient of variation
  const confidence: CadenceResult["confidence"] =
    cv < 0.25 ? "high" : cv < 0.5 ? "medium" : "low";
  const label = labelForDays(avg, variance);

  return {
    avgDaysBetweenOrders: Math.round(avg),
    effectiveDaysBetweenOrders: Math.round(avg),
    label,
    isManualOverride: false,
    manualOverrideDays: null,
    predictedNextOrderDate: lastOrderDate
      ? new Date(new Date(lastOrderDate).getTime() + avg * 86400000).toISOString()
      : null,
    daysUntilPredicted: lastOrderDate
      ? Math.round(
          (new Date(lastOrderDate).getTime() + avg * 86400000 - now.getTime()) /
            86400000,
        )
      : null,
    confidence,
    gaps,
    lastOrderDate,
  };
}

export function applyManualOverride(
  base: CadenceResult,
  overrideDays: number | null | undefined,
  now: Date = new Date(),
): CadenceResult {
  if (!overrideDays || overrideDays <= 0 || !base.lastOrderDate) {
    return { ...base, manualOverrideDays: overrideDays ?? null, isManualOverride: false };
  }
  const predicted = new Date(
    new Date(base.lastOrderDate).getTime() + overrideDays * 86400000,
  ).toISOString();
  return {
    ...base,
    isManualOverride: true,
    manualOverrideDays: overrideDays,
    effectiveDaysBetweenOrders: overrideDays,
    label: labelForDays(overrideDays, 0),
    predictedNextOrderDate: predicted,
    daysUntilPredicted: Math.round(
      (new Date(predicted).getTime() - now.getTime()) / 86400000,
    ),
  };
}

export function cadenceFor(
  purchases: Purchase[],
  overrideDays?: number,
  now: Date = new Date(),
): CadenceResult {
  return applyManualOverride(calculateCadence(purchases, now), overrideDays, now);
}