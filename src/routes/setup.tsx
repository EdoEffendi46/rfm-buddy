import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
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
import { completeSetupFormSchema, type CompleteSetupFormInput } from "@/lib/schemas/setup";
import {
  completeInstanceSetupServerFn,
  getInstanceSetupStatusServerFn,
} from "@/lib/instance-setup.fn";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Setup Awal — ChatCRM" },
      { name: "description", content: "Konfigurasi awal ChatCRM untuk bisnis Anda." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const { signIn } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requiresToken, setRequiresToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    getInstanceSetupStatusServerFn()
      .then((s) => setRequiresToken(s.requiresSetupToken))
      .finally(() => setLoading(false));
  }, []);

  const form = useForm<CompleteSetupFormInput>({
    resolver: zodResolver(completeSetupFormSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      email: "",
      password: "",
      confirmPassword: "",
      setupToken: "",
    },
  });

  const onSubmit = async (values: CompleteSetupFormInput) => {
    setSubmitting(true);
    try {
      await completeInstanceSetupServerFn({
        data: values,
      });
      await signIn(values.email, values.password, true);
      toast.success("Setup selesai. Selamat datang!");
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <AuthLayout
        title="Setup tidak tersedia"
        subtitle="Mode demo lokal tidak memerlukan setup awal."
      >
        <Link to="/" className="text-sm font-medium text-[#128C7E] hover:underline">
          Kembali ke login demo
        </Link>
      </AuthLayout>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Setup awal ChatCRM"
      subtitle="Isi data bisnis dan akun owner. Hanya dilakukan sekali saat pertama kali deploy."
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p>
          Setelah setup, Anda bisa mengundang tim CS dan supervisor dari Pengaturan. Tidak ada
          pendaftaran publik.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama bisnis</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Toko Jaya Abadi" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama owner</FormLabel>
                <FormControl>
                  <Input placeholder="Nama lengkap pemilik" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email owner</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="owner@bisnis.com"
                    className="h-11"
                    {...field}
                  />
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
                    type={showPassword ? "text" : "password"}
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

          {requiresToken && (
            <FormField
              control={form.control}
              name="setupToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token setup</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="Dari deployer / env SETUP_TOKEN"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                Selesaikan setup
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
