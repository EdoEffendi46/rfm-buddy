import type {
  Agent,
  AuditLogEntry,
  Customer,
  ExportRequest,
  FieldVisibilityRule,
  ManualShare,
  Message,
  Purchase,
  Service,
  Tag,
  Template,
} from "@/types";

export interface AppSnapshot {
  agents: Agent[];
  customers: Customer[];
  messages: Message[];
  services: Service[];
  templates: Template[];
  tags: Tag[];
  auditLog: AuditLogEntry[];
  exportRequests: ExportRequest[];
  fieldRules: FieldVisibilityRule[];
}

export function agentToRow(a: Agent) {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    initials: a.initials,
    color: a.color,
    is_online: a.isOnline,
    ...(a.email != null ? { email: a.email } : {}),
    ...(a.invitationStatus != null ? { invitation_status: a.invitationStatus } : {}),
    ...(a.invitationSentAt != null ? { invitation_sent_at: a.invitationSentAt } : {}),
  };
}

export function rowToAgent(r: {
  id: string;
  name: string;
  role: Agent["role"];
  initials: string;
  color: string;
  is_online: boolean;
  email?: string | null;
  invitation_status?: "pending" | "active" | null;
  invitation_sent_at?: string | null;
}): Agent {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    initials: r.initials,
    color: r.color,
    isOnline: r.is_online,
    email: r.email ?? null,
    invitationStatus: r.invitation_status ?? "active",
    invitationSentAt: r.invitation_sent_at ?? null,
  };
}

export function serviceToRow(s: Service) {
  return {
    id: s.id,
    name: s.name,
    default_price: s.defaultPrice,
    category: s.category,
  };
}

export function rowToService(r: {
  id: string;
  name: string;
  default_price: number;
  category: Service["category"];
}): Service {
  return { id: r.id, name: r.name, defaultPrice: Number(r.default_price), category: r.category };
}

export function templateToRow(t: Template) {
  return { id: t.id, text: t.text };
}

export function rowToTemplate(r: { id: string; text: string }): Template {
  return { id: r.id, text: r.text };
}

export function tagToRow(t: Tag) {
  return { id: t.id, name: t.name, color: t.color, scope: t.scope };
}

export function rowToTag(r: { id: string; name: string; color: string; scope: Tag["scope"] }): Tag {
  return { id: r.id, name: r.name, color: r.color, scope: r.scope };
}

export function customerToRow(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    wa_id: c.waId ?? null,
    join_date: c.joinDate,
    assigned_agent_id: c.assignedAgentId || null,
    tags: c.tags,
    notes: c.notes,
    order_status: c.orderStatus,
    conversation_status: c.conversationStatus,
    priority: c.priority,
    snooze_until: c.snoozeUntil ?? null,
    conversation_tags: c.conversationTags,
    segment_history: c.segmentHistory,
    cadence_override_days: c.cadenceOverrideDays ?? null,
  };
}

export function purchaseToRow(p: Purchase, customerId: string) {
  return {
    id: p.id,
    customer_id: customerId,
    service_id: p.serviceId || null,
    service_name: p.serviceName,
    purchased_at: p.date,
    price: p.price,
    notes: p.notes ?? null,
  };
}

export function rowToPurchase(r: {
  id: string;
  service_id: string | null;
  service_name: string;
  purchased_at: string;
  price: number;
  notes: string | null;
}): Purchase {
  return {
    id: r.id,
    serviceId: r.service_id ?? "",
    serviceName: r.service_name,
    date: r.purchased_at,
    price: Number(r.price),
    notes: r.notes ?? undefined,
  };
}

export function shareToRow(s: ManualShare) {
  return {
    id: s.id,
    customer_id: s.customerId,
    shared_with_agent_id: s.sharedWithAgentId,
    shared_by_agent_id: s.sharedByAgentId,
    permission: s.permission,
    reason: s.reason,
    expires_at: s.expiresAt ?? null,
    created_at: s.createdAt,
  };
}

export function rowToShare(r: {
  id: string;
  customer_id: string;
  shared_with_agent_id: string;
  shared_by_agent_id: string;
  permission: ManualShare["permission"];
  reason: string;
  expires_at: string | null;
  created_at: string;
}): ManualShare {
  return {
    id: r.id,
    customerId: r.customer_id,
    sharedWithAgentId: r.shared_with_agent_id,
    sharedByAgentId: r.shared_by_agent_id,
    permission: r.permission,
    reason: r.reason,
    expiresAt: r.expires_at ?? undefined,
    createdAt: r.created_at,
  };
}

export function messageToRow(m: Message) {
  return {
    id: m.id,
    customer_id: m.customerId,
    sender_id: m.senderId,
    sender_name: m.senderName,
    content: m.content,
    sent_at: m.timestamp,
    read_status: m.readStatus,
    type: m.type,
    channel: m.channel ?? "internal",
    ...(m.waMessageId != null ? { wa_message_id: m.waMessageId } : {}),
  };
}

export function rowToMessage(r: {
  id: string;
  customer_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  sent_at: string;
  read_status: Message["readStatus"];
  type: Message["type"];
  channel?: Message["channel"];
  wa_message_id?: string | null;
}): Message {
  return {
    id: r.id,
    customerId: r.customer_id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    content: r.content,
    timestamp: r.sent_at,
    readStatus: r.read_status,
    type: r.type,
    channel: r.channel ?? "internal",
    waMessageId: r.wa_message_id ?? undefined,
  };
}

export function auditToRow(e: AuditLogEntry) {
  return {
    id: e.id,
    logged_at: e.timestamp,
    actor_id: e.actorId,
    actor_name: e.actorName,
    actor_role: e.actorRole,
    action: e.action,
    target_type: e.targetType,
    target_id: e.targetId,
    target_label: e.targetLabel,
    old_value: e.oldValue ?? null,
    new_value: e.newValue ?? null,
    details: e.details ?? null,
  };
}

export function rowToAudit(r: {
  id: string;
  logged_at: string;
  actor_id: string;
  actor_name: string;
  actor_role: AuditLogEntry["actorRole"];
  action: AuditLogEntry["action"];
  target_type: AuditLogEntry["targetType"];
  target_id: string;
  target_label: string;
  old_value: string | null;
  new_value: string | null;
  details: string | null;
}): AuditLogEntry {
  return {
    id: r.id,
    timestamp: r.logged_at,
    actorId: r.actor_id,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    targetLabel: r.target_label,
    oldValue: r.old_value ?? undefined,
    newValue: r.new_value ?? undefined,
    details: r.details ?? undefined,
  };
}

export function exportToRow(r: ExportRequest) {
  return {
    id: r.id,
    requested_by_agent_id: r.requestedByAgentId,
    data_type: r.dataType,
    reason: r.reason,
    status: r.status,
    requested_at: r.requestedAt,
    resolved_at: r.reviewedAt ?? null,
    resolved_by_agent_id: r.reviewedByAgentId ?? null,
    resolution_note: r.reviewNote ?? null,
  };
}

export function rowToExport(
  r: {
    id: string;
    requested_by_agent_id: string;
    data_type: ExportRequest["dataType"];
    reason: string;
    status: ExportRequest["status"];
    requested_at: string;
    resolved_at: string | null;
    resolved_by_agent_id: string | null;
    resolution_note: string | null;
  },
  agentNames: Map<string, string>,
): ExportRequest {
  return {
    id: r.id,
    requestedByAgentId: r.requested_by_agent_id,
    requestedByName: agentNames.get(r.requested_by_agent_id) ?? "",
    dataType: r.data_type,
    reason: r.reason,
    status: r.status,
    requestedAt: r.requested_at,
    reviewedAt: r.resolved_at ?? undefined,
    reviewedByAgentId: r.resolved_by_agent_id ?? undefined,
    reviewNote: r.resolution_note ?? undefined,
    reviewedByName: r.resolved_by_agent_id ? agentNames.get(r.resolved_by_agent_id) : undefined,
  };
}

export function fieldRuleToRow(r: FieldVisibilityRule) {
  return {
    id: r.id,
    field_name: r.fieldName,
    entity_type: r.entityType,
    hidden_for_roles: r.hiddenForRoles,
    mask_pattern: r.maskPattern ?? "full_hide",
    locked: r.locked ?? false,
  };
}

export function rowToFieldRule(r: {
  id: string;
  field_name: string;
  entity_type: FieldVisibilityRule["entityType"];
  hidden_for_roles: FieldVisibilityRule["hiddenForRoles"];
  mask_pattern: FieldVisibilityRule["maskPattern"];
  locked: boolean;
}): FieldVisibilityRule {
  return {
    id: r.id,
    fieldName: r.field_name,
    entityType: r.entity_type,
    hiddenForRoles: r.hidden_for_roles,
    maskPattern: r.mask_pattern,
    locked: r.locked,
  };
}

export function assembleCustomers(
  rows: ReturnType<typeof customerToRow>[],
  purchases: Purchase[][],
  shares: ManualShare[][],
): Customer[] {
  return rows.map((row, i) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    waId: row.wa_id ?? undefined,
    joinDate: row.join_date,
    assignedAgentId: row.assigned_agent_id ?? "",
    tags: row.tags ?? [],
    notes: row.notes ?? "",
    orderStatus: row.order_status,
    conversationStatus: row.conversation_status,
    priority: row.priority,
    snoozeUntil: row.snooze_until ?? undefined,
    conversationTags: row.conversation_tags ?? [],
    segmentHistory: row.segment_history ?? [],
    cadenceOverrideDays: row.cadence_override_days ?? undefined,
    purchases: purchases[i] ?? [],
    manualShares: shares[i]?.length ? shares[i] : undefined,
  }));
}
