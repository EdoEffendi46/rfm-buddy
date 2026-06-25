import { z } from "zod";

export const sendWhatsappMessageSchema = z.object({
  accessToken: z.string().min(1).optional(),
  customerId: z.string().min(1, "Customer wajib"),
  content: z.string().min(1, "Pesan wajib diisi").max(4096, "Pesan terlalu panjang"),
  messageId: z.string().min(1),
  senderId: z.string().min(1),
  senderName: z.string().min(1),
});

export type SendWhatsappMessageInput = z.infer<typeof sendWhatsappMessageSchema>;
