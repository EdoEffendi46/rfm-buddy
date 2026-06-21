import { z } from "zod";

export const completeSetupFormSchema = z
  .object({
    businessName: z.string().trim().min(2, "Nama bisnis minimal 2 karakter"),
    ownerName: z.string().trim().min(2, "Nama owner minimal 2 karakter"),
    email: z.string().trim().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    setupToken: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export const completeSetupSchema = completeSetupFormSchema;

export type CompleteSetupFormInput = z.infer<typeof completeSetupFormSchema>;
export type CompleteSetupInput = z.infer<typeof completeSetupSchema>;
