import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { DemoShortcuts } from "@/components/auth/DemoShortcuts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { DemoAccount } from "@/lib/auth/demo-accounts";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { AGENTS } from "@/data/agents";
import { Avatar } from "@/components/Avatar";
import { ROLE_DISPLAY } from "@/lib/permissions";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    invite: typeof search.invite === "string" ? search.invite : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Masuk — ChatCRM" },
      { name: "description", content: "Masuk ke ChatCRM untuk kelola inbox WA dan customer." },
      { property: "og:title", content: "Masuk — ChatCRM" },
      { property: "og:description", content: "Inbox & CRM fleksibel untuk bisnis apa saja." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { agent, login: demoLogin } = useAuth();
  const auth = useAuthContext();
  const usesAuth = isSupabaseConfigured();

  useEffect(() => {
    if (agent) router.navigate({ to: "/dashboard" });
  }, [agent, router]);

  if (!usesAuth) {
    return <DemoPickerLogin onLogin={demoLogin} />;
  }

  return <EmailLoginForm signIn={auth.signIn} inviteDone={Route.useSearch().invite === "done"} />;
}

function EmailLoginForm({
  signIn,
  inviteDone,
}: {
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  inviteDone?: boolean;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (inviteDone) {
      toast.success("Akun aktif. Silakan masuk dengan email dan password Anda.");
      router.navigate({ to: "/", search: {}, replace: true });
    }
  }, [inviteDone, router]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const email = form.watch("email");

  const fillDemo = (account: DemoAccount) => {
    form.setValue("email", account.email, { shouldValidate: true });
    form.setValue("password", account.password, { shouldValidate: true });
  };

  const onSubmit = async (values: LoginInput) => {
    setSubmitting(true);
    try {
      await signIn(values.email, values.password, values.rememberMe);
      toast.success("Selamat datang!");
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke ChatCRM"
      subtitle="Kelola inbox WhatsApp dan CRM tim Anda."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#128C7E] hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
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
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal text-slate-600">
                  Ingat saya di perangkat ini
                </FormLabel>
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
                Memproses…
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun? Hubungi owner bisnis Anda untuk mendapat undangan.
      </p>

      {import.meta.env.DEV && <DemoShortcuts onSelect={fillDemo} activeEmail={email} />}
    </AuthLayout>
  );
}

/** Fallback when Supabase env is not configured */
function DemoPickerLogin({ onLogin }: { onLogin: (agentId: string) => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState(AGENTS[0].id);

  const handleLogin = () => {
    onLogin(selected);
    toast.success("Selamat datang!");
    router.navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout title="Masuk ke ChatCRM" subtitle="Mode demo lokal — pilih role untuk masuk.">
      <div className="space-y-2">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
              selected === a.id
                ? "border-[#25D366] bg-[#25D366]/5 shadow-sm"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <Avatar name={a.name} color={a.color} initials={a.initials} size={40} />
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{a.name}</div>
              <div className="text-xs text-slate-500">{ROLE_DISPLAY[a.role as Role].subtitle}</div>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                ROLE_DISPLAY[a.role as Role].badgeClass,
              )}
            >
              {a.role}
            </span>
          </button>
        ))}
      </div>
      <Button
        onClick={handleLogin}
        className="mt-6 h-11 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#128C7E]"
      >
        Masuk
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </AuthLayout>
  );
}
