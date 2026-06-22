import type { Service } from "@/types";

export type BusinessType = "jasa" | "retail" | "fnb" | "campuran";

export interface BusinessProfile {
  type: BusinessType;
  usesSKU: boolean;
  usesVariants: boolean;
  usesStock: boolean;
  usesServiceDuration: boolean;
  defaultTaxEnabled: boolean;
  defaultTaxRate: number;
}

export const BUSINESS_TYPE_LABEL: Record<BusinessType, string> = {
  jasa: "🧺 Jasa (Laundry/Salon/dst)",
  retail: "🛍️ Retail (Barang Fisik)",
  fnb: "🍽️ F&B (Makanan/Minuman)",
  campuran: "🧩 Campuran (Semua Jenis)",
};

export const BUSINESS_TYPE_SHORT: Record<BusinessType, string> = {
  jasa: "Mode: Jasa",
  retail: "Mode: Retail",
  fnb: "Mode: F&B",
  campuran: "Mode: Campuran",
};

export function defaultProfileFor(type: BusinessType): BusinessProfile {
  switch (type) {
    case "retail":
      return {
        type,
        usesSKU: true,
        usesVariants: true,
        usesStock: true,
        usesServiceDuration: false,
        defaultTaxEnabled: true,
        defaultTaxRate: 11,
      };
    case "fnb":
      return {
        type,
        usesSKU: false,
        usesVariants: true,
        usesStock: false,
        usesServiceDuration: false,
        defaultTaxEnabled: true,
        defaultTaxRate: 11,
      };
    case "campuran":
      return {
        type,
        usesSKU: true,
        usesVariants: true,
        usesStock: true,
        usesServiceDuration: true,
        defaultTaxEnabled: true,
        defaultTaxRate: 11,
      };
    case "jasa":
    default:
      return {
        type: "jasa",
        usesSKU: false,
        usesVariants: false,
        usesStock: false,
        usesServiceDuration: true,
        defaultTaxEnabled: false,
        defaultTaxRate: 11,
      };
  }
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = defaultProfileFor("jasa");

export function unitFor(service: Pick<Service, "unit" | "category">): string {
  if (service.unit) return service.unit;
  return "pcs";
}

export function generateOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rnd = String(Math.floor(Math.random() * 900) + 100);
  return `ORD-${y}${m}${d}-${rnd}`;
}

const KEY = "chatcrm:business-profile";

export function loadBusinessProfile(): BusinessProfile {
  if (typeof window === "undefined") return DEFAULT_BUSINESS_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BUSINESS_PROFILE;
    return { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUSINESS_PROFILE;
  }
}

export function saveBusinessProfile(p: BusinessProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
