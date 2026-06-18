import type { Role } from "@/types";

export function maskPhone(phone: string, role: Role): string {
  if (role === "supervisor") return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;
  const start = digits.slice(0, 4);
  const end = digits.slice(-4);
  return `${start}-****-${end}`;
}