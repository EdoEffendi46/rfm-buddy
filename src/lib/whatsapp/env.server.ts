/** Server-only WhatsApp / Meta Cloud API env. Never import from client components. */

const GRAPH_API_VERSION = "v21.0";

export function getWhatsappPhoneNumberId(): string | undefined {
  return process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || undefined;
}

export function getWhatsappAccessToken(): string | undefined {
  return process.env.WHATSAPP_ACCESS_TOKEN?.trim() || undefined;
}

export function getWhatsappAppSecret(): string | undefined {
  return process.env.WHATSAPP_APP_SECRET?.trim() || undefined;
}

export function getWhatsappVerifyToken(): string | undefined {
  return process.env.WHATSAPP_VERIFY_TOKEN?.trim() || undefined;
}

export function getAppOrigin(): string {
  return (
    process.env.VITE_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:8080"
  ).replace(/\/$/, "");
}

export function getWhatsappWebhookUrl(): string {
  return `${getAppOrigin()}/api/webhooks/whatsapp`;
}

export function isWhatsappConfigured(): boolean {
  const phoneId = getWhatsappPhoneNumberId();
  const token = getWhatsappAccessToken();
  const verify = getWhatsappVerifyToken();
  return Boolean(phoneId && token && verify);
}

export function getGraphApiBase(): string {
  const phoneId = getWhatsappPhoneNumberId();
  if (!phoneId) throw new Error("WHATSAPP_PHONE_NUMBER_ID belum dikonfigurasi");
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}`;
}

export function maskCredential(value: string | undefined, visible = 4): string | null {
  if (!value) return null;
  if (value.length <= visible) return "****";
  return `****${value.slice(-visible)}`;
}
