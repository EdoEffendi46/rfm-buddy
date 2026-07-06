import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, Check } from "lucide-react";
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
  const { invite } = Route.useSearch();

  useEffect(() => {
    if (agent) router.navigate({ to: "/dashboard" });
  }, [agent, router]);

  if (!usesAuth) {
    return <DemoPickerLogin onLogin={demoLogin} />;
  }

  return <EmailLoginForm signIn={auth.signIn} inviteDone={invite === "done"} />;
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
    <AuthLayout title="Masuk ke ChatCRM" subtitle="Kelola inbox WhatsApp dan CRM tim Anda.">
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
                    className="text-xs font-medium text-[#15803D] hover:underline"
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
            className="h-11 w-full bg-[#16A34A] text-base font-semibold text-white hover:bg-[#15803D]"
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

  const ROLE_FULL: Record<Role, string> = {
    cs: "Customer Service",
    supervisor: "Supervisor",
    owner: "Owner",
  };
  const selectedAgent = AGENTS.find((a) => a.id === selected) ?? AGENTS[0];
  const firstName = selectedAgent.name.split(" ").slice(-1)[0];

  return (
    <AuthLayout title="Masuk ke workspace" subtitle="Pilih akun demo untuk melanjutkan.">
      <div className="space-y-2.5 stagger-children">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a.id)}
            className={cn(
              "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-150",
              selected === a.id
                ? "border-[#22C55E]/60 bg-[#22C55E]/[0.06] shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_12px_30px_rgba(0,0,0,0.35)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]",
            )}
          >
            <Avatar name={a.name} color={a.color} initials={a.initials} size={44} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#F4F4F5] tracking-tight">{a.name}</div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B6B72]">
                {ROLE_FULL[a.role as Role]}
              </div>
            </div>
            {selected === a.id ? (
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white animate-fade-in-up"
                style={{ background: "linear-gradient(180deg,#22C55E,#16A34A)" }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            ) : (
              <span className="h-6 w-6 shrink-0 rounded-full border border-white/[0.12]" />
            )}
          </button>
        ))}
      </div>
      <Button
        onClick={handleLogin}
        className="mt-6 h-12 w-full rounded-xl text-base font-semibold text-white"
        style={{
          background: "linear-gradient(180deg,#22C55E,#16A34A)",
          boxShadow: "0 8px 22px rgba(22,163,74,0.42), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        Masuk sebagai {firstName}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
      <p className="mt-4 text-center text-xs text-[#6B6B72]">
        Dengan masuk, Anda menyetujui Ketentuan Layanan.
      </p>
    </AuthLayout>
  );
}
