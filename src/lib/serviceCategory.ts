const BADGE_PALETTE = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
] as const;

/** Consistent badge color for any service category label. */
export function categoryBadgeClass(category: string): string {
  let h = 0;
  for (let i = 0; i < category.length; i++) {
    h = (h + category.charCodeAt(i)) % BADGE_PALETTE.length;
  }
  return BADGE_PALETTE[h];
}
