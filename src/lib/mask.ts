import type { Role } from "@/types";

/**
 * Format a raw Indonesian phone number to "0812-3456-7890" and mask the
 * middle group for non-supervisors. Raw digits should never be shown to
 * any role — always pass through this function at display time.
 */
export function maskPhone(phone: string, role: Role): string {
  const digits = phone.replace(/\D/g, "");
  const formatted =
    digits.length >= 11
      ? `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`
      : digits.length >= 8
        ? `${digits.slice(0, 4)}-${digits.slice(4, digits.length - 4)}-${digits.slice(-4)}`
        : phone;
  if (role === "supervisor") return formatted;
  const parts = formatted.split("-");
  if (parts.length !== 3) return formatted;
  return `${parts[0]}-****-${parts[2]}`;
}