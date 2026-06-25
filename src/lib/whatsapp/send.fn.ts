import { createServerFn } from "@tanstack/react-start";
import type { Message } from "@/types";
import { sendWhatsappMessageSchema } from "@/lib/schemas/whatsapp";
import { messageToRow, rowToMessage } from "@/lib/supabase/mappers";
import { getAgentForAccessToken, getSupabaseAdminClient } from "@/lib/supabase/admin.server";
import { sendWhatsappTextMessage } from "@/lib/whatsapp/client.server";
import { isWhatsappConfigured } from "@/lib/whatsapp/env.server";
import { normalizePhoneToWaId } from "@/lib/whatsapp/normalize-phone";

function throwIfDb(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const sendWhatsappMessageServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => sendWhatsappMessageSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdminClient();

    if (data.accessToken) {
      const agent = await getAgentForAccessToken(data.accessToken);
      if (!agent) throw new Error("Sesi tidak valid");
    }

    const { data: customerRow, error: custErr } = await admin
      .from("customers")
      .select("*")
      .eq("id", data.customerId)
      .maybeSingle();
    throwIfDb(custErr);
    if (!customerRow) throw new Error("Customer tidak ditemukan");

    const waId = customerRow.wa_id ?? normalizePhoneToWaId(customerRow.phone);
    if (!waId) throw new Error("Nomor HP customer tidak valid untuk WhatsApp");

    let waMessageId: string | undefined;
    const channel: Message["channel"] = isWhatsappConfigured() ? "whatsapp" : "internal";

    if (isWhatsappConfigured()) {
      const result = await sendWhatsappTextMessage(waId, data.content);
      waMessageId = result.waMessageId;
    }

    const message: Message = {
      id: data.messageId,
      customerId: data.customerId,
      senderId: data.senderId,
      senderName: data.senderName,
      content: data.content,
      timestamp: new Date().toISOString(),
      readStatus: channel === "whatsapp" ? "sent" : "read",
      type: "text",
      channel,
      waMessageId,
    };

    const { error: insertErr } = await admin.from("messages").upsert(messageToRow(message));
    throwIfDb(insertErr);

    if (!customerRow.wa_id) {
      await admin.from("customers").update({ wa_id: waId }).eq("id", data.customerId);
    }

    return rowToMessage({
      id: message.id,
      customer_id: message.customerId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      content: message.content,
      sent_at: message.timestamp,
      read_status: message.readStatus,
      type: message.type,
      channel: message.channel,
      wa_message_id: message.waMessageId ?? null,
    });
  });
