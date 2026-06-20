import type { Role, Agent, Customer } from "@/types";

export type Permission =
  | "view_all_conversations" | "view_unassigned" | "reply_any_conversation"
  | "delete_own_messages" | "delete_any_messages" | "transfer_any_conversation"
  | "view_all_customers" | "edit_any_customer" | "delete_customer"
  | "reassign_customer" | "view_aggregate_clv" | "view_team_dashboard"
  | "view_financial_aggregate" | "manage_agents" | "change_agent_role"
  | "delete_agent_account" | "manage_templates" | "manage_tags"
  | "manage_services" | "manage_workflow_status" | "manage_sla_notifications"
  | "manage_business_hours" | "manage_billing"
  | "view_audit_log" | "export_data" | "export_without_approval"
  | "approve_export_requests" | "manage_field_visibility_rules"
  | "create_manual_share" | "view_permission_history";

const SUPERVISOR_PERMS: Permission[] = [
  "view_all_conversations", "view_unassigned", "reply_any_conversation",
  "delete_own_messages", "delete_any_messages", "transfer_any_conversation",
  "view_all_customers", "edit_any_customer", "delete_customer", "reassign_customer",
  "view_aggregate_clv", "view_team_dashboard", "view_financial_aggregate",
  "manage_agents", "change_agent_role", "manage_templates", "manage_tags",
  "manage_services", "manage_workflow_status", "manage_sla_notifications",
  "manage_business_hours", "view_audit_log", "export_data",
  "create_manual_share",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  cs: ["delete_own_messages"],
  supervisor: SUPERVISOR_PERMS,
  owner: [
    ...SUPERVISOR_PERMS,
    "delete_agent_account", "manage_billing", "export_without_approval",
    "approve_export_requests", "manage_field_visibility_rules", "view_permission_history",
  ],
};

export function hasPermission(role: Role | undefined | null, p: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(p);
}

/** Supervisor and owner — team-wide dashboard, unread, etc. */
export function isTeamView(role: Role | undefined | null): boolean {
  return hasPermission(role, "view_team_dashboard");
}

export const ROLE_DISPLAY: Record<
  Role,
  { subtitle: string; badgeClass: string; dashboardSubtitle: string }
> = {
  cs: {
    subtitle: "CS — akses terbatas",
    badgeClass: "bg-sky-100 text-sky-700",
    dashboardSubtitle: "Ringkasan customer & percakapan yang ditugaskan untukmu.",
  },
  supervisor: {
    subtitle: "Supervisor — akses penuh",
    badgeClass: "bg-amber-100 text-amber-700",
    dashboardSubtitle: "Ringkasan performa tim, segmentasi RFM & follow-up.",
  },
  owner: {
    subtitle: "Owner — billing & approval",
    badgeClass: "bg-red-100 text-red-700",
    dashboardSubtitle: "Ringkasan performa tim, segmentasi RFM & follow-up.",
  },
};

function shareActiveFor(c: Customer, agentId: string): { permission: "view" | "edit"; sharedByAgentId: string } | null {
  if (!c.manualShares?.length) return null;
  const now = Date.now();
  const s = c.manualShares.find(
    (s) => s.sharedWithAgentId === agentId && (!s.expiresAt || new Date(s.expiresAt).getTime() > now),
  );
  return s ? { permission: s.permission, sharedByAgentId: s.sharedByAgentId } : null;
}

export function canAccessCustomer(agent: Agent | null, c: Customer): boolean {
  if (!agent) return false;
  if (agent.role !== "cs") return true;
  if (c.assignedAgentId === agent.id) return true;
  if (!c.assignedAgentId) return true;
  if (shareActiveFor(c, agent.id)) return true;
  return false;
}

export function canEditCustomer(agent: Agent | null, c: Customer): boolean {
  if (!agent) return false;
  if (agent.role !== "cs") return true;
  if (c.assignedAgentId === agent.id) return true;
  const s = shareActiveFor(c, agent.id);
  return s?.permission === "edit";
}

/** Returns active share metadata if `agent` accesses `c` via a manual share (not primary assignment). */
export function shareBadgeFor(agent: Agent | null, c: Customer): { sharedByAgentId: string; permission: "view" | "edit" } | null {
  if (!agent || agent.role !== "cs") return null;
  if (c.assignedAgentId === agent.id) return null;
  return shareActiveFor(c, agent.id);
}

/** True if the current viewer should be blocked from seeing this audit entry. */
export function canViewAuditEntry(viewerRole: Role, entryActorRole: Role, action: string): boolean {
  if (viewerRole === "owner") return true;
  if (viewerRole !== "supervisor") return false;
  // Supervisor cannot see Owner-only actions
  if (entryActorRole === "owner" && (
    action === "export_approved" || action === "export_denied" ||
    action === "settings_changed" || action === "manage_billing" ||
    action === "agent_role_changed" || action === "agent_deleted"
  )) return false;
  return true;
}