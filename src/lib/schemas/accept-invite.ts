import { z } from "zod";

export const acceptInviteFormSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export const completeInviteSchema = z.object({
  accessToken: z.string().min(1),
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
});

export type AcceptInviteFormInput = z.infer<typeof acceptInviteFormSchema>;
export type CompleteInviteInput = z.infer<typeof completeInviteSchema>;
