import type { Customer, RFMSegment } from "@/types";
import { DEMO_NOW } from "./demo";

const NOW = DEMO_NOW;

function scoreRecency(days: number): number {
  if (days <= 7) return 5;
  if (days <= 14) return 4;
  if (days <= 30) return 3;
  if (days <= 60) return 2;
  return 1;
}
function scoreFrequency(n: number): number {
  if (n >= 8) return 5;
  if (n >= 5) return 4;
  if (n >= 3) return 3;
  if (n >= 2) return 2;
  return 1;
}
function scoreMonetary(m: number): number {
  if (m >= 1_500_000) return 5;
  if (m >= 800_000) return 4;
  if (m >= 400_000) return 3;
  if (m >= 150_000) return 2;
  return 1;
}

export function getSegment(r: number, f: number, m: number): RFMSegment {
  if (r >= 4 && f >= 4 && m >= 4) return "champions";
  if (f >= 4 && m >= 3) return "loyal";
  if (r >= 4 && f <= 2) {
    if (f === 1) return "new";
    return "promising";
  }
  if (r <= 2 && f >= 3) return "at_risk";
  if (f === 1 && r >= 4) return "new";
  if (r <= 2) return "dormant";
  return "promising";
}

export interface RFMResult {
  r: number;
  f: number;
  m: number;
  total: number;
  recencyDays: number;
  frequency: number;
  monetary: number;
  segment: RFMSegment;
}

export function calculateRFM(customer: Customer, now: Date = NOW): RFMResult {
  const purchases = customer.purchases;
  const monetary = purchases.reduce((s, p) => s + p.price, 0);
  const frequency = purchases.length;
  let recencyDays = 9999;
  if (purchases.length > 0) {
    const last = Math.max(...purchases.map((p) => new Date(p.date).getTime()));
    recencyDays = Math.floor((now.getTime() - last) / 86400000);
  }
  const r = scoreRecency(recencyDays);
  const f = scoreFrequency(frequency);
  const m = scoreMonetary(monetary);
  return {
    r,
    f,
    m,
    total: r + f + m,
    recencyDays,
    frequency,
    monetary,
    segment: getSegment(r, f, m),
  };
}

export const SEGMENT_META: Record<
  RFMSegment,
  { label: string; color: string; description: string }
> = {
  champions: {
    label: "Champions",
    color: "#7C3AED",
    description: "Customer terbaik - sering order, nilai tinggi, transaksi baru.",
  },
  loyal: {
    label: "Loyal",
    color: "#F97316",
    description: "Pelanggan setia dengan frekuensi tinggi.",
  },
  promising: {
    label: "Promising",
    color: "#3B82F6",
    description: "Baru aktif, potensi tumbuh jadi loyal.",
  },
  at_risk: {
    label: "At Risk",
    color: "#EF4444",
    description: "Pernah aktif namun mulai jauh - perlu follow up segera.",
  },
  new: {
    label: "New",
    color: "#22C55E",
    description: "Customer baru, transaksi pertama dalam minggu ini.",
  },
  dormant: {
    label: "Dormant",
    color: "#94A3B8",
    description: "Tidak ada transaksi dalam waktu lama.",
  },
};

export function getSegmentColor(s: RFMSegment) {
  return SEGMENT_META[s].color;
}
export function getSegmentLabel(s: RFMSegment) {
  return SEGMENT_META[s].label;
}
