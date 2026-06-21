import type { SupabaseClient } from "@supabase/supabase-js";
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
import {
  agentToRow,
  assembleCustomers,
  auditToRow,
  customerToRow,
  exportToRow,
  fieldRuleToRow,
  messageToRow,
  purchaseToRow,
  rowToAgent,
  rowToAudit,
  rowToExport,
  rowToFieldRule,
  rowToMessage,
  rowToPurchase,
  rowToService,
  rowToShare,
  rowToTag,
  rowToTemplate,
  serviceToRow,
  shareToRow,
  tagToRow,
  templateToRow,
  type AppSnapshot,
} from "./mappers";

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchAppSnapshot(client: SupabaseClient): Promise<AppSnapshot> {
  const [
    agentsRes,
    customersRes,
    purchasesRes,
    sharesRes,
    messagesRes,
    servicesRes,
    templatesRes,
    tagsRes,
    auditRes,
    exportsRes,
    rulesRes,
  ] = await Promise.all([
    client.from("agents").select("*").order("name"),
    client.from("customers").select("*").order("name"),
    client.from("purchases").select("*").order("purchased_at"),
    client.from("manual_shares").select("*").order("created_at"),
    client.from("messages").select("*").order("sent_at"),
    client.from("services").select("*").order("name"),
    client.from("templates").select("*"),
    client.from("tags").select("*").order("name"),
    client.from("audit_log").select("*").order("logged_at", { ascending: false }),
    client.from("export_requests").select("*").order("requested_at", { ascending: false }),
    client.from("field_visibility_rules").select("*"),
  ]);

  for (const res of [
    agentsRes,
    customersRes,
    purchasesRes,
    sharesRes,
    messagesRes,
    servicesRes,
    templatesRes,
    tagsRes,
    auditRes,
    exportsRes,
    rulesRes,
  ]) {
    throwIf(res.error);
  }

  const purchasesByCustomer = new Map<string, Purchase[]>();
  for (const row of purchasesRes.data ?? []) {
    const p = rowToPurchase(row);
    const list = purchasesByCustomer.get(row.customer_id) ?? [];
    list.push(p);
    purchasesByCustomer.set(row.customer_id, list);
  }

  const sharesByCustomer = new Map<string, ManualShare[]>();
  for (const row of sharesRes.data ?? []) {
    const s = rowToShare(row);
    const list = sharesByCustomer.get(row.customer_id) ?? [];
    list.push(s);
    sharesByCustomer.set(row.customer_id, list);
  }

  const agentNames = new Map((agentsRes.data ?? []).map((a) => [a.id, a.name] as const));

  const customers = assembleCustomers(
    (customersRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      join_date: r.join_date,
      assigned_agent_id: r.assigned_agent_id,
      tags: r.tags,
      notes: r.notes,
      order_status: r.order_status,
      conversation_status: r.conversation_status,
      priority: r.priority,
      snooze_until: r.snooze_until,
      conversation_tags: r.conversation_tags,
      segment_history: r.segment_history,
      cadence_override_days: r.cadence_override_days,
    })),
    (customersRes.data ?? []).map((r) => purchasesByCustomer.get(r.id) ?? []),
    (customersRes.data ?? []).map((r) => sharesByCustomer.get(r.id) ?? []),
  );

  return {
    agents: (agentsRes.data ?? []).map(rowToAgent),
    customers,
    messages: (messagesRes.data ?? []).map(rowToMessage),
    services: (servicesRes.data ?? []).map(rowToService),
    templates: (templatesRes.data ?? []).map(rowToTemplate),
    tags: (tagsRes.data ?? []).map(rowToTag),
    auditLog: (auditRes.data ?? []).map(rowToAudit),
    exportRequests: (exportsRes.data ?? []).map((r) => rowToExport(r, agentNames)),
    fieldRules: (rulesRes.data ?? []).map(rowToFieldRule),
  };
}

export async function fetchAgentByAuthUserId(
  client: SupabaseClient,
  authUserId: string,
): Promise<Agent | null> {
  const { data, error } = await client
    .from("agents")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  throwIf(error);
  return data ? rowToAgent(data) : null;
}

export async function upsertAgent(client: SupabaseClient, agent: Agent) {
  throwIf((await client.from("agents").upsert(agentToRow(agent))).error);
}

export async function deleteAgentRow(client: SupabaseClient, id: string) {
  throwIf((await client.from("agents").delete().eq("id", id)).error);
}

export async function upsertCustomer(client: SupabaseClient, customer: Customer) {
  throwIf((await client.from("customers").upsert(customerToRow(customer))).error);
  throwIf((await client.from("purchases").delete().eq("customer_id", customer.id)).error);
  if (customer.purchases.length) {
    throwIf(
      (
        await client
          .from("purchases")
          .insert(customer.purchases.map((p) => purchaseToRow(p, customer.id)))
      ).error,
    );
  }
  throwIf((await client.from("manual_shares").delete().eq("customer_id", customer.id)).error);
  const shares = customer.manualShares ?? [];
  if (shares.length) {
    throwIf((await client.from("manual_shares").insert(shares.map(shareToRow))).error);
  }
}

export async function upsertMessage(client: SupabaseClient, message: Message) {
  throwIf((await client.from("messages").upsert(messageToRow(message))).error);
}

export async function upsertMessages(client: SupabaseClient, messages: Message[]) {
  if (!messages.length) return;
  throwIf((await client.from("messages").upsert(messages.map(messageToRow))).error);
}

export async function upsertService(client: SupabaseClient, service: Service) {
  throwIf((await client.from("services").upsert(serviceToRow(service))).error);
}

export async function deleteServiceRow(client: SupabaseClient, id: string) {
  throwIf((await client.from("services").delete().eq("id", id)).error);
}

export async function upsertTemplate(client: SupabaseClient, template: Template) {
  throwIf((await client.from("templates").upsert(templateToRow(template))).error);
}

export async function deleteTemplateRow(client: SupabaseClient, id: string) {
  throwIf((await client.from("templates").delete().eq("id", id)).error);
}

export async function upsertTag(client: SupabaseClient, tag: Tag) {
  throwIf((await client.from("tags").upsert(tagToRow(tag))).error);
}

export async function deleteTagRow(client: SupabaseClient, id: string) {
  throwIf((await client.from("tags").delete().eq("id", id)).error);
}

export async function insertAudit(client: SupabaseClient, entry: AuditLogEntry) {
  throwIf((await client.from("audit_log").insert(auditToRow(entry))).error);
}

export async function upsertExportRequest(client: SupabaseClient, req: ExportRequest) {
  throwIf((await client.from("export_requests").upsert(exportToRow(req))).error);
}

export async function upsertFieldRule(client: SupabaseClient, rule: FieldVisibilityRule) {
  throwIf((await client.from("field_visibility_rules").upsert(fieldRuleToRow(rule))).error);
}

export async function deleteFieldRuleRow(client: SupabaseClient, id: string) {
  throwIf((await client.from("field_visibility_rules").delete().eq("id", id)).error);
}

export async function wipeAppData(client: SupabaseClient) {
  throwIf((await client.from("messages").delete().neq("id", "")).error);
  throwIf((await client.from("manual_shares").delete().neq("id", "")).error);
  throwIf((await client.from("purchases").delete().neq("id", "")).error);
  throwIf((await client.from("customers").delete().neq("id", "")).error);
  throwIf((await client.from("audit_log").delete().neq("id", "")).error);
  throwIf((await client.from("export_requests").delete().neq("id", "")).error);
  throwIf((await client.from("field_visibility_rules").delete().neq("id", "")).error);
  throwIf((await client.from("agents").delete().neq("id", "")).error);
  throwIf((await client.from("services").delete().neq("id", "")).error);
  throwIf((await client.from("templates").delete().neq("id", "")).error);
  throwIf((await client.from("tags").delete().neq("id", "")).error);
}

/** Insert or update demo rows by id — does not delete existing data. */
export async function seedAppSnapshot(client: SupabaseClient, snapshot: AppSnapshot) {
  if (snapshot.agents.length) {
    throwIf(
      (await client.from("agents").upsert(snapshot.agents.map(agentToRow), { onConflict: "id" }))
        .error,
    );
  }
  if (snapshot.services.length) {
    throwIf(
      (
        await client
          .from("services")
          .upsert(snapshot.services.map(serviceToRow), { onConflict: "id" })
      ).error,
    );
  }
  if (snapshot.templates.length) {
    throwIf(
      (
        await client
          .from("templates")
          .upsert(snapshot.templates.map(templateToRow), { onConflict: "id" })
      ).error,
    );
  }
  if (snapshot.tags.length) {
    throwIf(
      (await client.from("tags").upsert(snapshot.tags.map(tagToRow), { onConflict: "id" })).error,
    );
  }
  if (snapshot.customers.length) {
    throwIf(
      (
        await client.from("customers").upsert(
          snapshot.customers.map((c) => customerToRow(c)),
          { onConflict: "id" },
        )
      ).error,
    );
    const allPurchases = snapshot.customers.flatMap((c) =>
      c.purchases.map((p) => purchaseToRow(p, c.id)),
    );
    if (allPurchases.length) {
      throwIf((await client.from("purchases").upsert(allPurchases, { onConflict: "id" })).error);
    }
    const allShares = snapshot.customers.flatMap((c) => (c.manualShares ?? []).map(shareToRow));
    if (allShares.length) {
      throwIf((await client.from("manual_shares").upsert(allShares, { onConflict: "id" })).error);
    }
  }
  if (snapshot.messages.length) {
    throwIf(
      (
        await client
          .from("messages")
          .upsert(snapshot.messages.map(messageToRow), { onConflict: "id" })
      ).error,
    );
  }
  if (snapshot.auditLog.length) {
    throwIf(
      (
        await client
          .from("audit_log")
          .upsert(snapshot.auditLog.map(auditToRow), { onConflict: "id" })
      ).error,
    );
  }
  if (snapshot.exportRequests.length) {
    throwIf(
      (
        await client.from("export_requests").upsert(snapshot.exportRequests.map(exportToRow), {
          onConflict: "id",
        })
      ).error,
    );
  }
  if (snapshot.fieldRules.length) {
    throwIf(
      (
        await client
          .from("field_visibility_rules")
          .upsert(snapshot.fieldRules.map(fieldRuleToRow), {
            onConflict: "id",
          })
      ).error,
    );
  }
}

export type { AppSnapshot };
