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
import { completeInviteServerFn } from "@/lib/invite-agent.fn";
import { useAuthCallbackReady } from "@/hooks/useAuthCallbackReady";
import {
  acceptInviteFormSchema,
  type AcceptInviteFormInput,
} from "@/lib/schemas/accept-invite";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/types";

export const Route = createFileRoute("/accept-invite")({
  head: () => ({
    meta: [{ title: "Terima Undangan — ChatCRM" }],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const router = useRouter();
  const { setNewPassword, signOut, user } = useAuthContext();
  const { ready, checking } = useAuthCallbackReady({ inviteOnly: true });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inviteRole = (user?.user_metadata?.role as Role | undefined) ?? undefined;
  const defaultName = (user?.user_metadata?.name as string | undefined) ?? "";

  const form = useForm<AcceptInviteFormInput>({
    resolver: zodResolver(acceptInviteFormSchema),
    defaultValues: { name: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (defaultName) {
      form.setValue("name", defaultName, { shouldValidate: true });
    }
  }, [defaultName, form]);

  const onSubmit = async (values: AcceptInviteFormInput) => {
    setSubmitting(true);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase belum dikonfigurasi");
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData.session) throw new Error("Sesi undangan tidak valid");

      await setNewPassword(values.password);

      await completeInviteServerFn({
        data: {
          accessToken: sessionData.session.access_token,
          name: values.name.trim(),
        },
      });

      await signOut();
      router.navigate({ to: "/", search: { invite: "done" } });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (!ready && !checking) {
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
      title="Lengkapi profil Anda"
      subtitle="Anda diundang ke workspace ini. Atur nama tampilan dan password untuk mengaktifkan akun."
    >
      {inviteRole && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Role:{" "}
          <span className="font-semibold text-slate-900">{ROLE_LABELS[inviteRole]}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama tampilan</FormLabel>
                <FormControl>
                  <Input placeholder="Nama lengkap" autoComplete="name" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
