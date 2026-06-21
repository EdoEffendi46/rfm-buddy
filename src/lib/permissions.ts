import type { Role, Agent, Customer, PermissionFlags, PermissionFlag } from "@/types";
import { ROLE_DEFAULTS } from "@/data/roleDefaults";

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

/** Map legacy Permission strings → granular PermissionFlag. */
const LEGACY_TO_FLAG: Record<Permission, PermissionFlag> = {
  view_all_conversations: "chat_view_all_agents",
  view_unassigned: "chat_view_unassigned",
  reply_any_conversation: "chat_reply",
  delete_own_messages: "chat_delete_own_message",
  delete_any_messages: "chat_delete_any_message",
  transfer_any_conversation: "chat_transfer",
  view_all_customers: "customer_view_all_agents",
  edit_any_customer: "customer_edit_basic_info",
  delete_customer: "customer_delete",
  reassign_customer: "customer_edit_assigned_cs",
  view_aggregate_clv: "customer_view_clv_aggregate_portfolio",
  view_team_dashboard: "dashboard_view_team_stats",
  view_financial_aggregate: "dashboard_view_financial_summary",
  manage_agents: "settings_view_agent_list",
  change_agent_role: "settings_change_agent_role",
  delete_agent_account: "settings_delete_agent",
  manage_templates: "settings_create_template",
  manage_tags: "settings_create_tag",
  manage_services: "settings_create_service",
  manage_workflow_status: "settings_edit_order_status_labels",
  manage_sla_notifications: "settings_edit_sla_target",
  manage_business_hours: "settings_edit_business_hours",
  manage_billing: "settings_view_billing",
  view_audit_log: "settings_view_audit_log",
  export_data: "settings_request_export",
  export_without_approval: "settings_export_without_approval",
  approve_export_requests: "settings_approve_export_requests",
  manage_field_visibility_rules: "settings_view_field_rules",
  create_manual_share: "customer_create_manual_share",
  view_permission_history: "settings_view_permission_change_history",
};

/** Effective permissions = role defaults merged with the agent's overrides. */
export function getEffectivePermissions(agent: Agent | null | undefined): PermissionFlags {
  if (!agent) return ROLE_DEFAULTS.cs;
  const base = ROLE_DEFAULTS[agent.role];
  if (!agent.permissionOverrides) return base;
  return { ...base, ...agent.permissionOverrides };
}

/** Returns true if the agent currently has the granular flag. */
export function hasFlag(agent: Agent | null | undefined, flag: PermissionFlag): boolean {
  return getEffectivePermissions(agent)[flag] === true;
}

/**
 * Legacy hasPermission overload. Accepts either:
 *   - Role (string)   → uses role defaults, no overrides
 *   - Agent (object)  → uses effective permissions (with overrides)
 * The `Permission` legacy string is mapped to its modern flag.
 */
export function hasPermission(roleOrAgent: Role | Agent | undefined | null, p: Permission | PermissionFlag): boolean {
  if (!roleOrAgent) return false;
  const flag: PermissionFlag = (p in LEGACY_TO_FLAG)
    ? LEGACY_TO_FLAG[p as Permission]
    : (p as PermissionFlag);
  if (typeof roleOrAgent === "string") {
    return ROLE_DEFAULTS[roleOrAgent][flag] === true;
  }
  return hasFlag(roleOrAgent, flag);
}

/** Returns the diff between an agent's effective perms and their role default. */
export function diffOverrides(agent: Agent): Partial<PermissionFlags> {
  return agent.permissionOverrides ?? {};
}

/**
 * Apply overrides "safely" with respect to a granter's own permission ceiling.
 * A granter cannot enable a flag they themselves don't have.
 */
export function canGrantFlag(granter: Agent | null, flag: PermissionFlag, nextValue: boolean): boolean {
  if (!granter) return false;
  // Owner can always grant anything.
  if (granter.role === "owner") return true;
  // Turning a flag OFF is always allowed.
  if (nextValue === false) return true;
  return hasFlag(granter, flag);
}

/** Supervisor and owner — team-wide dashboard, unread, etc. */
export function isTeamView(role: Role | undefined | null): boolean {
  return hasPermission(role, "view_team_dashboard");
}

export const ROLE_LABELS: Record<Role, string> = {
  cs: "Customer Service",
  supervisor: "Supervisor",
  owner: "Owner",
};

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