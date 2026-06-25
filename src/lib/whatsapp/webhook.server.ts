import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";
import {
  getWhatsappAppSecret,
  getWhatsappVerifyToken,
  isWhatsappConfigured,
} from "@/lib/whatsapp/env.server";
import {
  markWhatsappConnected,
  processInboundTextMessage,
  processMessageStatusUpdate,
} from "@/lib/whatsapp/inbound.server";

const WEBHOOK_PATH = "/api/webhooks/whatsapp";

export { WEBHOOK_PATH };

async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expectedHex = signatureHeader.slice(7);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const digestHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (digestHex.length !== expectedHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < digestHex.length; i++) {
    mismatch |= digestHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return mismatch === 0;
}

function handleVerification(request: Request): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = getWhatsappVerifyToken();

  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return new Response("Forbidden", { status: 403 });
}

interface WaWebhookPayload {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: {
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }[];
        statuses?: { id?: string; status?: string; timestamp?: string }[];
      };
    }[];
  }[];
}

async function processWebhookPayload(admin: SupabaseClient, payload: WaWebhookPayload) {
  if (payload.object !== "whatsapp_business_account") return;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value || value.messaging_product !== "whatsapp") continue;

      const phoneDisplay = value.metadata?.display_phone_number;
      if (phoneDisplay) {
        await markWhatsappConnected(admin, phoneDisplay);
      }

      const contactName = value.contacts?.[0]?.profile?.name;

      for (const msg of value.messages ?? []) {
        if (msg.type !== "text" || !msg.from || !msg.id || !msg.text?.body || !msg.timestamp)
          continue;
        await processInboundTextMessage(admin, {
          waId: msg.from,
          waMessageId: msg.id,
          body: msg.text.body,
          timestampSec: msg.timestamp,
          profileName: contactName,
        });
      }

      for (const st of value.statuses ?? []) {
        if (!st.id || !st.status) continue;
        await processMessageStatusUpdate(admin, st.id, st.status);
      }
    }
  }
}

export async function handleWhatsappWebhook(request: Request): Promise<Response> {
  if (!isWhatsappConfigured()) {
    return Response.json({ error: "WhatsApp belum dikonfigurasi di server" }, { status: 503 });
  }

  if (request.method === "GET") {
    return handleVerification(request);
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await request.text();
  const appSecret = getWhatsappAppSecret();

  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    const valid = await verifyMetaSignature(rawBody, signature, appSecret);
    if (!valid) {
      console.warn("[whatsapp] Invalid webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let payload: WaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WaWebhookPayload;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const admin = getSupabaseAdminClient();
    await processWebhookPayload(admin, payload);
  } catch (err) {
    console.error("[whatsapp] Webhook processing error:", err);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
