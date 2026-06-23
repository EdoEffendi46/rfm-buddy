import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authErrorMessage, useAuthContext } from "@/lib/auth/AuthProvider";
import { useAuthCallbackReady } from "@/hooks/useAuthCallbackReady";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password — ChatCRM" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const { setNewPassword } = useAuthContext();
  const { ready, checking } = useAuthCallbackReady();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setSubmitting(true);
    try {
      await setNewPassword(values.password);
      toast.success("Password berhasil diperbarui.");
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  if (!ready) {
    return (
      <AuthLayout
        title="Link tidak valid"
        subtitle="Link reset password kadaluarsa atau sudah dipakai."
      >
        <Link to="/forgot-password">
          <Button className="w-full bg-[#16A34A] hover:bg-[#15803D]">Minta link baru</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Password baru" subtitle="Buat password baru untuk akun ChatCRM Anda.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password baru</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      className="h-11 pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konfirmasi password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ulangi password"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full bg-[#16A34A] text-base font-semibold text-white hover:bg-[#15803D]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : (
              <>
                Simpan password
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
