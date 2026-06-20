import { getSupabaseBrowserClient } from "./client";
import {
  deleteAgentRow,
  deleteFieldRuleRow,
  deleteServiceRow,
  deleteTagRow,
  deleteTemplateRow,
  fetchAppSnapshot,
  insertAudit,
  upsertAgent,
  upsertCustomer,
  upsertExportRequest,
  upsertFieldRule,
  upsertMessage,
  upsertMessages,
  upsertService,
  upsertTag,
  upsertTemplate,
} from "./repository";
import type {
  Agent,
  AuditLogEntry,
  Customer,
  ExportRequest,
  FieldVisibilityRule,
  Message,
  Service,
  Tag,
  Template,
} from "@/types";
import { isSupabaseConfigured } from "./env";

function clientOrNull() {
  return getSupabaseBrowserClient();
}

function fire(p: Promise<void>, label: string) {
  p.catch((err) => console.warn(`[supabase] ${label}:`, err instanceof Error ? err.message : err));
}

export { fetchAppSnapshot, isSupabaseConfigured };

export function persistAgent(agent: Agent) {
  const c = clientOrNull();
  if (c) fire(upsertAgent(c, agent), "upsertAgent");
}

export function persistAgentDelete(id: string) {
  const c = clientOrNull();
  if (c) fire(deleteAgentRow(c, id), "deleteAgent");
}

export function persistCustomer(customer: Customer) {
  const c = clientOrNull();
  if (c) fire(upsertCustomer(c, customer), "upsertCustomer");
}

export function persistMessage(message: Message) {
  const c = clientOrNull();
  if (c) fire(upsertMessage(c, message), "upsertMessage");
}

export function persistMessages(messages: Message[]) {
  const c = clientOrNull();
  if (c) fire(upsertMessages(c, messages), "upsertMessages");
}

export function persistService(service: Service) {
  const c = clientOrNull();
  if (c) fire(upsertService(c, service), "upsertService");
}

export function persistServiceDelete(id: string) {
  const c = clientOrNull();
  if (c) fire(deleteServiceRow(c, id), "deleteService");
}

export function persistTemplate(template: Template) {
  const c = clientOrNull();
  if (c) fire(upsertTemplate(c, template), "upsertTemplate");
}

export function persistTemplateDelete(id: string) {
  const c = clientOrNull();
  if (c) fire(deleteTemplateRow(c, id), "deleteTemplate");
}

export function persistTag(tag: Tag) {
  const c = clientOrNull();
  if (c) fire(upsertTag(c, tag), "upsertTag");
}

export function persistTagDelete(id: string) {
  const c = clientOrNull();
  if (c) fire(deleteTagRow(c, id), "deleteTag");
}

export function persistAudit(entry: AuditLogEntry) {
  const c = clientOrNull();
  if (c) fire(insertAudit(c, entry), "insertAudit");
}

export function persistExportRequest(req: ExportRequest) {
  const c = clientOrNull();
  if (c) fire(upsertExportRequest(c, req), "upsertExportRequest");
}

export function persistFieldRule(rule: FieldVisibilityRule) {
  const c = clientOrNull();
  if (c) fire(upsertFieldRule(c, rule), "upsertFieldRule");
}

export function persistFieldRuleDelete(id: string) {
  const c = clientOrNull();
  if (c) fire(deleteFieldRuleRow(c, id), "deleteFieldRule");
}

const SESSION_KEY = "chatcrm_current_agent_id";

export function loadSessionAgentId(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function saveSessionAgentId(id: string | null) {
  if (typeof sessionStorage === "undefined") return;
  if (id) sessionStorage.setItem(SESSION_KEY, id);
  else sessionStorage.removeItem(SESSION_KEY);
}
