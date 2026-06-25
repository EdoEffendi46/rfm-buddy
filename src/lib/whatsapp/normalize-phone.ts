/** Normalize Indonesian phone numbers to WhatsApp E.164 digits (no +). */

export function normalizePhoneToWaId(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;

  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
}

/** Display format for UI: 62812... → 0812... */
export function waIdToLocalDisplay(waId: string): string {
  if (waId.startsWith("62")) return `0${waId.slice(2)}`;
  return waId;
}

export function phonesMatch(a: string, b: string): boolean {
  const waA = normalizePhoneToWaId(a);
  const waB = normalizePhoneToWaId(b);
  if (!waA || !waB) return false;
  return waA === waB;
}
