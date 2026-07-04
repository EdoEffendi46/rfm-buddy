import type { Agent } from "@/types";

export const AGENTS: Agent[] = [
  { id: "rina", name: "Rina", role: "cs", initials: "RI", color: "#0EA5E9", isOnline: true, branchId: "br-smg" },
  {
    id: "budi",
    name: "Budi",
    role: "cs",
    initials: "BU",
    color: "#8B5CF6",
    isOnline: false,
    permissionOverrides: { chat_reply: false, customer_edit_basic_info: false },
    internalNote: "Status: Training - akses dibatasi sementara oleh Admin pada 15 Jun 2026",
    branchId: "br-smg",
  },
  { id: "sari", name: "Sari", role: "cs", initials: "SA", color: "#EC4899", isOnline: true, branchId: "br-jpr" },
  {
    id: "admin",
    name: "Admin",
    role: "supervisor",
    initials: "AD",
    color: "#F59E0B",
    isOnline: true,
  },
  {
    id: "hartono",
    name: "Pak Hartono",
    role: "owner",
    initials: "PH",
    color: "#DC2626",
    isOnline: true,
  },
];
