import { z } from "zod";

export const inviteAgentFormSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  role: z.enum(["cs", "supervisor", "owner"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pilih warna avatar"),
});

export const inviteAgentSchema = inviteAgentFormSchema.extend({
  accessToken: z.string().min(1),
  appOrigin: z.string().url("Origin tidak valid"),
});

export const inviteActionSchema = z.object({
  accessToken: z.string().min(1),
  agentId: z.string().min(1),
  appOrigin: z.string().url("Origin tidak valid"),
});

export type InviteAgentFormInput = z.infer<typeof inviteAgentFormSchema>;
export type InviteAgentInput = z.infer<typeof inviteAgentSchema>;
export type InviteActionInput = z.infer<typeof inviteActionSchema>;
