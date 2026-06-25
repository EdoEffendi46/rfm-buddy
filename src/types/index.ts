export type Role = "cs" | "supervisor" | "owner";
export type RFMSegment = "champions" | "loyal" | "at_risk" | "dormant" | "new" | "promising";
export type ConversationStatus = "open" | "resolved" | "snoozed";
export type OrderStatus = "dalam_proses" | "siap_diambil" | "selesai";
export type Priority = "high" | "normal" | "low";
export type MessageType = "text" | "internal_note";
export type MessageChannel = "internal" | "whatsapp";
export type ReadStatus = "sent" | "delivered" | "read";

export interface Agent {
  id: string;
  name: string;
  role: Role;
  initials: string;
  color: string;
  isOnline: boolean;
  email?: string | null;
  invitationStatus?: "pending" | "active";
  invitationSentAt?: string | null;
  /** Only the flags that differ from the role default. */
  permissionOverrides?: Partial<PermissionFlags>;
  /** Free-form internal note shown on the agent profile (training status, etc.). */
  internalNote?: string;
}

export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  category: string;
  /** Stock-keeping unit (retail). */
  sku?: string;
  /** Available stock; undefined = not tracked / unlimited. */
  stockQty?: number;
  /** Warn when stock falls at/below this. */
  lowStockThreshold?: number;
  /** Unit label shown next to qty (kg, pcs, jam, porsi, paket, ...). */
  unit?: string;
  /** Item has variant choices (size, sugar level, color, ...). */
  hasVariants?: boolean;
  variantOptions?: { name: string; choices: string[] }[];
  /** For services: estimated duration in minutes. */
  estimatedDurationMinutes?: number;
  /** Whether the item is subject to PPN. Defaults to true. */
  taxable?: boolean;
}

export interface Purchase {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  price: number;
  notes?: string;
  // Order Builder (all optional; legacy seed purchases skip these)
  orderNumber?: string;
  transactionType?: "penjualan_langsung" | "pesanan_proses" | "reservasi";
  variantSelections?: Record<string, string>;
  qty?: number;
  unit?: string;
  discountAmount?: number;
  taxAmount?: number;
  additionalFees?: { name: string; amount: number; taxable?: boolean }[];
  paymentMethod?: string;
  paymentDueDate?: string;
  paymentTerm?: string;
  depositPaid?: number;
  remainingBalance?: number;
  deliveryRequired?: boolean;
  deliveryAddress?: string;
  deliveryAt?: string;
  customerFacingNote?: string;
  internalNote?: string;
  source?: "chat_generated" | "seed_data" | "manual";
  /** Snapshot of all line items if the purchase came from the Order Builder. */
  items?: {
    serviceId: string;
    name: string;
    qty: number;
    unit?: string;
    unitPrice: number;
    variantSelections?: Record<string, string>;
    taxable?: boolean;
    subtotal: number;
  }[];
}

export interface SegmentHistoryEntry {
  date: string;
  fromSegment: RFMSegment | null;
  toSegment: RFMSegment;
  reason: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  /** Normalized WhatsApp id (E.164 digits without +). Set when synced from WA. */
  waId?: string;
  joinDate: string;
  assignedAgentId: string;
  purchases: Purchase[];
  tags: string[];
  notes: string;
  orderStatus: OrderStatus;
  conversationStatus: ConversationStatus;
  priority: Priority;
  snoozeUntil?: string;
  conversationTags: string[];
  segmentHistory: SegmentHistoryEntry[];
  /** Manual cadence override (days between orders) set by CS/Admin. */
  cadenceOverrideDays?: number;
  /** Manual record shares (Salesforce-style record sharing). */
  manualShares?: ManualShare[];
}

export interface Message {
  id: string;
  customerId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  readStatus: ReadStatus;
  type: MessageType;
  /** internal = demo/inbox-only; whatsapp = synced with Meta Cloud API */
  channel?: MessageChannel;
  /** Meta wamid — used for delivery/read status webhooks */
  waMessageId?: string;
}

export interface Template {
  id: string;
  text: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  scope: "customer" | "conversation";
}

export interface ManualShare {
  id: string;
  customerId: string;
  sharedWithAgentId: string;
  sharedByAgentId: string;
  permission: "view" | "edit";
  reason: string;
  expiresAt?: string;
  createdAt: string;
}

export type AuditAction =
  | "customer_created"
  | "customer_edited"
  | "customer_deleted"
  | "customer_reassigned"
  | "phone_viewed_full"
  | "agent_role_changed"
  | "agent_created"
  | "agent_deactivated"
  | "agent_deleted"
  | "data_exported"
  | "export_requested"
  | "export_approved"
  | "export_denied"
  | "manual_share_created"
  | "manual_share_revoked"
  | "conversation_transferred"
  | "conversation_deleted_message"
  | "login"
  | "settings_changed"
  | "permission_override_changed"
  | "permission_overrides_reset";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: AuditAction;
  targetType: "customer" | "agent" | "conversation" | "system";
  targetId: string;
  targetLabel: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface ExportRequest {
  id: string;
  requestedByAgentId: string;
  requestedByName: string;
  requestedAt: string;
  dataType: "customers" | "conversations" | "financial_report";
  reason: string;
  status: "pending" | "approved" | "denied";
  reviewedByAgentId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface FieldVisibilityRule {
  id: string;
  fieldName: string;
  entityType: "customer";
  hiddenForRoles: Role[];
  maskPattern?: "phone" | "currency_range" | "full_hide";
  locked?: boolean;
}

/**
 * Granular permission flags. Every interactive action in the app maps to
 * exactly one flag. Role defaults live in `src/data/roleDefaults.ts`;
 * individual overrides live on the Agent record.
 */
export interface PermissionFlags {
  // === CHAT & CONVERSATION ===
  chat_view_assigned: boolean;
  chat_view_unassigned: boolean;
  chat_view_all_agents: boolean;
  chat_reply: boolean;
  chat_write_internal_note: boolean;
  chat_delete_own_message: boolean;
  chat_delete_any_message: boolean;
  chat_add_conversation_tag: boolean;
  chat_remove_conversation_tag: boolean;
  chat_change_order_status: boolean;
  chat_change_priority: boolean;
  chat_assign_to_self: boolean;
  chat_reassign_to_others: boolean;
  chat_transfer: boolean;
  chat_snooze: boolean;
  chat_mark_resolved: boolean;
  chat_reopen_resolved: boolean;
  chat_use_quick_reply: boolean;
  chat_view_sla_indicator: boolean;

  // === CUSTOMER / CRM ===
  customer_view_assigned: boolean;
  customer_view_unassigned: boolean;
  customer_view_all_agents: boolean;
  customer_view_phone_masked: boolean;
  customer_view_phone_full: boolean;
  customer_create: boolean;
  customer_edit_basic_info: boolean;
  customer_edit_assigned_cs: boolean;
  customer_delete: boolean;
  customer_add_tag: boolean;
  customer_remove_tag: boolean;
  customer_edit_notes: boolean;
  customer_view_purchase_history: boolean;
  customer_add_purchase_manual: boolean;
  customer_edit_purchase: boolean;
  customer_delete_purchase: boolean;
  customer_view_rfm_score: boolean;
  customer_view_clv: boolean;
  customer_view_clv_aggregate_portfolio: boolean;
  customer_override_cadence: boolean;
  customer_view_segment_history: boolean;
  customer_create_manual_share: boolean;
  customer_revoke_manual_share: boolean;

  // === DASHBOARD ===
  dashboard_view_own_stats: boolean;
  dashboard_view_team_stats: boolean;
  dashboard_view_rfm_chart: boolean;
  dashboard_view_spending_trend: boolean;
  dashboard_view_followup_priority_table: boolean;
  dashboard_view_cs_performance_table: boolean;
  dashboard_view_financial_summary: boolean;

  // === SETTINGS: Profile ===
  settings_edit_own_profile: boolean;
  settings_toggle_own_online_status: boolean;

  // === SETTINGS: Agent Management ===
  settings_view_agent_list: boolean;
  settings_create_agent: boolean;
  settings_edit_agent_info: boolean;
  settings_change_agent_role: boolean;
  settings_deactivate_agent: boolean;
  settings_delete_agent: boolean;
  settings_override_agent_permissions: boolean;

  // === SETTINGS: Templates ===
  settings_use_quick_reply_template: boolean;
  settings_create_template: boolean;
  settings_edit_template: boolean;
  settings_delete_template: boolean;
  settings_reorder_template: boolean;

  // === SETTINGS: Tags ===
  settings_view_tags: boolean;
  settings_create_tag: boolean;
  settings_delete_tag: boolean;

  // === SETTINGS: Services ===
  settings_view_services: boolean;
  settings_create_service: boolean;
  settings_edit_service_price: boolean;
  settings_delete_service: boolean;

  // === SETTINGS: Workflow ===
  settings_view_status_reference: boolean;
  settings_edit_order_status_labels: boolean;

  // === SETTINGS: SLA & Notifications ===
  settings_view_sla_config: boolean;
  settings_edit_sla_target: boolean;
  settings_toggle_notifications: boolean;

  // === SETTINGS: Business Hours ===
  settings_view_business_hours: boolean;
  settings_edit_business_hours: boolean;
  settings_edit_autoreply_text: boolean;

  // === SETTINGS: Field Visibility ===
  settings_view_field_rules: boolean;
  settings_create_field_rule: boolean;
  settings_delete_field_rule: boolean;

  // === SETTINGS: Audit ===
  settings_view_audit_log: boolean;
  settings_view_audit_log_owner_actions: boolean;
  settings_export_audit_log: boolean;
  settings_view_permission_change_history: boolean;

  // === SETTINGS: Export ===
  settings_request_export: boolean;
  settings_export_without_approval: boolean;
  settings_approve_export_requests: boolean;

  // === SETTINGS: Billing ===
  settings_view_billing: boolean;
  settings_edit_billing: boolean;
}

export type PermissionFlag = keyof PermissionFlags;
