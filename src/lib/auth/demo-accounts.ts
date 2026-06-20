import type { Role } from "@/types";

/** Demo credentials — seeded via `bun run db:seed` */
export const DEMO_PASSWORD = "Demo1234!";

export interface DemoAccount {
  agentId: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  color: string;
  initials: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    agentId: "rina",
    email: "rina@chatcrm.demo",
    password: DEMO_PASSWORD,
    name: "Rina",
    role: "cs",
    color: "#0EA5E9",
    initials: "RI",
  },
  {
    agentId: "budi",
    email: "budi@chatcrm.demo",
    password: DEMO_PASSWORD,
    name: "Budi",
    role: "cs",
    color: "#8B5CF6",
    initials: "BU",
  },
  {
    agentId: "sari",
    email: "sari@chatcrm.demo",
    password: DEMO_PASSWORD,
    name: "Sari",
    role: "cs",
    color: "#EC4899",
    initials: "SA",
  },
  {
    agentId: "admin",
    email: "admin@chatcrm.demo",
    password: DEMO_PASSWORD,
    name: "Admin",
    role: "supervisor",
    color: "#F59E0B",
    initials: "AD",
  },
  {
    agentId: "hartono",
    email: "hartono@chatcrm.demo",
    password: DEMO_PASSWORD,
    name: "Pak Hartono",
    role: "owner",
    color: "#DC2626",
    initials: "PH",
  },
];
