/** Fixed reference "now" for demo RFM/CLV/cadence and SLA calculations. */
export const DEMO_NOW = new Date("2026-06-18T10:00:00Z");

export function demoNowMs(): number {
  return DEMO_NOW.getTime();
}
