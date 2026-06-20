import type { ExportRequest } from "@/types";
import { isoDaysAgo } from "@/lib/format";

export const INITIAL_EXPORT_REQUESTS: ExportRequest[] = [
  {
    id: "exp-pending-1",
    requestedByAgentId: "admin",
    requestedByName: "Admin",
    requestedAt: isoDaysAgo(1),
    dataType: "customers",
    reason: "Persiapan rapat strategi bulanan dengan tim manajemen.",
    status: "pending",
  },
  {
    id: "exp-1",
    requestedByAgentId: "admin",
    requestedByName: "Admin",
    requestedAt: isoDaysAgo(7),
    dataType: "customers",
    reason: "Audit triwulanan Q2 2026.",
    status: "approved",
    reviewedByAgentId: "hartono",
    reviewedByName: "Pak Hartono",
    reviewedAt: isoDaysAgo(6),
    reviewNote: "Disetujui untuk keperluan audit.",
  },
  {
    id: "exp-2",
    requestedByAgentId: "admin",
    requestedByName: "Admin",
    requestedAt: isoDaysAgo(3),
    dataType: "financial_report",
    reason: "Laporan keuangan untuk owner.",
    status: "denied",
    reviewedByAgentId: "hartono",
    reviewedByName: "Pak Hartono",
    reviewedAt: isoDaysAgo(2),
    reviewNote: "Belum saatnya diekspor, tunggu close bulanan.",
  },
];