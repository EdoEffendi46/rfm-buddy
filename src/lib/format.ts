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

/**
 * Returns a short Indonesian relative duration like "5 menit", "2 jam",
 * "3 hari" representing the gap between `iso` and now (or `now`).
 * Always positive; caller decides if it means "ago" or "from now".
 */
export function relativeTime(iso: string, now = new Date()): string {
  const diffMs = Math.abs(now.getTime() - new Date(iso).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} hari`;
  const months = Math.floor(days / 30);
  return `${months} bulan`;
}

export function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}