export type Role = "cs" | "supervisor";
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