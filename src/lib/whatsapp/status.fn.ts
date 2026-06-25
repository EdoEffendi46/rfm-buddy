import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdminClient } from "@/lib/supabase/admin.server";
import {
  getAppOrigin,
  getWhatsappPhoneNumberId,
  getWhatsappWebhookUrl,
  isWhatsappConfigured,
  maskCredential,
} from "@/lib/whatsapp/env.server";

export interface WhatsappConnectionStatus {
  configured: boolean;
  webhookUrl: string;
  appOrigin: string;
  phoneNumberIdMasked: string | null;
  connectedAt: string | null;
  phoneDisplay: string | null;
  hasAppSecret: boolean;
}

export const getWhatsappStatusServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<WhatsappConnectionStatus> => {
    const configured = isWhatsappConfigured();
    let connectedAt: string | null = null;
    let phoneDisplay: string | null = null;

    if (configured) {
      try {
        const admin = getSupabaseAdminClient();
        const { data } = await admin
          .from("instance_settings")
          .select("whatsapp_connected_at, whatsapp_phone_display")
          .eq("id", 1)
          .maybeSingle();
        connectedAt = data?.whatsapp_connected_at ?? null;
        phoneDisplay = data?.whatsapp_phone_display ?? null;
      } catch {
        /* instance_settings may not exist yet */
      }
    }

    return {
      configured,
      webhookUrl: getWhatsappWebhookUrl(),
      appOrigin: getAppOrigin(),
      phoneNumberIdMasked: maskCredential(getWhatsappPhoneNumberId()),
      connectedAt,
      phoneDisplay,
      hasAppSecret: Boolean(process.env.WHATSAPP_APP_SECRET?.trim()),
    };
  },
);
