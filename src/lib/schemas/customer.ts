import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  phone: z
    .string()
    .trim()
    .min(10, "Nomor HP minimal 10 digit")
    .max(15, "Nomor HP terlalu panjang")
    .regex(/^[\d+\-\s()]+$/, "Format nomor HP tidak valid"),
  agentId: z.string().min(1, "Pilih CS"),
  tagsInput: z.string(),
  notes: z.string(),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

export function parseCustomerCreateTags(tagsInput: string | undefined): string[] {
  if (!tagsInput?.trim()) return [];
  return tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
