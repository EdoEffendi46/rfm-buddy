export type Role = "cs" | "supervisor" | "owner";
export type RFMSegment =
  | "champions"
  | "loyal"
  | "at_risk"
  | "dormant"
  | "new"
  | "promising";
export type ConversationStatus = "open" | "resolved" | "snoozed";
export type OrderStatus = "dalam_proses" | "siap_diambil" | "selesai";
export type Priority = "high" | "normal" | "low";
export type MessageType = "text" | "internal_note";
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
}

export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  category: "laundry" | "salon";
}

export interface Purchase {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  price: number;
  notes?: string;
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
  | "customer_created" | "customer_edited" | "customer_deleted"
  | "customer_reassigned" | "phone_viewed_full" | "agent_role_changed"
  | "agent_created" | "agent_deactivated" | "agent_deleted"
  | "data_exported" | "export_requested" | "export_approved" | "export_denied"
  | "manual_share_created" | "manual_share_revoked"
  | "conversation_transferred" | "conversation_deleted_message"
  | "login" | "settings_changed";

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