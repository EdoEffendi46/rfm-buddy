import type { SupabaseClient } from "@supabase/supabase-js";
import type { Customer, Message, ReadStatus } from "@/types";
import { customerToRow, messageToRow } from "@/lib/supabase/mappers";
import { normalizePhoneToWaId, waIdToLocalDisplay } from "@/lib/whatsapp/normalize-phone";

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapWaStatus(status: string): ReadStatus {
  switch (status) {
    case "read":
      return "read";
    case "delivered":
      return "delivered";
    case "sent":
      return "sent";
    default:
      return "sent";
  }
}

async function findCustomerByWaId(admin: SupabaseClient, waId: string) {
  const { data: byWa, error: waErr } = await admin
    .from("customers")
    .select("*")
    .eq("wa_id", waId)
    .maybeSingle();
  if (waErr) throw waErr;
  if (byWa) return byWa;

  const localPhone = waIdToLocalDisplay(waId);
  const { data: rows, error: phoneErr } = await admin.from("customers").select("*");
  if (phoneErr) throw phoneErr;

  return (
    rows?.find((row) => {
      const rowWa = row.wa_id ?? normalizePhoneToWaId(row.phone);
      return rowWa === waId || normalizePhoneToWaId(row.phone) === waId || row.phone === localPhone;
    }) ?? null
  );
}

async function ensureCustomer(
  admin: SupabaseClient,
  waId: string,
  profileName?: string,
): Promise<{ id: string; name: string }> {
  const existing = await findCustomerByWaId(admin, waId);
  if (existing) {
    if (!existing.wa_id) {
      await admin.from("customers").update({ wa_id: waId }).eq("id", existing.id);
    }
    return { id: existing.id, name: existing.name };
  }

  const id = `c-wa-${waId}`;
  const name = profileName?.trim() || waIdToLocalDisplay(waId);
  const phone = waIdToLocalDisplay(waId);
  const now = new Date().toISOString();

  const customer: Customer = {
    id,
    name,
    phone,
    waId,
    joinDate: now,
    assignedAgentId: "",
    purchases: [],
    tags: [],
    notes: "",
    orderStatus: "dalam_proses",
    conversationStatus: "open",
    priority: "normal",
    conversationTags: [],
    segmentHistory: [],
  };

  const { error } = await admin.from("customers").insert(customerToRow(customer));
  if (error) throw error;
  return { id, name };
}

export async function processInboundTextMessage(
  admin: SupabaseClient,
  input: {
    waId: string;
    waMessageId: string;
    body: string;
    timestampSec: string;
    profileName?: string;
  },
): Promise<void> {
  const { data: existing } = await admin
    .from("messages")
    .select("id")
    .eq("wa_message_id", input.waMessageId)
    .maybeSingle();
  if (existing) return;

  const customer = await ensureCustomer(admin, input.waId, input.profileName);
  const sentAt = new Date(Number(input.timestampSec) * 1000).toISOString();

  const message: Message = {
    id: genId("m"),
    customerId: customer.id,
    senderId: customer.id,
    senderName: customer.name,
    content: input.body,
    timestamp: sentAt,
    readStatus: "delivered",
    type: "text",
    channel: "whatsapp",
    waMessageId: input.waMessageId,
  };

  const { error: msgErr } = await admin.from("messages").insert(messageToRow(message));
  if (msgErr) throw msgErr;

  await admin
    .from("customers")
    .update({
      conversation_status: "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", customer.id);
}

export async function processMessageStatusUpdate(
  admin: SupabaseClient,
  waMessageId: string,
  status: string,
): Promise<void> {
  const readStatus = mapWaStatus(status);
  const { error } = await admin
    .from("messages")
    .update({ read_status: readStatus })
    .eq("wa_message_id", waMessageId);
  if (error) throw error;
}

export async function markWhatsappConnected(
  admin: SupabaseClient,
  phoneDisplay?: string,
): Promise<void> {
  await admin.from("instance_settings").upsert({
    id: 1,
    whatsapp_connected_at: new Date().toISOString(),
    ...(phoneDisplay ? { whatsapp_phone_display: phoneDisplay } : {}),
  });
}

export { normalizePhoneToWaId, findCustomerByWaId };
