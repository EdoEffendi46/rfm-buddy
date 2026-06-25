import { getGraphApiBase, getWhatsappAccessToken } from "./env.server";

export interface SendTextResult {
  waMessageId: string;
}

export async function sendWhatsappTextMessage(
  toWaId: string,
  body: string,
): Promise<SendTextResult> {
  const token = getWhatsappAccessToken();
  if (!token) throw new Error("WHATSAPP_ACCESS_TOKEN belum dikonfigurasi");

  const url = `${getGraphApiBase()}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toWaId,
      type: "text",
      text: { preview_url: false, body },
    }),
  });

  const payload: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { message?: string } }).error?.message === "string"
        ? (payload as { error: { message: string } }).error.message
        : `Meta API error (${res.status})`;
    throw new Error(errMsg);
  }

  const waMessageId =
    typeof payload === "object" &&
    payload !== null &&
    "messages" in payload &&
    Array.isArray((payload as { messages?: { id?: string }[] }).messages)
      ? (payload as { messages: { id?: string }[] }).messages[0]?.id
      : undefined;

  if (!waMessageId) throw new Error("Meta API tidak mengembalikan message id");
  return { waMessageId };
}
