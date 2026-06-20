import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
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
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth";
import { isPasswordSetupSession } from "@/lib/supabase/auth";

export const Route = createFileRoute("/accept-invite")({
  head: () => ({
    meta: [{ title: "Terima Undangan — ChatCRM" }],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const router = useRouter();
  const { setNewPassword, isAuthLoading } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    setReady(isPasswordSetupSession() || window.location.hash.includes("access_token"));
  }, [isAuthLoading]);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setSubmitting(true);
    try {
      await setNewPassword(values.password);
      toast.success("Password berhasil dibuat. Selamat datang di ChatCRM!");
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (!ready) {
    return (
      <AuthLayout
        title="Link undangan tidak valid"
        subtitle="Link mungkin kadaluarsa atau sudah dipakai. Minta owner mengirim ulang undangan."
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm text-slate-600">
            Buka link undangan terbaru dari email Anda, atau hubungi owner workspace.
          </p>
        </div>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-[#128C7E] hover:underline">
          Kembali ke login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Atur password Anda"
      subtitle="Anda diundang ke ChatCRM. Buat password untuk mulai menggunakan workspace."
    >
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
            className="h-11 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#128C7E]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan…
              </>
            ) : (
              <>
                Aktifkan akun
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
