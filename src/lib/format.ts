export function formatRupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID").replace(/,/g, ".");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}

export function relativeDay(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return formatDate(iso);
}

export function daysBetween(iso: string, now = new Date()): number {
  const d = new Date(iso);
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

export function isoDaysAgo(days: number, base = new Date("2026-06-18T10:00:00Z")): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function isoHoursAgo(hours: number, base = new Date("2026-06-18T10:00:00Z")): string {
  const d = new Date(base);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}