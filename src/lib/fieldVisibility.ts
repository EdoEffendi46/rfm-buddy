import type { Role, FieldVisibilityRule } from "@/types";
import { maskPhone } from "./mask";

export const DEFAULT_FIELD_RULES: FieldVisibilityRule[] = [
  {
    id: "rule-phone",
    fieldName: "phone",
    entityType: "customer",
    hiddenForRoles: ["cs"],
    maskPattern: "phone",
    locked: true,
  },
];

export function getFieldDisplay(
  fieldName: string,
  value: string | number,
  role: Role,
  rules: FieldVisibilityRule[] = DEFAULT_FIELD_RULES,
): string {
  const rule = rules.find((r) => r.fieldName === fieldName && r.hiddenForRoles.includes(role));
  if (!rule) {
    if (fieldName === "phone") return maskPhone(String(value), role);
    return String(value);
  }
  switch (rule.maskPattern) {
    case "phone": return maskPhone(String(value), role);
    case "currency_range": return "Rp •••";
    case "full_hide":
    default: return "•••";
  }
}

export const AVAILABLE_FIELDS: { value: string; label: string }[] = [
  { value: "phone", label: "Nomor HP" },
  { value: "totalSpent", label: "Total Pengeluaran" },
  { value: "notes", label: "Catatan Internal" },
];