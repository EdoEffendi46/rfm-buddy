import { z } from "zod";

export const inviteAgentSchema = z.object({
  accessToken: z.string().min(1),
  email: z.string().trim().email("Format email tidak valid"),
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  role: z.enum(["cs", "supervisor", "owner"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pilih warna avatar"),
  appOrigin: z.string().url("Origin tidak valid"),
});

export type InviteAgentInput = z.infer<typeof inviteAgentSchema>;
